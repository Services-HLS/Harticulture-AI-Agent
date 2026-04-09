import { GoogleGenerativeAI } from "@google/generative-ai";

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

class LocalVectorStore {
  private documents: LocalDocument[] = [];
  private apiKey: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
    this.loadFromStorage();
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

  async addDocument(fileName: string, fileType: string, role: string | null, text: string) {
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

    this.documents.push(newDoc);
    this.saveToStorage();
    return newDoc;
  }

  async search(query: string, role: string | null, limit: number = 5) {
    if (!this.apiKey) return [];
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const queryResult = await model.embedContent(query);
    const queryVector = Array.from(queryResult.embedding.values) as number[];

    const matches: { text: string; score: number; role: string | null }[] = [];

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

  getDocuments() {
    return this.documents.map(d => ({
      id: d.id,
      file_name: d.fileName,
      file_type: d.fileType,
      target_role: d.role,
      created_at: d.createdAt,
      status: "ready"
    }));
  }

  deleteDocument(id: string) {
    this.documents = this.documents.filter(d => d.id !== id);
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
