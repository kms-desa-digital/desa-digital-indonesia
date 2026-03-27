// // ==================================================================
// // ingest file json inovasi ke MongoDB dengan embedding vector
// // ==================================================================

// import dotenv from "dotenv";
// dotenv.config({ path: ".env.local" });

// import fs from "fs";
// import path from "path";

// // delay helper (dipakai untuk retry)
// const delay = (ms: number) =>
//   new Promise((resolve) => setTimeout(resolve, ms));

// // base URL Ollama
// const OLLAMA_BASE_URL =
//   process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434";

// // batasi jumlah request embedding paralel
// const MAX_CONCURRENT = 3;

// // logger sederhana
// const log = {
//   info: (msg: string) => console.log(`[INFO] ${msg}`),
//   success: (msg: string) => console.log(`[SUCCESS] ${msg}`),
//   warn: (msg: string) => console.log(`[WARN] ${msg}`),
//   error: (msg: string) => console.log(`[ERROR] ${msg}`),
// };

// // cek apakah error Ollama hanya sementara
// function isTransientOllamaError(errorMessage: string): boolean {
//   const normalized = errorMessage.toLowerCase();

//   return (
//     normalized.includes("forcibly closed") ||
//     normalized.includes("wsarecv") ||
//     normalized.includes("econnreset") ||
//     normalized.includes("socket hang up") ||
//     normalized.includes("abort")
//   );
// }

// // nunggu Ollama sampai siap lagi
// async function waitForOllamaReady(
//   maxAttempts = 10,
//   intervalMs = 3000
// ): Promise<boolean> {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
//       if (res.ok) return true;
//     } catch {}

//     await delay(intervalMs);
//   }

//   return false;
// }

// async function runIngestion() {
//   try {
//     const { connectToDatabase } = await import("../lib/db/mongodb");
//     const { generateEmbeddings } = await import("../lib/ai/rag-utils");

//     log.info("Mulai ingestion (optimized)");

//     const db = await connectToDatabase();
//     const collection = db.collection("chatbot_documents");

//     const docsDir = path.join(process.cwd(), "public", "documents");

//     if (!fs.existsSync(docsDir)) {
//       log.warn("Folder tidak ditemukan");
//       process.exit(0);
//     }

//     const files = fs
//       .readdirSync(docsDir)
//       .filter((f) => f.endsWith(".json"));

//     // proses tiap file
//     for (const file of files) {
//       log.info(`File: ${file}`);

//       const filePath = path.join(docsDir, file);
//       const jsonData = JSON.parse(
//         fs.readFileSync(filePath, "utf-8")
//       );

//       const nodes = jsonData.nodes || [];
//       if (nodes.length === 0) continue;

//       // hapus data lama biar tidak duplikat
//       await collection.deleteMany({ source: file });

//       let success = 0;
//       let failed = 0;

//       const docsBuffer: any[] = []; // buffer untuk batch insert

//       // fungsi untuk proses 1 node
//       const processNode = async (node: any, index: number) => {
//         const detail = node.details;
//         if (!detail) return;

//         // ambil kategori dari nama file
//         const categoryMatch = file.match(
//           /hasil_inovasi_ipb_(.*?)\.json/
//         );

//         const kategori = categoryMatch
//           ? categoryMatch[1].toUpperCase()
//           : "UMUM";

//         // handle array/string
//         const keunggulanText = Array.isArray(
//           detail.keunggulan_inovasi
//         )
//           ? detail.keunggulan_inovasi.join(", ")
//           : detail.keunggulan_inovasi ?? "";

//         const inovatorText = Array.isArray(
//           detail.inovator?.nama
//         )
//           ? detail.inovator.nama.join(", ")
//           : detail.inovator?.nama ?? "";

//         // gabungkan semua jadi 1 text
//         let textToEmbed = `
//           Kategori: ${kategori}.
//           Judul: ${detail.judul ?? ""}.
//           Deskripsi: ${detail.deskripsi ?? ""}.
//           Perspektif: ${detail.perspektif ?? ""}.
//           Keunggulan: ${keunggulanText}.
//           Potensi Aplikasi: ${detail.potensi_aplikasi ?? ""}.
//           Inovator: ${inovatorText}.
//         `
//           .replace(/\s+/g, " ")
//           .trim();

//         let retries = 0;
//         let vector: number[] | null = null;

//         // retry embedding kalau gagal
//         while (retries < 5) {
//           try {
//             vector = await generateEmbeddings(textToEmbed);
//             success++;
//             break;
//           } catch (err: any) {
//             retries++;

//             const msg = err?.message || String(err);
//             log.warn(`Retry ${retries} -> ${msg}`);

//             // kalau error koneksi Ollama
//             if (isTransientOllamaError(msg)) {
//               await waitForOllamaReady();
//             }

//             await delay(2000 * retries); // backoff sederhana
//           }
//         }

//         if (!vector) {
//           failed++;
//           return;
//         }

//         // simpan ke buffer dulu (belum insert DB)
//         docsBuffer.push({
//           source: file,
//           kategori,
//           node_id: node.node_id,
//           judul: detail.judul,
//           deskripsi: detail.deskripsi,
//           perspektif: detail.perspektif,
//           keunggulan_inovasi: detail.keunggulan_inovasi,
//           potensi_aplikasi: detail.potensi_aplikasi,
//           inovator_nama: detail.inovator?.nama,
//           inovator_status_paten:
//             detail.inovator?.status_paten,
//           content: textToEmbed,
//           embedding_vector: vector,
//           createdAt: new Date(),
//         });

//         log.info(`Done node ${index + 1}`);
//       };

//       // concurrency control (biar gak overload Ollama)
//       let index = 0;
//       const workers: Promise<void>[] = [];

//       for (let i = 0; i < MAX_CONCURRENT; i++) {
//         workers.push(
//           (async () => {
//             while (index < nodes.length) {
//               const currentIndex = index++;
//               await processNode(nodes[currentIndex], currentIndex);
//             }
//           })()
//         );
//       }

//       await Promise.all(workers);

//       // insert ke DB sekaligus (lebih cepat)
//       if (docsBuffer.length > 0) {
//         await collection.insertMany(docsBuffer);
//       }

//       log.success(
//         `File selesai | Success: ${success} | Failed: ${failed}`
//       );
//     }

//     log.success("Semua ingestion selesai (optimized)");
//     process.exit(0);
//   } catch (err) {
//     log.error(`Error: ${err}`);
//     process.exit(1);
//   }
// }

// runIngestion();