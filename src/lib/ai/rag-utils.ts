// ==================================================================
// RAG Utilities: embedding generation, intent detection, role-based
// collection filtering, dan parallel search di doc + db embeddings
// ==================================================================

import { connectToDatabase } from "@/lib/db/mongodb";

// Konfigurasi via environment variables
const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
const OLLAMA_EMBED_MODEL =
  process.env.OLLAMA_EMBED_MODEL || "embeddinggemma:latest";
const VECTOR_SCORE_THRESHOLD = parseFloat(
  process.env.VECTOR_SCORE_THRESHOLD || "0.6"
);
const OLLAMA_TIMEOUT_MS = parseInt(
  process.env.OLLAMA_TIMEOUT_MS || "30000",
  10
);

// Types

export type UserRole =
  | "admin"
  | "kementerian"
  | "innovator"
  | "village"
  | "guest";

export type QueryIntent = {
  isVillage: boolean;
  isInnovation: boolean;
  isInnovator: boolean;
  isStats: boolean;
  primary: "village" | "innovation" | "innovator" | "stats" | "general";
};

export type SearchResult = {
  docResults: any[];
  dbResults: any[];
  intent: QueryIntent | null;
};

// Role permission matrix
// Mendefinisikan dengan jelas apa yang boleh diakses tiap role.
// Satu tempat — mudah diaudit dan diubah.

const ROLE_ALLOWED_COLLECTIONS: Record<UserRole, string[]> = {
  admin: ["innovations", "villages", "innovators", "claimInnovations"],
  kementerian: ["innovations", "villages"],
  innovator: ["innovations", "innovators"],
  village: ["innovations", "villages"],
  guest: ["innovations", "villages", "innovators"],
};

/**
 * Kembalikan daftar collection yang boleh diakses role tertentu,
 * dipersempit lagi berdasarkan intent query jika memungkinkan.
 */
export function buildCollectionFilter(
  intent: QueryIntent,
  role: UserRole | string
): string[] {
  const normalizedRole = normalizeRole(role);
  const allowed = ROLE_ALLOWED_COLLECTIONS[normalizedRole];

  // Jika intent sudah spesifik, intersect dengan allowed collection role
  if (intent.primary === "village") {
    return allowed.filter((c) => ["villages"].includes(c));
  }
  if (intent.primary === "innovation") {
    return allowed.filter((c) => ["innovations"].includes(c));
  }
  if (intent.primary === "innovator") {
    return allowed.filter((c) => ["innovators", "innovations"].includes(c));
  }
  // stats atau general: kembalikan semua yang diizinkan untuk role ini
  return allowed;
}

/**
 * Normalisasi string role ke UserRole yang valid.
 * Fallback ke "guest" agar aman.
 */
export function normalizeRole(role: string): UserRole {
  const valid: UserRole[] = [
    "admin",
    "kementerian",
    "innovator",
    "village",
    "guest",
  ];
  const lower = (role || "").toLowerCase() as UserRole;
  return valid.includes(lower) ? lower : "guest";
}

// Embedding generation

export async function generateEmbeddings(text: string): Promise<number[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/embed`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Bypass-Tunnel-Reminder": "true",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({ model: OLLAMA_EMBED_MODEL, input: text }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Ollama HTTP ${response.status}`);
    }

    const data = await response.json();
    const vector: number[] | null = Array.isArray(data?.embeddings)
      ? data.embeddings[0]
      : data?.embedding ?? null;

    if (!vector || vector.length === 0) {
      throw new Error("Embedding kosong atau tidak valid dari Ollama");
    }

    return vector;
  } catch (error: any) {
    if (error?.name === "AbortError") {
      console.error(
        `[generateEmbeddings] Timeout setelah ${OLLAMA_TIMEOUT_MS}ms`
      );
    } else {
      console.error("[generateEmbeddings] Gagal:", error?.message ?? error);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

// Intent detection

export function detectQueryIntent(query: string): QueryIntent {
  const q = query.toLowerCase();

  const villageKeywords = [
    "desa",
    "village",
    "kelurahan",
    "kampung",
    "wilayah",
    "lokasi desa",
    "profil desa",
    "potensi desa",
    "mana yang menerapkan",
    "desa mana",
    "desa apa",
    "desa yang",
    "sudah menerapkan",
    "sudah menggunakan",
    "menerapkan inovasi",
    "menggunakan inovasi",
  ];

  const innovationKeywords = [
    "inovasi",
    "innovation",
    "teknologi",
    "solusi",
    "aplikasi",
    "sistem",
    "platform",
    "produk",
    "alat",
    "tools",
    "fitur",
    "cara kerja",
    "harga",
    "biaya",
    "manfaat inovasi",
    "kategori inovasi",
    "rekomendasi inovasi",
  ];

  const innovatorKeywords = [
    "inovator",
    "innovator",
    "pembuat",
    "pengembang",
    "siapa yang membuat",
    "siapa yang mengembangkan",
    "perusahaan",
    "lembaga",
    "organisasi",
    "kontak inovator",
    "profil inovator",
    "ingin menjadi inovator",
    "daftar inovator",
  ];

  const statsKeywords = [
    "total",
    "jumlah",
    "berapa banyak",
    "peringkat",
    "statistik",
    "berapa desa",
    "sejauh ini",
  ];

  const isVillage = villageKeywords.some((k) => q.includes(k));
  const isInnovation = innovationKeywords.some((k) => q.includes(k));
  const isInnovator = innovatorKeywords.some((k) => q.includes(k));
  const isStats = statsKeywords.some((k) => q.includes(k));

  let primary: QueryIntent["primary"] = "general";

  if (isStats) {
    primary = "stats";
  } else if (isVillage && isInnovation) {
    primary = "innovation";
  } else if (isVillage) {
    primary = "village";
  } else if (isInnovator) {
    primary = "innovator";
  } else if (isInnovation) {
    primary = "innovation";
  }

  console.log(
    `[Intent] primary=${primary.toUpperCase()} | village=${isVillage} | innovation=${isInnovation} | innovator=${isInnovator} | stats=${isStats}`
  );

  return { isVillage, isInnovation, isInnovator, isStats, primary };
}

// Search: doc_embeddings

export async function searchDocEmbeddings(query: string): Promise<any[]> {
  if (!query) return [];

  try {
    const db = await connectToDatabase();
    const queryVector = await generateEmbeddings(query);

    const results = await db
      .collection("doc_embeddings")
      .aggregate([
        {
          $vectorSearch: {
            index: "vector_index",
            path: "embedding_vector",
            queryVector,
            numCandidates: 100,
            limit: 15,
          },
        },
        {
          $project: {
            embedding_vector: 0,
            score: { $meta: "vectorSearchScore" },
          },
        },
      ])
      .toArray();

    const valid = results.filter((r) => r.score > VECTOR_SCORE_THRESHOLD);
    console.log(`[searchDocEmbeddings] Ditemukan ${valid.length} hasil valid`);
    return valid;
  } catch (error) {
    console.error("[searchDocEmbeddings] Error:", error);
    return [];
  }
}

// Search: db_embeddings — role-aware sejak awal

export async function searchDatabaseEmbeddings(
  query: string,
  intent: QueryIntent,
  role: UserRole | string = "guest"
): Promise<any[]> {
  if (!query) return [];

  try {
    const db = await connectToDatabase();
    const queryVector = await generateEmbeddings(query);
    const collectionFilter = buildCollectionFilter(intent, role);

    // Pastikan filter tidak kosong — fallback ke innovations saja
    if (collectionFilter.length === 0) {
      console.warn(
        "[searchDatabaseEmbeddings] collectionFilter kosong, fallback ke innovations"
      );
      collectionFilter.push("innovations");
    }

    console.log(
      `[searchDatabaseEmbeddings] Role=${role} | Filter=[${collectionFilter.join(", ")}]`
    );

    const results = await db
      .collection("db_embeddings")
      .aggregate([
        {
          $vectorSearch: {
            index: "vector_index_db",
            path: "embedding_vector",
            queryVector,
            numCandidates: 100,
            limit: 15,
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
      ])
      .toArray();

    const valid = results.filter((r) => r.score > VECTOR_SCORE_THRESHOLD);

    // Defense-in-depth: filter ulang di memory, meski sudah difilter di pipeline
    const safe = enforceRoleFilter(valid, role);
    console.log(
      `[searchDatabaseEmbeddings] ${results.length} raw → ${valid.length} lolos threshold → ${safe.length} lolos role filter`
    );
    return safe;
  } catch (error) {
    console.error("[searchDatabaseEmbeddings] Error:", error);
    return [];
  }
}

// Defense-in-depth: filter hasil di memory berdasarkan role
// Ini lapisan kedua — memastikan data sensitif tidak bocor
// meskipun ada bug di pipeline aggregation.

export function enforceRoleFilter(
  results: any[],
  role: UserRole | string
): any[] {
  const normalizedRole = normalizeRole(role);
  const allowed = ROLE_ALLOWED_COLLECTIONS[normalizedRole];
  return results.filter((doc) =>
    allowed.includes(doc?.source_collection ?? "")
  );
}

// Entry point utama: search semua sumber secara paralel

export async function searchAllSources(
  query: string,
  role: string = "guest"
): Promise<SearchResult> {
  if (!query) return { docResults: [], dbResults: [], intent: null };

  try {
    const intent = detectQueryIntent(query);

    const [docResults, dbResults] = await Promise.all([
      searchDocEmbeddings(query),
      searchDatabaseEmbeddings(query, intent, role),
    ]);

    console.log(
      `\n[searchAllSources] doc=${docResults.length} | db=${dbResults.length}`
    );

    if (docResults.length > 0) {
      console.log("--- doc_embeddings hits ---");
      docResults.slice(0, 5).forEach((d, i) =>
        console.log(
          `  ${i + 1}. ${d.judul ?? d.content?.slice(0, 60)} (score: ${d.score?.toFixed(3)})`
        )
      );
    }

    if (dbResults.length > 0) {
      console.log("--- db_embeddings hits ---");
      dbResults.slice(0, 5).forEach((d, i) =>
        console.log(
          `  ${i + 1}. [${d.source_collection}] ${d.metadata?.label ?? "?"} (score: ${d.score?.toFixed(3)})`
        )
      );
    }

    return { docResults, dbResults, intent };
  } catch (error) {
    console.error("[searchAllSources] Error:", error);
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