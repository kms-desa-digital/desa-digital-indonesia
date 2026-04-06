// ==================================================================
// ingest file json inovasi ke MongoDB dengan embedding vector
// ==================================================================

import { connectToDatabase } from "@/lib/db/mongodb";

import { GoogleGenerativeAI } from "@google/generative-ai";

// Konfigurasi Google AI 
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");
const EMBEDDING_MODEL_GOOGLE = "text-embedding-004";

// Fungsi untuk generate embedding 
export async function generateEmbeddings(text: string): Promise<number[]> {
  try {
    // --- Ollama Implementation ---
    /*
    const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434";
    const OLLAMA_EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL ?? "embeddinggemma:latest";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    const response = await fetch(`${OLLAMA_BASE_URL}/api/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: OLLAMA_EMBED_MODEL, input: text }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) throw new Error(`Ollama Error: ${response.status}`);
    const data = await response.json();
    const vector = data.embeddings?.[0];
    if (!vector) throw new Error("Ollama Error: Empty embedding");
    return vector;
    */
    // -----------------------------------------

    // --- Google Gemini Implementation ---
    const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL_GOOGLE });
    const result = await model.embedContent(text);
    const vector = result.embedding.values;

    if (!Array.isArray(vector) || vector.length === 0) {
      throw new Error("Google AI Error: embedding kosong");
    }

    return vector;
    // ------------------------------------
  } catch (error) {
    console.error("Error generate embedding:", error);
    throw error;
  }
}

// Intent Detection untuk query pengguna, agar bisa prioritaskan pencarian di collection yang relevan
export type QueryIntent = {
  isVillage: boolean;
  isInnovation: boolean;
  isInnovator: boolean;
  primary: "village" | "innovation" | "innovator" | "general";
};

export function detectQueryIntent(query: string): QueryIntent {
  const q = query.toLowerCase();

  const villageKeywords = [
    "desa", "village", "kelurahan", "kampung",
    "wilayah", "lokasi desa", "profil desa",
    "potensi desa", "mana yang menerapkan",
    "desa mana", "desa apa", "desa yang",
    "sudah menerapkan", "sudah menggunakan",
    "menerapkan inovasi", "menggunakan inovasi",
  ];

  const innovationKeywords = [
    "inovasi", "innovation", "teknologi", "solusi",
    "aplikasi", "sistem", "platform", "produk",
    "alat", "tools", "fitur", "cara kerja",
    "harga", "biaya", "manfaat inovasi",
    "kategori inovasi", "rekomendasi inovasi",
  ];

  const innovatorKeywords = [
    "inovator", "innovator", "pembuat", "pengembang",
    "siapa yang membuat", "siapa yang mengembangkan",
    "perusahaan", "lembaga", "organisasi",
    "kontak inovator", "profil inovator",
    "ingin menjadi inovator", "daftar inovator",
  ];

  const isVillage = villageKeywords.some((k) => q.includes(k));
  const isInnovation = innovationKeywords.some((k) => q.includes(k));
  const isInnovator = innovatorKeywords.some((k) => q.includes(k));

  let primary: QueryIntent["primary"] = "general";

  if (isVillage && isInnovation) {
    primary = "innovation"; // Prioritaskan inovasi jika keduanya ada (misal: inovasi di desa)
  } else if (isVillage) {
    primary = "village";
  } else if (isInnovator) {
    primary = "innovator";
  } else if (isInnovation) {
    primary = "innovation";
  }

  console.log(`\nIntent Detected: primary=${primary.toUpperCase()}`);
  console.log(`  isVillage=${isVillage} | isInnovation=${isInnovation} | isInnovator=${isInnovator}`);

  return { isVillage, isInnovation, isInnovator, primary };
}

// Search doc_embeddings 
export async function searchDocEmbeddings(query: string) {
  if (!query) return null;

  try {
    const db = await connectToDatabase();
    const collection = db.collection("doc_embeddings");

    const queryVector = await generateEmbeddings(query);

    const cursor = collection.aggregate([
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding_vector",
          queryVector: queryVector,
          numCandidates: 100,
          limit: 20,
        },
      },
      {
        $project: {
          embedding_vector: 0,
          score: { $meta: "vectorSearchScore" },
        },
      },
    ]);

    const results = await cursor.toArray();

    const validResults = results.filter((res) => res.score > 0.6);

    if (validResults.length > 0) {
      console.log(`\nPencarian doc berhasil (${validResults.length} data)`);
      validResults.forEach((doc, i) => {
        console.log(`  ${i + 1}. ${doc.judul ?? doc.content?.slice(0, 50)} (score: ${doc.score.toFixed(3)})`);
      });
      return validResults;
    }

    console.log("Tidak ada hasil doc yang cukup relevan");
    return null;
  } catch (error) {
    console.error("Error saat pencarian doc_embeddings:", error);
    return null;
  }
}

// Search database embeddings 
export async function searchDatabaseEmbeddings(
  query: string,
  intent?: QueryIntent
) {
  if (!query) return [];

  try {
    const db = await connectToDatabase();
    const collection = db.collection("db_embeddings");

    const queryVector = await generateEmbeddings(query);

    // Tentukan collection mana yang di-search berdasarkan intent
    let collectionFilter: string[] = [];

    if (intent) {
      if (intent.isVillage && intent.isInnovation) {
        // Query campuran → search desa dan inovasi sekaligus
        collectionFilter = ["villages", "innovations"];
      } else if (intent.primary === "village") {
        collectionFilter = ["villages"];
      } else if (intent.primary === "innovation") {
        collectionFilter = ["innovations"];
      } else if (intent.primary === "innovator") {
        collectionFilter = ["innovators"];
      } else {
        // general search semua collection
        collectionFilter = ["innovations", "villages", "innovators", "claimInnovations"];
      }
    } else {
      // Tidak ada intent search semua
      collectionFilter = ["innovations", "villages", "innovators", "claimInnovations"];
    }

    console.log(`\nCollection filter: [${collectionFilter.join(", ")}]`);

    // Pipeline dengan pre-filter by source_collection
    const pipeline: any[] = [
      {
        $vectorSearch: {
          index: "vector_index_db",
          path: "embedding_vector",
          queryVector: queryVector,
          numCandidates: 100,
          limit: 20,
          filter: {
            source_collection: { $in: collectionFilter },
          },
        },
      },
      {
        $project: {
          embedding_vector: 0,
          score: { $meta: "vectorSearchScore" },
        },
      },
    ];

    const results = await collection.aggregate(pipeline).toArray();

    return results.filter((res) => res.score > 0.6);
  } catch (error) {
    console.error("Error saat pencarian db_embeddings:", error);
    return [];
  }
}

// Search kedua sumber sekaligus dengan prioritas berdasarkan intent
export async function searchAllSources(query: string) {
  if (!query) return { docResults: [], dbResults: [], intent: null };

  try {
    // Deteksi intent terlebih dahulu
    const intent = detectQueryIntent(query);

    // Jalankan paralel
    const [docResults, dbResults] = await Promise.all([
      searchDocEmbeddings(query).then((res: any) => res ?? []),
      searchDatabaseEmbeddings(query, intent),
    ]);

    console.log(`\nSearch Results: doc=${docResults.length}, db=${dbResults.length}`);

    if (docResults.length > 0) {
      console.log("--- Hasil dari doc_embeddings ---");
      docResults.forEach((doc: any, i: number) => {
        console.log(
          `  ${i + 1}. ${doc.judul ?? doc.content?.slice(0, 50)} (score: ${doc.score?.toFixed(3)})`
        );
      });
    }

    if (dbResults.length > 0) {
      console.log("--- Hasil dari db_embeddings ---");
      dbResults.forEach((doc: any, i: number) => {
        console.log(
          `  ${i + 1}. [${doc.source_collection}] ${doc.metadata?.label ?? "?"} (score: ${doc.score?.toFixed(3)})`
        );
      });
    }

    return { docResults, dbResults, intent };
  } catch (error) {
    console.error("Error searchAllSources:", error);
    return { docResults: [], dbResults: [], intent: null };
  }
}


// ==================================================================
// index pake json tanpa MongoDB, langsung baca dari folder public/documents
// ==================================================================

// import fs from "fs";
// import path from "path";

// export interface InnovationNode {
//   id?: string;
//   node_id?: string;
//   kategori?: string; 
//   details?: {
//     judul?: string;
//     deskripsi?: string;
//     perspektif?: string;
//     keunggulan_inovasi?: string | string[];
//     potensi_aplikasi?: string;
//     inovator?: {
//       nama?: string | string[];
//       status_paten?: string;
//     };
//   };
// }

// let cachedNodes: InnovationNode[] | null = null;

// function getJsonData(): InnovationNode[] {
//   if (cachedNodes) return cachedNodes;

//   try {
//     const dirPath = path.join(process.cwd(), "public", "documents");
    
//     if (!fs.existsSync(dirPath)) {
//       console.error("Folder documents tidak ditemukan:", dirPath);
//       return [];
//     }

//     // Baca semua nama file di dalam folder documents
//     const files = fs.readdirSync(dirPath).filter(file => file.endsWith('.json'));
//     let allNodes: InnovationNode[] = [];

//     // Looping untuk membuka dan menggabungkan setiap file JSON
//     for (const file of files) {
//       try {
//         const filePath = path.join(dirPath, file);
//         const fileContent = fs.readFileSync(filePath, "utf-8");
//         // Hilangkan BOM UTF-8 agar JSON.parse tidak gagal pada karakter awal tersembunyi.
//         const sanitizedContent = fileContent.replace(/^\uFEFF/, "");
//         const data = JSON.parse(sanitizedContent);

//         if (data.nodes && Array.isArray(data.nodes)) {
//           // Ekstrak nama bidang dari nama file (contoh: "hasil_inovasi_ipb_pangan.json" -> "pangan")
//           const categoryMatch = file.match(/hasil_inovasi_ipb_(.*?)\.json/);
//           const bidang = categoryMatch ? categoryMatch[1].toUpperCase() : "UMUM";

//           // Sisipkan informasi kategori ke dalam setiap node
//           const nodesWithMetadata = data.nodes.map((node: any) => ({
//             ...node,
//             kategori: bidang
//           }));

//           // Gabungkan ke array utama
//           allNodes = allNodes.concat(nodesWithMetadata);
//         }
//       } catch (fileError) {
//         console.error(`Gagal parse file JSON: ${file}`, fileError);
//       }
//     }

//     cachedNodes = allNodes;
//     console.log(`Berhasil memuat ${allNodes.length} inovasi dari ${files.length} file JSON.`);
//     return cachedNodes as InnovationNode[];
    
//   } catch (error) {
//     console.error("Gagal membaca folder/file JSON:", error);
//     return [];
//   }
// }

// function normalize(text: string): string {
//   if (!text) return "";
//   return text
//     .toLowerCase()
//     .replace(/[^a-z0-9\s]/g, "")
//     .replace(/\s+/g, " ")
//     .trim();
// }

// export function searchInnovation(query: string): InnovationNode | null {
//   const nodes = getJsonData();
//   if (!query || nodes.length === 0) return null;

//   const normalizedQuery = normalize(query);
//   const keywords = normalizedQuery.split(" ").filter(w => w.length > 0);

//   let bestMatch: InnovationNode | null = null;
//   let highestScore = 0;

//   for (const node of nodes) {
//     const details = node.details;
//     if (!details) continue;

//     const judul = normalize(details.judul ?? "");
//     const kategori = normalize(node.kategori ?? ""); 

//     const rawKeunggulan = details.keunggulan_inovasi;
//     const keunggulanText = Array.isArray(rawKeunggulan) ? rawKeunggulan.join(" ") : (rawKeunggulan ?? "");

//     const rawNama = details.inovator?.nama;
//     const inovatorText = Array.isArray(rawNama) ? rawNama.join(" ") : (rawNama ?? "");

//     const combinedText = normalize(`
//       ${kategori}
//       ${details.judul ?? ""}
//       ${details.deskripsi ?? ""}
//       ${details.perspektif ?? ""}
//       ${keunggulanText}
//       ${details.potensi_aplikasi ?? ""}
//       ${inovatorText}
//       ${details.inovator?.status_paten ?? ""}
//     `);

//     let score = 0;

//     for (const keyword of keywords) {
//       if (judul.includes(keyword)) {
//         score += 3; 
//       } else if (kategori.includes(keyword)) {
//         score += 2; 
//       } else if (combinedText.includes(keyword)) {
//         score += 1;
//       }
//     }

//     if (score > highestScore) {
//       highestScore = score;
//       bestMatch = node;
//     }
//   }

//   if (highestScore < 2) return null;

//   return bestMatch;
// }


// ==================================================================
// dokumen langsung
// ==================================================================

// import { createOpenAI } from "@ai-sdk/openai";
// import { embed } from "ai";
// import { createRequire } from "module";
// import { connectToDatabase } from "../db/mongodb";

// const require = createRequire(import.meta.url);
// const pdfParse = require("pdf-parse");

// // Setup Ollama untuk Embedding Lokal
// const ollama = createOpenAI({
//   baseURL: "http://localhost:11434/v1",
//   apiKey: "ollama",
//   fetch: (url, init) => {
//     const controller = new AbortController();
//     const timeout = setTimeout(() => controller.abort(), 30000);
//     return fetch(url, { ...init, signal: controller.signal })
//       .finally(() => clearTimeout(timeout));
//   },
// });

// interface KnowledgeDoc {
//   source: string;
//   content: string;
//   score?: number;
// }

// function normalizeText(text: string) {
//   return (text ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
// }

// function cleanAndTrim(text: string, maxChars = 1500) {
//   const cleaned = normalizeText(text);
//   return cleaned.length > maxChars ? cleaned.slice(0, maxChars) + "…" : cleaned;
// }

// function dedupByContent(docs: KnowledgeDoc[]): KnowledgeDoc[] {
//   const seen = new Set<string>();
//   const out: KnowledgeDoc[] = [];
//   for (const d of docs) {
//     const key = (d.content ?? "").slice(0, 300);
//     if (!key || seen.has(key)) continue;
//     seen.add(key);
//     out.push(d);
//   }
//   return out;
// }

// const EMBED_MODEL = "nomic-embed-text"; // Menggunakan model lokal Ollama
// const EXPECTED_DIM = 768;

// export async function generateEmbeddings(text: string) {
//   const cleanText = normalizeText(text);
//   if (!cleanText || cleanText.length < 5) throw new Error("Text too short");

//   const { embedding } = await embed({
//     model: ollama.embedding(EMBED_MODEL),
//     value: cleanText,
//   });
//   return embedding;
// }

// export async function searchSimilarContext(userQuery: string) {
//   try {
//     const db = await connectToDatabase();
//     const collection = db.collection("knowledge_base");

//     // 1. Ubah pertanyaan jadi vektor pakai Ollama
//     const userQueryEmbedding = await generateEmbeddings(userQuery);

//     // 2. Cari di MongoDB Atlas
//     const rawDocs = await collection.aggregate([
//       {
//         $vectorSearch: {
//           index: "vector_index",
//           path: "embedding_vector",
//           queryVector: userQueryEmbedding,
//           numCandidates: 100,
//           limit: 10,
//         },
//       },
//       {
//         $project: { _id: 0, source: 1, content: 1, score: { $meta: "vectorSearchScore" } },
//       },
//     ]).toArray();

//     const docs: KnowledgeDoc[] = rawDocs
//       .map((d: any) => ({
//         source: String(d.source ?? ""),
//         content: String(d.content ?? ""),
//         score: typeof d.score === "number" ? d.score : undefined,
//       }))
//       .filter((d) => d.source && d.content);

//     const MIN_SCORE = 0.60;
//     const topDocs = dedupByContent(docs)
//       .filter((d) => (d.score ?? 0) >= MIN_SCORE)
//       .slice(0, 5)
//       .map((d) => ({ ...d, content: cleanAndTrim(d.content, 1200) }));

//     if (topDocs.length > 0) {
//       // Log skor Vector Search di terminal
//       console.log("\n=== Hasil Ranking Vector Search ===");
//       topDocs.forEach((doc, index) => {
//         console.log(`Rank ${index + 1} | Score: ${doc.score?.toFixed(4)} | Sumber: ${doc.source}`);
//       });

//       return topDocs.map((d, i) => `[Sumber: ${d.source}]\n${d.content}`).join("\n\n---\n\n");
//     }

//     return "";
//   } catch (error) {
//     console.error("Vector search error:", error);
//     return "";
//   }
// }

// export async function parsePdf(buffer: Buffer) {
//   if (typeof pdfParse === "function") {
//     const data = await pdfParse(buffer);
//     return data.text ?? "";
//   } else if (pdfParse && pdfParse.PDFParse) {
//     const instance = new pdfParse.PDFParse({ data: buffer });
//     const data = await instance.getText();
//     return data.text ?? "";
//   }
//   return "";
// }