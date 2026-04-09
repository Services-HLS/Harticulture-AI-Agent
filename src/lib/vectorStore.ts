import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

interface LocalDocument {
  id: string;
  fileName: string;
  fileType: string;
  role: string | null;
  content: string;
  embeddings: {
    text: string;
    vector: number[];
  }[];
  createdAt: string;
}

type AppRole = Database["public"]["Enums"]["app_role"];
type SearchMatch = { text: string; score: number; role: string | null };
type RemoteMatchRow = { content: string; similarity: number; target_role: AppRole | null };
type RemoteDocRow = {
  id: string;
  file_name: string;
  file_type: string;
  created_at: string;
  status: string;
  target_role?: AppRole | null;
};

class LocalVectorStore {
  private documents: LocalDocument[] = [];
  private apiKey: string;
  private useRemote: boolean;
  private allowLocalTraining: boolean;

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
    this.useRemote = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
    this.allowLocalTraining = String(import.meta.env.VITE_ALLOW_LOCAL_TRAINING || "").toLowerCase() === "true";
    if (!this.useRemote || this.allowLocalTraining) {
      this.loadFromStorage();
    }
  }

  private loadFromStorage() {
    const stored = localStorage.getItem("agrisense_local_docs");
    if (stored) {
      try {
        this.documents = JSON.parse(stored);
      } catch (e) {
        console.error("Failed to load local docs:", e);
        this.documents = [];
      }
    }
  }

  private saveToStorage() {
    localStorage.setItem("agrisense_local_docs", JSON.stringify(this.documents));
  }

  private normalizeRole(role: string | null): AppRole | null {
    if (role === "admin" || role === "district_officer" || role === "farmer") {
      return role;
    }
    return null;
  }

  private isTargetRoleSchemaError(error: unknown): boolean {
    if (!error || typeof error !== "object") return false;
    const e = error as { code?: string; message?: string; details?: string };
    const payload = `${e.code || ""} ${e.message || ""} ${e.details || ""}`.toLowerCase();
    return payload.includes("target_role") && (payload.includes("column") || payload.includes("schema"));
  }

  private ensureCloudPersistenceConfigured() {
    if (!this.useRemote && !this.allowLocalTraining) {
      throw new Error(
        "Cloud persistence is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY."
      );
    }
  }

  async addDocument(fileName: string, fileType: string, role: string | null, text: string) {
    this.ensureCloudPersistenceConfigured();

    if (!this.apiKey) {
      throw new Error("Gemini API Key is missing. Please check your .env file.");
    }
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

    // Chunk text
    const chunks = this.chunkText(text, 1000);
    const docId = crypto.randomUUID();

    const embeddings = await Promise.all(
      chunks.map(async (chunk) => {
        const result = await model.embedContent(chunk);
        return {
          text: chunk,
          vector: Array.from(result.embedding.values) as number[],
        };
      })
    );

    const newDoc: LocalDocument = {
      id: docId,
      fileName,
      fileType,
      role,
      content: text,
      embeddings,
      createdAt: new Date().toISOString(),
    };

    if (this.useRemote) {
      const normalizedRole = this.normalizeRole(role);
      const insertPayload = {
        uploaded_by: "demo-admin",
        file_name: fileName,
        file_type: fileType,
        file_path: `browser://${docId}`,
        extracted_text: text.substring(0, 100000),
        status: "ready",
        target_role: normalizedRole,
      };

      let { data: insertedDoc, error: docError } = await supabase
        .from("training_documents")
        .insert(insertPayload)
        .select("id")
        .single();

      if (docError && this.isTargetRoleSchemaError(docError)) {
        const legacyPayload = {
          uploaded_by: "demo-admin",
          file_name: fileName,
          file_type: fileType,
          file_path: `browser://${docId}`,
          extracted_text: text.substring(0, 100000),
          status: "ready",
        };
        const fallbackResult = await supabase
          .from("training_documents")
          .insert(legacyPayload)
          .select("id")
          .single();
        insertedDoc = fallbackResult.data;
        docError = fallbackResult.error;
      }

      if (docError || !insertedDoc) {
        throw new Error(docError?.message || "Failed to save training document to cloud.");
      }

      const rows = embeddings.map((emb) => ({
        document_id: insertedDoc.id,
        content: emb.text,
        embedding: emb.vector,
        target_role: normalizedRole,
      }));

      const { error: embError } = await supabase.from("document_embeddings").insert(rows);
      if (embError) {
        await supabase.from("training_documents").delete().eq("id", insertedDoc.id);
        throw new Error(embError.message || "Failed to save document embeddings.");
      }
    } else {
      this.documents.push(newDoc);
      this.saveToStorage();
    }

    return newDoc;
  }

  async search(query: string, role: string | null, limit: number = 5) {
    this.ensureCloudPersistenceConfigured();

    if (!this.apiKey) return [];
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const queryResult = await model.embedContent(query);
    const queryVector = Array.from(queryResult.embedding.values) as number[];

    if (this.useRemote) {
      const normalizedRole = this.normalizeRole(role);
      const { data, error } = await supabase.rpc("match_documents", {
        query_embedding: queryVector,
        match_threshold: 0.3,
        match_count: limit,
        filter_role: normalizedRole,
      });

      if (error) {
        throw new Error(error.message || "Failed to search training data.");
      }

      return ((data || []) as RemoteMatchRow[]).map((row) => ({
        text: row.content,
        score: row.similarity,
        role: row.target_role,
      })) as SearchMatch[];
    }

    const matches: SearchMatch[] = [];

    this.documents.forEach((doc) => {
      // Filter by role if specified
      if (role && doc.role && doc.role !== role) return;

      doc.embeddings.forEach((emb) => {
        const score = this.cosineSimilarity(queryVector, emb.vector);
        matches.push({ text: emb.text, score, role: doc.role });
      });
    });

    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async getDocuments() {
    this.ensureCloudPersistenceConfigured();

    if (this.useRemote) {
      const { data, error } = await supabase
        .from("training_documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message || "Failed to load documents.");
      }

      return ((data || []) as RemoteDocRow[]).map((doc) => ({
        id: doc.id,
        file_name: doc.file_name,
        file_type: doc.file_type,
        created_at: doc.created_at,
        status: doc.status,
        target_role: doc.target_role ?? null,
      }));
    }

    return this.documents.map((d) => ({
      id: d.id,
      file_name: d.fileName,
      file_type: d.fileType,
      target_role: d.role,
      created_at: d.createdAt,
      status: "ready",
    }));
  }

  async deleteDocument(id: string) {
    this.ensureCloudPersistenceConfigured();

    if (this.useRemote) {
      const { error } = await supabase.from("training_documents").delete().eq("id", id);
      if (error) {
        throw new Error(error.message || "Failed to delete document.");
      }
      return;
    }

    this.documents = this.documents.filter((d) => d.id !== id);
    this.saveToStorage();
  }

  private chunkText(text: string, size: number) {
    const words = text.split(/\s+/);
    const chunks = [];
    for (let i = 0; i < words.length; i += size) {
      chunks.push(words.slice(i, i + size).join(" "));
    }
    return chunks;
  }

  private cosineSimilarity(vec1: number[], vec2: number[]) {
    if (!vec1 || !vec2 || vec1.length !== vec2.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      normA += vec1[i] * vec1[i];
      normB += vec2[i] * vec2[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

export const vectorStore = new LocalVectorStore();
