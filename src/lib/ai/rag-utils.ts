// ==================================================================
// ingest file json inovasi ke MongoDB dengan embedding vector
// ==================================================================

import { connectToDatabase } from "@/lib/db/mongodb"; 

// Fungsi untuk mengubah teks (pertanyaan user) menjadi Vector menggunakan Ollama lokal
export async function generateEmbeddings(text: string): Promise<number[]> {
  try {
    const response = await fetch("http://127.0.0.1:11434/api/embed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "nomic-embed-text", 
        input: text,
      }),
    });
    
    if (!response.ok) {
      const errorDetail = await response.text();
      throw new Error(`Ollama Error (HTTP ${response.status}): ${errorDetail}`);
    }

    const data = await response.json();
    return data.embeddings[0];
  } catch (error) {
    console.error("Error generate embedding:", error);
    throw error;
  }
}

export async function searchInnovation(query: string) {
  if (!query) return null;

  try {
    const db = await connectToDatabase();
    // Gunakan collection yang sama dengan file ingestion Anda
    const collection = db.collection("knowledge_base");

    // Ubah pertanyaan user menjadi vektor
    const queryVector = await generateEmbeddings(query);

    // Lakukan pencarian Semantic Vector di MongoDB Atlas
    const cursor = collection.aggregate([
      {
        $vectorSearch: {
          index: "vector_index", 
          path: "embedding_vector", 
          queryVector: queryVector,
          numCandidates: 5, // Mengambil 5 kandidat terdekat untuk dievaluasi
          limit: 3 // Mengambil 3 hasil paling relevan
        }
      },
      {
        $project: {
          embedding_vector: 0, 
          score: { $meta: "vectorSearchScore" } 
        }
      }
    ]);

    const results = await cursor.toArray();

    // Kembalikan data jika ada. 
    // Skor kemiripan (score) berkisar antara 0 - 1. Semakin mendekati 1 semakin mirip.
    // Kita set batas bawah 0.6 agar bot tidak menjawab ngawur jika pertanyaannya melenceng jauh.
    const validResults = results.filter(res => res.score > 0.6);

    if (validResults.length > 0) {
      console.log(`\nPencarian Berhasil (${validResults.length} Dokumen)`);
      validResults.forEach((doc, idx) => {
        console.log(`[${idx + 1}] ${doc.judul} (Skor: ${doc.score.toFixed(3)})`);
      });
      return validResults; // Mengembalikan kumpulan dokumen (Array)
    }

    console.log("Tidak ada dokumen yang mencapai batas skor relevansi.");
    return null;
  } catch (error) {
    console.error("Kesalahan pencarian Vector MongoDB:", error);
    return null;
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
//       const filePath = path.join(dirPath, file);
//       const fileContent = fs.readFileSync(filePath, "utf-8");
//       const data = JSON.parse(fileContent);

//       if (data.nodes && Array.isArray(data.nodes)) {
//         // Ekstrak nama bidang dari nama file (contoh: "hasil_inovasi_ipb_pangan.json" -> "pangan")
//         const categoryMatch = file.match(/hasil_inovasi_ipb_(.*?)\.json/);
//         const bidang = categoryMatch ? categoryMatch[1].toUpperCase() : "UMUM";

//         // Sisipkan informasi kategori ke dalam setiap node
//         const nodesWithMetadata = data.nodes.map((node: any) => ({
//           ...node,
//           kategori: bidang
//         }));

//         // Gabungkan ke array utama
//         allNodes = allNodes.concat(nodesWithMetadata);
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