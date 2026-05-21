// ==================================================================
// Unified ingestion: semua dokumen JSON → doc_embeddings
// Mendukung 2 format JSON:
// 1. Inovasi (nodes[].details.judul, deskripsi, dll)
// 2. Dokumen umum (nodes[].page, content)
// ==================================================================

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "fs";
import path from "path";

// helper delay untuk retry
const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "";

// batasi jumlah proses paralel
const MAX_CONCURRENT = 3;

// logger sederhana
const log = {
  info: (msg: string) => console.log(`[INFO] ${msg}`),
  success: (msg: string) => console.log(`[SUCCESS] ${msg}`),
  warn: (msg: string) => console.log(`[WARN] ${msg}`),
  error: (msg: string) => console.log(`[ERROR] ${msg}`),
};

// cek apakah error Ollama sementara
function isTransientOllamaError(errorMessage: string): boolean {
  const normalized = errorMessage.toLowerCase();

  return (
    normalized.includes("forcibly closed") ||
    normalized.includes("wsarecv") ||
    normalized.includes("econnreset") ||
    normalized.includes("socket hang up") ||
    normalized.includes("abort")
  );
}

// tunggu sampai Ollama ready lagi
async function waitForOllamaReady(
  maxAttempts = 10,
  intervalMs = 3000
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
      if (res.ok) return true;
    } catch { }

    await delay(intervalMs);
  }

  return false;
}

// cek apakah node format inovasi
function isInnovationFormat(node: any): boolean {
  return node.details && (node.details.judul || node.details.deskripsi);
}

// build text untuk node inovasi
function buildInnovationNodeText(
  node: any,
  file: string
): {
  text: string;
  metadata: any;
} {
  const detail = node.details;

  // ambil kategori dari nama file
  const categoryMatch = file.match(/hasil_inovasi_ipb_(.*?)\.json/);
  const kategori = categoryMatch
    ? categoryMatch[1].toUpperCase()
    : "UMUM";

  const keunggulanText = Array.isArray(detail.keunggulan_inovasi)
    ? detail.keunggulan_inovasi.join(", ")
    : detail.keunggulan_inovasi ?? "";

  const inovatorText = Array.isArray(detail.inovator?.nama)
    ? detail.inovator.nama.join(", ")
    : detail.inovator?.nama ?? "";

  const text = `
    Kategori: ${kategori}.
    Judul: ${detail.judul ?? ""}.
    Deskripsi: ${detail.deskripsi ?? ""}.
    Perspektif: ${detail.perspektif ?? ""}.
    Keunggulan: ${keunggulanText}.
    Potensi Aplikasi: ${detail.potensi_aplikasi ?? ""}.
    Inovator: ${inovatorText}.
  `
    .replace(/\s+/g, " ")
    .trim();

  return {
    text,
    metadata: {
      type: "inovasi",
      node_id: node.node_id,
      kategori,
      judul: detail.judul,
      deskripsi: detail.deskripsi,
      perspektif: detail.perspektif,
      keunggulan_inovasi: detail.keunggulan_inovasi,
      potensi_aplikasi: detail.potensi_aplikasi,
      inovator_nama: detail.inovator?.nama,
      inovator_status_paten: detail.inovator?.status_paten,
    },
  };
}

// build text untuk node dokumen biasa
function buildDocumentNodeText(node: any): {
  text: string;
  metadata: any;
} {
  const text = (node.content ?? "")
    .replace(/\s+/g, " ")
    .trim();

  return {
    text,
    metadata: {
      type: "document",
      page: node.page,
    },
  };
}

// main ingestion
async function runIngestion() {
  try {
    const { connectToDatabase } = await import(
      "../lib/db/mongodb"
    );
    const { generateEmbeddings } = await import(
      "../lib/ai/rag-utils"
    );

    log.info("Mulai ingestion dokumen ke doc_embeddings");

    const db = await connectToDatabase();
    const collection = db.collection("doc_embeddings");

    const docsDir = path.join(process.cwd(), "public", "documents");

    if (!fs.existsSync(docsDir)) {
      log.warn("Folder public/documents tidak ditemukan");
      process.exit(0);
    }

    const files = fs
      .readdirSync(docsDir)
      .filter((f) => f.endsWith(".json"));

    if (files.length === 0) {
      log.warn("Tidak ada file json");
      process.exit(0);
    }

    for (const file of files) {
      log.info(`File: ${file}`);

      const filePath = path.join(docsDir, file);
      const jsonData = JSON.parse(
        fs.readFileSync(filePath, "utf-8")
      );

      const nodes = jsonData.nodes || [];

      if (nodes.length === 0) {
        log.warn(`Tidak ada node di ${file}`);
        continue;
      }

      // deteksi format dari node pertama
      const isInnovation = isInnovationFormat(nodes[0]);

      log.info(
        `Format: ${isInnovation ? "Inovasi" : "Dokumen"
        } | ${nodes.length} node`
      );

      // hapus data lama dari file ini
      await collection.deleteMany({ source: file });

      let success = 0;
      let failed = 0;

      const docsBuffer: any[] = [];

      const processNode = async (node: any, index: number) => {
        // build text sesuai format
        const { text, metadata } = isInnovation
          ? buildInnovationNodeText(node, file)
          : buildDocumentNodeText(node);

        if (!text || text.length < 10) {
          log.warn(`Skip node ${index + 1}`);
          failed++;
          return;
        }

        let retries = 0;
        let vector: number[] | null = null;

        // retry embedding
        while (retries < 5) {
          try {
            vector = await generateEmbeddings(text);
            success++;
            break;
          } catch (err: any) {
            retries++;

            const msg = err?.message || String(err);
            log.warn(`Retry ${retries} -> ${msg}`);

            if (isTransientOllamaError(msg)) {
              await waitForOllamaReady();
            }

            await delay(2000 * retries);
          }
        }

        if (!vector) {
          failed++;
          return;
        }

        log.info(`Node ${index + 1}/${nodes.length} OK`);

        docsBuffer.push({
          source: file,
          content: text,
          embedding_vector: vector,
          metadata,
          createdAt: new Date(),
        });
      };

      // concurrency sederhana
      let index = 0;
      const workers: Promise<void>[] = [];

      for (let i = 0; i < MAX_CONCURRENT; i++) {
        workers.push(
          (async () => {
            while (index < nodes.length) {
              const currentIndex = index++;
              await processNode(
                nodes[currentIndex],
                currentIndex
              );
            }
          })()
        );
      }

      await Promise.all(workers);

      // insert batch
      if (docsBuffer.length > 0) {
        await collection.insertMany(docsBuffer);
      }

      log.success(
        `${file} selesai | Success: ${success} | Failed: ${failed}`
      );
    }

    log.success("Semua ingestion dokumen selesai");
    process.exit(0);
  } catch (err) {
    log.error(`Error: ${err}`);
    process.exit(1);
  }
}

runIngestion();