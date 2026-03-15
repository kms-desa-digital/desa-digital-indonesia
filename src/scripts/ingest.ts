// ==================================================================
// ingest file json inovasi ke MongoDB dengan embedding vector
// ==================================================================

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "fs";
import path from "path";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runIngestion() {
  try {
    const { connectToDatabase } = await import("../lib/db/mongodb");
    const { generateEmbeddings } = await import("../lib/ai/rag-utils");

    console.log("-- Mulai Proses Ingestion JSON ke MongoDB --");

    const db = await connectToDatabase();
    const collection = db.collection("knowledge_base");

    const docsDir = path.join(process.cwd(), "public", "documents");

    if (!fs.existsSync(docsDir)) {
      console.log("Folder public/documents tidak ditemukan.");
      process.exit(0);
    }

    // Hanya mencari file JSON
    const files = fs.readdirSync(docsDir).filter((f) => f.endsWith(".json"));

    if (files.length === 0) {
      console.log("Tidak ada file .json di public/documents");
      process.exit(0);
    }

    for (const file of files) {
      console.log(`\nMemproses file: ${file}`);
      const filePath = path.join(docsDir, file);
      
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const jsonData = JSON.parse(fileContent);

      const nodes = jsonData.nodes || [];
      if (nodes.length === 0) {
        console.log(`Skip: Tidak ada node dalam file ${file}`);
        continue;
      }

      // Hapus data lama dari file yang sama agar tidak duplikat
      await collection.deleteMany({ source: file });

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const detail = node.details;
        if (!detail) continue;

        // Ekstrak nama kategori dari nama file (misal: "hasil_inovasi_ipb_biomedis.json" -> "BIOMEDIS")
        const categoryMatch = file.match(/hasil_inovasi_ipb_(.*?)\.json/);
        const kategori = categoryMatch ? categoryMatch[1].toUpperCase() : "UMUM";

        // Penanganan tipe data Array/String
        const rawKeunggulan = detail.keunggulan_inovasi;
        const keunggulanText = Array.isArray(rawKeunggulan) ? rawKeunggulan.join(", ") : (rawKeunggulan ?? "");

        const rawNama = detail.inovator?.nama;
        const inovatorText = Array.isArray(rawNama) ? rawNama.join(", ") : (rawNama ?? "");

        // Gabungkan teks khusus untuk dibaca oleh model Embedding
        let textToEmbed = `
          Kategori: ${kategori}.
          Judul: ${detail.judul ?? ""}.
          Deskripsi: ${detail.deskripsi ?? ""}.
          Perspektif: ${detail.perspektif ?? ""}.
          Keunggulan: ${keunggulanText}.
          Potensi Aplikasi: ${detail.potensi_aplikasi ?? ""}.
          Inovator: ${inovatorText}.
        `.replace(/\s+/g, " ").trim(); // Bersihkan spasi berlebih

        if (textToEmbed.length > 4000) {
          console.log(`\n Peringatan: Teks terlalu panjang (${textToEmbed.length} karakter). Teks akan dipotong agar aman.`);
          textToEmbed = textToEmbed.substring(0, 4000);
        }

        console.log(`Node ${i + 1}/${nodes.length} - Judul: ${detail.judul?.substring(0, 30)}...`);

        let vector: number[] | null = null;
        let retries = 0;
        const maxRetries = 3;

        // Proses Embedding dengan Retry Logic
        while (retries < maxRetries) {
          try {
            vector = await generateEmbeddings(textToEmbed);
            successCount++;
            break;
          } catch (error: any) {
            retries++;
            const errorMsg = error?.message || String(error);
            console.log(`Embed error (retry ${retries}/${maxRetries}): ${errorMsg}`);

            if (retries >= maxRetries) {
              console.log(`Skip inovasi ${detail.judul} (gagal setelah ${maxRetries} retry)`);
              errorCount++;
              vector = null;
              break;
            }

            const waitTime = Math.min(2000 * Math.pow(2, retries - 1), 16000);
            await delay(waitTime);
          }
        }

        if (!vector) continue;

        // Simpan ke MongoDB 
        await collection.insertOne({
          source: file,
          kategori: kategori,
          node_id: node.node_id,
          judul: detail.judul,
          deskripsi: detail.deskripsi,
          perspektif: detail.perspektif,
          keunggulan_inovasi: detail.keunggulan_inovasi,
          potensi_aplikasi: detail.potensi_aplikasi,
          inovator_nama: detail.inovator?.nama,
          inovator_status_paten: detail.inovator?.status_paten,
          content: textToEmbed, 
          embedding_vector: vector,
          createdAt: new Date(),
        });

        if (i < nodes.length - 1) await delay(1500); 
      }

      console.log(`Selesai index: ${file}`);
      console.log(`Success: ${successCount} | Errors: ${errorCount}`);
    }

    console.log("\n-- Ingestion JSON ke MongoDB Selesai --");
    process.exit(0);
  } catch (error) {
    console.error("Error saat Ingestion:", error);
    process.exit(1);
  }
}

runIngestion();



// ==================================================================
// dokumen langsung
// ==================================================================

// import dotenv from "dotenv";
// dotenv.config({ path: ".env.local" });

// import fs from "fs";
// import path from "path";

// const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// function normalizeText(text: string) {
//   return (text ?? "")
//     .replace(/[\r\n]+/g, " ")
//     .replace(/\s+/g, " ")
//     .trim();
// }

// // Fungsi untuk memotong teks dengan irisan (overlap) agar konteks tidak terputus
// function chunkTextWithOverlap(
//   text: string,
//   maxCharLength: number = 1000,
//   overlapCharLength: number = 200
// ): string[] {
//   const chunks: string[] = [];
//   const words = text.split(/\s+/); // Pisahkan berdasarkan spasi

//   let currentChunk: string[] = [];
//   let currentLength = 0;

//   let i = 0;
//   while (i < words.length) {
//     const word = words[i];
//     // +1 untuk spasi (kecuali kata pertama)
//     const wordLength = currentLength === 0 ? word.length : word.length + 1;

//     // Jika menambah kata ini membuat panjang melebihi batas (dan array tidak kosong)
//     if (currentLength + wordLength > maxCharLength && currentLength > 0) {
//       chunks.push(currentChunk.join(" "));

//       // Mundur ke belakang untuk mengambil kata-kata sebagai irisan (overlap)
//       let overlapLength = 0;
//       const overlapWords: string[] = [];
//       for (let j = currentChunk.length - 1; j >= 0; j--) {
//         const w = currentChunk[j];
//         const len = overlapLength === 0 ? w.length : w.length + 1;
//         if (overlapLength + len > overlapCharLength) {
//           break; // Berhenti jika irisan sudah mencapai target
//         }
//         overlapLength += len;
//         overlapWords.unshift(w); // Masukkan kata ke awal array
//       }

//       // Mulai chunk baru dengan irisan kata + kata yang baru saja diperiksa
//       currentChunk = [...overlapWords, word];
//       currentLength = overlapLength + (overlapLength === 0 ? word.length : word.length + 1);
//     } else {
//       currentChunk.push(word);
//       currentLength += wordLength;
//     }
//     i++;
//   }

//   // Masukkan sisa kata terakhir jika ada
//   if (currentChunk.length > 0) {
//     chunks.push(currentChunk.join(" "));
//   }

//   return chunks;
// }

// async function runIngestion() {
//   try {
//     const { connectToDatabase } = await import("../lib/db/mongodb");
//     const { generateEmbeddings, parsePdf } = await import("../lib/ai/rag-utils");

//     console.log("--- Mulai Proses Ingestion Data (MongoDB) ---");

//     const db = await connectToDatabase();
//     const collection = db.collection("knowledge_base");

//     const docsDir = path.join(process.cwd(), "public", "documents");

//     if (!fs.existsSync(docsDir)) {
//       console.log("Folder public/documents tidak ditemukan.");
//       process.exit(0);
//     }

//     const files = fs
//       .readdirSync(docsDir)
//       .filter((f) => f.endsWith(".pdf") || f.endsWith(".txt"));

//     if (files.length === 0) {
//       console.log("Tidak ada file .pdf / .txt di public/documents");
//       process.exit(0);
//     }

//     for (const file of files) {
//       console.log(`\ndokumen: ${file}`);
//       const filePath = path.join(docsDir, file);

//       let text = "";
//       if (file.endsWith(".pdf")) {
//         const pdfBuffer = fs.readFileSync(filePath);
//         text = await parsePdf(pdfBuffer);
//       } else {
//         text = fs.readFileSync(filePath, "utf-8");
//       }

//       text = normalizeText(text);
//       console.log(`Text length: ${text.length}`);

//       if (!text) {
//         console.log(`Skip (kosong): ${file}`);
//         continue;
//       }

//       // Chunking berbasis batas kata dengan overlap 100 karakter
//       const chunks = chunkTextWithOverlap(text, 1000, 200);
//       console.log(`Total chunks: ${chunks.length}`);

//       await collection.deleteMany({ source: file });

//       let successCount = 0;
//       let errorCount = 0;

//       for (let i = 0; i < chunks.length; i++) {
//         const chunk = chunks[i].trim();
//         if (!chunk || chunk.length < 10) {
//           console.log(`Skip chunk ${i + 1} (terlalu pendek)`);
//           continue;
//         }

//         console.log(`Chunk ${i + 1}/${chunks.length} (${chunk.length} chars)`);

//         let vector: number[] | null = null;
//         let retries = 0;
//         const maxRetries = 5;

//         while (retries < maxRetries) {
//           try {
//             vector = await generateEmbeddings(chunk);
//             successCount++;
//             break;
//           } catch (error: any) {
//             retries++;
//             const errorMsg = error?.message || String(error);
//             console.log(`Embed error (retry ${retries}/${maxRetries}): ${errorMsg}`);

//             if (retries >= maxRetries) {
//               console.log(`Skip chunk ${i + 1} (gagal setelah ${maxRetries} retry)`);
//               errorCount++;
//               vector = null;
//               break;
//             }

//             const waitTime = Math.min(2000 * Math.pow(2, retries - 1), 16000);
//             console.log(`   Waiting ${waitTime}ms before retry...`);
//             await delay(waitTime);
//           }
//         }

//         if (!vector) continue;

//         await collection.insertOne({
//           source: file,
//           type: "document",
//           content: chunk,
//           embedding_vector: vector,
//           metadata: { chunkIndex: i },
//           createdAt: new Date(),
//           updatedAt: new Date(),
//         });

//         if (i < chunks.length - 1) await delay(500);
//       }

//       console.log(`Selesai index: ${file}`);
//       console.log(`Total chunks: ${chunks.length}`);
//       console.log(`Success: ${successCount}`);
//       console.log(`Errors: ${errorCount}`);
//       console.log(`Success rate: ${((successCount / (successCount + errorCount)) * 100).toFixed(1)}%`);
//     }

//     console.log("\n--- Ingestion MongoDB Selesai ---");
//     process.exit(0);
//   } catch (error) {
//     console.error("Error saat Ingestion:", error);
//     process.exit(1);
//   }
// }

// runIngestion();


