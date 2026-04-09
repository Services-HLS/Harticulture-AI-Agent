import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { filePath, fileName } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("VITE_GEMINI_API_KEY");

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("training-documents")
      .download(filePath);

    if (downloadError || !fileData) {
      console.error("Download error:", downloadError);
      await supabase
        .from("training_documents")
        .update({ status: "error" })
        .eq("file_path", filePath);
      return new Response(JSON.stringify({ error: "Failed to download file" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract text based on file type
    let extractedText = "";
    const ext = fileName.toLowerCase().split(".").pop();

    if (ext === "txt" || ext === "csv") {
      extractedText = await fileData.text();
    } else if (["pdf", "doc", "docx", "xls", "xlsx", "pptx", "ppt"].includes(ext || "")) {
      if (GEMINI_API_KEY) {
        console.log(`Extracting text from ${fileName} using Gemini...`);
        const arrayBuffer = await fileData.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        
        let mimeType = "application/octet-stream";
        if (ext === "pdf") mimeType = "application/pdf";
        else if (ext === "docx") mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        else if (ext === "xlsx") mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

        try {
          const aiResponse = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: "Extract all readable text from this document. Return only the raw text content without any summaries or conversation." },
                    {
                      inline_data: {
                        mime_type: mimeType,
                        data: base64
                      }
                    }
                  ]
                }
              ]
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            extractedText = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
          } else {
            const errText = await aiResponse.text();
            console.error("Gemini extraction failed:", errText);
            throw new Error(`Gemini extraction failed with status ${aiResponse.status}`);
          }
        } catch (err) {
          console.error("Error during Gemini extraction:", err);
          try {
            extractedText = await fileData.text();
          } catch {
            extractedText = `[Error processing ${fileName}]`;
          }
        }
      } else {
        extractedText = `[GEMINI_API_KEY not configured]`;
      }
    } else {
      try {
        extractedText = await fileData.text();
      } catch {
        extractedText = `[Binary file: ${fileName}]`;
      }
    }

    // Get document role
    const { data: docInfo } = await supabase
      .from("training_documents")
      .select("target_role, id")
      .eq("file_path", filePath)
      .single();

    // Update document record
    await supabase
      .from("training_documents")
      .update({
        extracted_text: extractedText.substring(0, 100000),
        status: extractedText ? "ready" : "error",
      })
      .eq("file_path", filePath);

    // Generate embeddings if text extraction was successful
    if (extractedText && GEMINI_API_KEY && docInfo) {
      console.log(`Generating embeddings for ${fileName}...`);
      
      // Chunk text into parts of roughly 2500 characters
      const chunks = [];
      const chunkSize = 2500;
      for (let i = 0; i < extractedText.length; i += chunkSize) {
        chunks.push(extractedText.substring(i, i + chunkSize));
      }

      for (const chunk of chunks) {
        if (!chunk.trim()) continue;

        try {
          const embedUrl = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`;
          const embedResponse = await fetch(embedUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: { parts: [{ text: chunk }] }
            }),
          });

          if (embedResponse.ok) {
            const embedData = await embedResponse.json();
            const embedding = embedData.embedding.values;

            // Store in document_embeddings
            const { error: insertError } = await supabase
              .from("document_embeddings")
              .insert({
                document_id: docInfo.id,
                content: chunk,
                embedding: embedding,
                target_role: docInfo.target_role
              });

            if (insertError) console.error("Error inserting embedding:", insertError);
          } else {
            console.error("Embedding API failed:", await embedResponse.text());
          }
        } catch (err) {
          console.error("Error during embedding generation:", err);
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("process-document error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
