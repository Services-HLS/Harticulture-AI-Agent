import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { question, language, role } = await req.json();
    // Get Supabase client to fetch training data
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Generate embedding for the question
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("VITE_GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const isTE = language === "te";
    const isLiveMarketQuery = (q: string): boolean => {
      const s = (q || "").toLowerCase();
      return (
        s.includes("tomato") ||
        s.includes("tomatoes") ||
        s.includes("టమాట") ||
        s.includes("price") ||
        s.includes("rate") ||
        s.includes("market") ||
        s.includes("mandi") ||
        s.includes("today") ||
        s.includes("live") ||
        s.includes("chilli") ||
        s.includes("mirchi") ||
        s.includes("మిర్చి")
      );
    };

    const hardcodedMarketReference = isTE
      ? `గుంటూరు రిఫరెన్స్ డేటా: ఎండు మిర్చి సగటు క్వింటల్‌కు పదిహేడు వేల ఐదు వందలు నుంచి పంతొమ్మిది వేల వరకు, తేజ ఎస్ పదిహేడు క్వింటల్‌కు పదిహేడు వేల నుంచి పంతొమ్మిది వేల ఐదు వందలు, మూడు మూడు నాలుగు సన్నం క్వింటల్‌కు పంతొమ్మిది వేల నుంచి ఇరవై మూడు వేల వరకు. టమాట సుమారుగా కిలోకు ముప్పై ఐదు, ఉల్లి యాభై, ఆలూ యాభై, వంకాయ ముప్పై, బెండకాయ నలభై.`
      : `Guntur reference data: dry chilli average about ₹17,500-₹19,000/quintal, Teja S17 about ₹17,000-₹19,500, 334 Sannam about ₹19,000-₹23,000. Tomato about ₹35/kg, onion ₹50/kg, potato ₹50/kg, brinjal ₹30/kg, okra ₹40/kg (indicative).`;

    const askGroundedLiveGemini = async (): Promise<string> => {
      const livePrompt = `
You are AgriSense market assistant for role "${role}".
Answer using live online data and return EXACTLY 3 lines.
No markdown, no bullets, no extra text.
${isTE
  ? "Respond only in Telugu."
  : "Respond only in English."}

Use this hardcoded reference as baseline and then verify/update with live search:
${hardcodedMarketReference}

Line 1: direct answer with commodity and location if present.
Line 2: latest date/time + price/range + short source hint.
Line 3: actionable suggestion for ${role}.

User question: ${question}
      `.trim();

      const groundedUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
      const groundedRes = await fetch(groundedUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: livePrompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: {
            temperature: 0.2,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 256,
          },
        }),
      });
      if (!groundedRes.ok) {
        throw new Error(`Grounded Gemini failed: ${groundedRes.status}`);
      }
      const groundedData = await groundedRes.json();
      return groundedData?.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
    };

    if (isLiveMarketQuery(question)) {
      const answer = await askGroundedLiveGemini();
      return new Response(JSON.stringify({ answer }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Generating embedding for question...");
    const embedUrl = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`;
    const embedResponse = await fetch(embedUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { parts: [{ text: question }] }
      }),
    });

    if (!embedResponse.ok) {
      throw new Error(`Embedding API failed: ${await embedResponse.text()}`);
    }

    const embedData = await embedResponse.json();
    const queryEmbedding = embedData.embedding.values;

    // 2. Perform semantic search in Vector DB
    console.log(`Searching Vector DB for role: ${role}...`);
    const { data: matchedDocs, error: matchError } = await supabase.rpc("match_documents", {
      query_embedding: queryEmbedding,
      match_threshold: 0.3, // Lower threshold for better recall
      match_count: 5,        // Top 5 relevant chunks
      filter_role: role
    });

    if (matchError) {
      console.error("Match documents error:", matchError);
      throw matchError;
    }

    const trainingContext = (matchedDocs || [])
      .map((d: any) => d.content)
      .join("\n\n---\n\n");

    const systemPrompt = `You are the Horticulture Smart Market Intelligence AI Assistant for the Government of Andhra Pradesh.

ROLE: You are assisting a "${role}" user.
LANGUAGE: Respond in ${language === "te" ? "Telugu" : "English"}.

CRITICAL RULES:
1. ONLY answer based on the TRAINING DATA provided below.
2. If the answer is not in the training data, still provide the best possible general answer in exactly 3 lines.
3. For farmer role: provide simple, actionable advice about market prices, weather, crop recommendations.
4. For district_officer role: provide analytical insights, trends, planning data.
5. Provide relevant information ONLY from the data. Do NOT mention "based on the provided context" or similar phrases. Just answer directly.
6. Output format must be EXACTLY 3 lines. No markdown, no bullets.

TRAINING DATA snippest:
${trainingContext || "No highly relevant training data found for this specific query."}`;

    // Use already defined Gemini API Key
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: systemPrompt },
              { text: `Question: ${question}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", response.status, errText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";

    const normalized = (answer || "").toLowerCase();
    const isUnavailable =
      normalized.includes("not available in the training data") ||
      normalized.includes("no highly relevant training data found") ||
      normalized.includes("క్షమించండి, ఈ సమాచారం శిక్షణ డేటాలో అందుబాటులో లేదు");

    if (isUnavailable) {
      const liveAnswer = await askGroundedLiveGemini();
      return new Response(JSON.stringify({ answer: liveAnswer }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("query-trained-data error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
