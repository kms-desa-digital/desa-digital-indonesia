// ==================================================================
// RAG Utilities: embedding generation, intent detection, role-based
// collection filtering, dan parallel search di doc + db embeddings
// ==================================================================

import { connectToDatabase } from "@/lib/db/mongodb";

// Konfigurasi via environment variables
const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
const OLLAMA_EMBED_MODEL =
  process.env.OLLAMA_EMBED_MODEL || "mxbai-embed-large:latest";
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

const ROLE_ALLOWED_COLLECTIONS: Record<UserRole, string[]> = {
  admin: ["innovations", "villages", "innovators", "claimInnovations"],
  kementerian: ["innovations", "villages", "innovators"],
  innovator: ["innovations", "villages", "innovators"],
  village: ["innovations", "villages", "innovators"],
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

  const targetCollections = new Set<string>();

  if (intent.isVillage) {
    targetCollections.add("villages");
    targetCollections.add("innovations");
    targetCollections.add("claimInnovations");
  }
  if (intent.isInnovation) {
    targetCollections.add("innovations");
    targetCollections.add("villages");
    targetCollections.add("claimInnovations");
  }
  if (intent.isInnovator) {
    targetCollections.add("innovators");
    targetCollections.add("innovations");
  }

  // Jika tidak ada keyword spesifik atau mencari statistik, telusuri semua koleksi yang diizinkan
  if (targetCollections.size === 0 || intent.isStats) {
    return allowed;
  }

  // Filter koleksi yang diizinkan sesuai role
  return allowed.filter((c) => targetCollections.has(c));
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
    "siapa inovator",
    "sudah menerapkan",
    "berapa harga",
    "inovasi apa saja",
    "daftar inovasi",
    "klaim",
    "status klaim",
    "pengajuan",
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

    if (collectionFilter.length === 0) {
      console.warn(
        "[searchDatabaseEmbeddings] collectionFilter kosong, fallback ke innovations"
      );
      collectionFilter.push("innovations");
    }

    console.log(
      `[searchDatabaseEmbeddings] Role=${role} | Filter=[${collectionFilter.join(", ")}]`
    );

    // 1. Vector Search
    const vectorResults = await db
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

    const validVectorResults = vectorResults.filter(
      (r) => r.score > VECTOR_SCORE_THRESHOLD
    );

    // 2. Exact Match Search (Hybrid Fallback)
    // Berguna untuk keyword spesifik (seperti nama desa "Soge") yang mungkin
    // vector score-nya rendah terhadap dokumen inovasi tapi nama desanya disebut di metadata.
    const stopWords = new Set([
      "desa", "yang", "di", "ke", "dari", "apa", "saja", "mengadopsi",
      "inovasi", "diterapkan", "nya", "ini", "itu", "dan", "atau", "untuk"
    ]);
    const tokens = query
      .replace(/[^\w\s]/gi, "")
      .split(/\s+/)
      .filter((t) => t.length > 3 && !stopWords.has(t.toLowerCase()));

    let exactMatchResults: any[] = [];
    if (tokens.length > 0) {
      const buildRegexOr = (field: string, tokens: string[]) =>
        tokens.map((t) => ({ [field]: { $regex: t, $options: "i" } }));

      exactMatchResults = await db
        .collection("db_embeddings")
        .find({
          source_collection: { $in: collectionFilter },
          $or: [
            ...buildRegexOr("metadata.label", tokens),
            ...buildRegexOr("metadata.namaDesa", tokens),
            ...buildRegexOr("metadata.namaInovasi", tokens),
            ...buildRegexOr("metadata.inovasiDiterapkan", tokens),
          ],
        })
        .project({ embedding_vector: 0 })
        .limit(15)
        .toArray();

      // Secondary lookup: Tarik dokumen inovasi yang disebut di inovasiDiterapkan
      // agar LLM memiliki konteks penuh (deskripsi, kategori) dari inovasi tersebut.
      const relatedNames = new Set<string>();
      exactMatchResults.forEach((doc) => {
        if (doc.metadata?.inovasiDiterapkan) {
          const arr = Array.isArray(doc.metadata.inovasiDiterapkan)
            ? doc.metadata.inovasiDiterapkan
            : [doc.metadata.inovasiDiterapkan];
          arr.forEach((a: string) => {
            if (typeof a === "string" && a.trim()) relatedNames.add(a.trim());
          });
        }
      });

      if (relatedNames.size > 0 && collectionFilter.includes("innovations")) {
        const relatedOr = Array.from(relatedNames).flatMap((n) => [
          { "metadata.namaInovasi": { $regex: `^${n}$`, $options: "i" } },
          { "metadata.label": { $regex: `^${n}$`, $options: "i" } },
        ]);
        const relatedDocs = await db
          .collection("db_embeddings")
          .find({
            source_collection: "innovations",
            $or: relatedOr,
          })
          .project({ embedding_vector: 0 })
          .limit(10)
          .toArray();
        exactMatchResults = [...exactMatchResults, ...relatedDocs];
      }
    }

    // Gabungkan hasil dan dedikasi berdasarkan _id
    const combinedMap = new Map<string, any>();

    // Beri penanda skor artifisial tinggi untuk exact match agar diprioritaskan
    exactMatchResults.forEach((doc) => {
      combinedMap.set(doc._id.toString(), { ...doc, score: 0.99 });
    });

    validVectorResults.forEach((doc) => {
      const idStr = doc._id.toString();
      if (!combinedMap.has(idStr)) {
        combinedMap.set(idStr, doc);
      }
    });

    const combinedResults = Array.from(combinedMap.values()).sort(
      (a, b) => (b.score || 0) - (a.score || 0)
    );

    // Defense-in-depth: filter ulang di memory
    const safe = enforceRoleFilter(combinedResults, role);

    console.log(
      `[searchDatabaseEmbeddings] ${vectorResults.length} vector raw → ${validVectorResults.length} vector valid | ${exactMatchResults.length} exact match → ${safe.length} lolos role filter`
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
