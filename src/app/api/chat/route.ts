// ==================================================================
// ingest file json inovasi ke MongoDB dengan embedding vector
// ==================================================================

import { searchInnovation } from "@/lib/ai/rag-utils";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const lastUserMessage = messages[messages.length - 1]?.content?.trim() || "";

    if (!lastUserMessage) {
      return new Response("Pesan kosong", { status: 400 });
    }

    let foundDocs = await searchInnovation(lastUserMessage);

    if (!foundDocs && messages.length > 1) {
      const historyText = messages.map((m: any) => m.content).join(" ");
      foundDocs = await searchInnovation(historyText);
    }

    if (!foundDocs || foundDocs.length === 0) {
      return new Response("Maaf, informasi tersebut tidak ditemukan di basis data inovasi kami.", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    let context = "Data Inovasi yang Ditemukan:\n\n";

    foundDocs.forEach((doc: any, index: number) => {
      const rawKeunggulan = doc.keunggulan_inovasi;
      let keunggulan = "-";
      if (Array.isArray(rawKeunggulan)) {
        keunggulan = rawKeunggulan.map((k: string) => `- ${k}`).join('\n');
      } else if (rawKeunggulan) {
        keunggulan = rawKeunggulan;
      }

      const rawNama = doc.inovator?.nama || doc.inovator_nama;
      let inovator = "-";
      if (Array.isArray(rawNama)) {
        inovator = rawNama.join(', ');
      } else if (rawNama) {
        inovator = rawNama;
      }

      const statusPaten = doc.inovator?.status_paten || doc.inovator_status_paten || "-";

      context += `---
      Bidang Kategori: ${doc.kategori || "-"}
      Judul: ${doc.judul || "-"}
      Deskripsi: ${doc.deskripsi || "-"}
      Perspektif: ${doc.perspektif || "-"}
      Keunggulan Inovasi: 
      ${keunggulan}
      Potensi Aplikasi: ${doc.potensi_aplikasi || "-"}
      Inovator: ${inovator}
      Status Paten: ${statusPaten}
      -----------------------------------\n\n`;
    });

    console.log(`\n=== Context Pertanyaan: "${lastUserMessage}" ===\n`);
    console.log(context);
    console.log(`\n================================================\n`);

    const prompt = `
      Anda adalah Asisten Virtual Knowledge Management System Desa Digital.
      Jawab pertanyaan hanya berdasarkan data berikut.
      Jika informasi tidak tersedia dalam data, jawab:
      Maaf, informasi tersebut tidak ditemukan."

      ${context}

      Pertanyaan:
      ${lastUserMessage}

      Jawaban:
    `;

    // Panggil LLM Lokal (Ollama) untuk menghasilkan jawaban
    /*
    const ollamaResponse = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.2:3b",
        prompt: prompt,
        stream: false, 
        options: { temperature: 0.0, max_output_tokens: 500},
      }),
    });

    if (!ollamaResponse.ok) {
      return new Response("Gagal terhubung ke model AI", { status: 500 });
    }

    // Karena stream false, kita bisa langsung ekstrak JSON-nya
    const data = await ollamaResponse.json();

    return new Response(data.response, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
    */

    // Panggil LLM Gemini dengan Streaming
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");
    const model = genAI.getGenerativeModel({ 
      model: "gemma-3-27b-it", 
      generationConfig: { temperature: 0.0, maxOutputTokens: 300 }
    });

    // Menggunakan generateContent biasa (bukan generateContentStream)
    const result = await model.generateContent(prompt);
    const geminiResponseText = result.response.text();

    return new Response(geminiResponseText, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });

  } catch (error) {
    console.error("Chatbot API Error:", error);
    return new Response("Terjadi kesalahan pada server", { status: 500 });
  }
}


// ==================================================================
// index pake json tanpa MongoDB, langsung baca dari folder public/documents
// ==================================================================

// import { searchInnovation } from "@/lib/ai/rag-utils";
// import { GoogleGenerativeAI } from "@google/generative-ai";

// export async function POST(req: Request) {
//   try {
//     const body = await req.json();
//     const messages = Array.isArray(body?.messages) ? body.messages : [];

//     const lastUserMessage =
//       messages[messages.length - 1]?.content?.trim() || "";

//     if (!lastUserMessage) {
//       return new Response("Pesan kosong", { status: 400 });
//     }

//     // Pertama, coba cari inovasi yang paling relevan dengan pesan terakhir pengguna
//     let found = searchInnovation(lastUserMessage);

//     // Fallback: Jika tidak ditemukan, coba cari di seluruh history chat untuk konteks tambahan
//     if (!found && messages.length > 1) {
//       const historyText = messages
//         .map((m: any) => m.content)
//         .join(" ");
//       found = searchInnovation(historyText);
//     }

//     if (!found || !found.details) {
//       return new Response("Maaf, informasi tersebut tidak ditemukan.", {
//         status: 200,
//         headers: { "Content-Type": "text/plain" },
//       });
//     }

//     const detail = found.details;

//     // Format Keunggulan Inovasi (Menangani Array atau String)
//     const rawKeunggulan = detail.keunggulan_inovasi;
//     let keunggulan = "-";
//     if (Array.isArray(rawKeunggulan)) {
//       keunggulan = rawKeunggulan.map(k => `- ${k}`).join('\n');
//     } else if (rawKeunggulan) {
//       keunggulan = rawKeunggulan;
//     }

//     // Format Inovator (Menangani Array atau String)
//     const rawNama = detail.inovator?.nama;
//     let inovator = "-";
//     if (Array.isArray(rawNama)) {
//       inovator = rawNama.join(', ');
//     } else if (rawNama) {
//       inovator = rawNama;
//     }

//     // Buat konteks yang lebih terstruktur untuk LLM
//     const context = `
//       Data Inovasi:
//       Bidang Kategori: ${found.kategori || "-"}
//       Judul: ${detail.judul || "-"}
//       Deskripsi: ${detail.deskripsi || "-"}
//       Perspektif: ${detail.perspektif || "-"}
//       Keunggulan Inovasi: 
//       ${keunggulan}
//       Potensi Aplikasi: ${detail.potensi_aplikasi || "-"}
//       Inovator: ${inovator}
//       Status Paten: ${detail.inovator?.status_paten || "-"}
//     `;

//     console.log(`\n=== Context Pertanyaan:"${lastUserMessage}" ===\n`);
//     console.log(context);
//     console.log(`\n===============================================\n`);

//     const prompt = `
//       Anda adalah Asisten Virtual Knowledge Management System Desa Digital.
//       Jawab pertanyaan hanya berdasarkan data berikut.
//       Jika informasi tidak tersedia dalam data, jawab:
//       "Maaf, informasi tersebut tidak ditemukan."

//       ${context}

//       Pertanyaan:
//       ${lastUserMessage}

//       Jawaban:
//     `;

//     // Panggil LLM Lokal (Ollama) untuk menghasilkan jawaban
//     // const ollamaResponse = await fetch("http://localhost:11434/api/generate", {
//     //   method: "POST",
//     //   headers: {
//     //     "Content-Type": "application/json",
//     //   },
//     //   body: JSON.stringify({
//     //     model: "llama3.2:3b",
//     //     prompt: prompt,
//     //     stream: false,
//     //     options: {
//     //       temperature: 0.0,
//     //     },
//     //   }),
//     // });

//     // const data = await ollamaResponse.json();
//     // return new Response(data.response, {
//     //   status: 200,
//     //   headers: {
//     //     "Content-Type": "text/plain",
//     //   },
//     // });

//     // Panggil LLM Gemini
//     const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");
//     const model = genAI.getGenerativeModel({ 
//       model: "gemma-3-27b-it", 
//       generationConfig: {
//         temperature: 0.0,
//         maxOutputTokens: 300
//       }
//     });

//     const result = await model.generateContent(prompt);
//     const geminiResponseText = result.response.text();

//     return new Response(geminiResponseText, {
//       status: 200,
//       headers: {
//         "Content-Type": "text/plain",
//       },
//     });
    

//   } catch (error) {
//     console.error("Chatbot API Error:", error);
//     return new Response("Terjadi kesalahan pada server", {
//       status: 500,
//     });
//   }
// }


// ==================================================================
// dokumen langsung
// ==================================================================

// import { createGoogleGenerativeAI } from '@ai-sdk/google';
// import { generateText } from "ai"; 
// import { searchSimilarContext } from "@/lib/ai/rag-utils";
// import { createOpenAI } from "@ai-sdk/openai";

// // Setup Google Gemini untuk LLM 
// const google = createGoogleGenerativeAI({
//   apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
// });

// // Setup Ollama untuk LLM Lokal 
// // const ollama = createOpenAI({
// //   baseURL: "http://localhost:11434/v1",
// //   apiKey: "ollama",
// // });

// type ChatMessage = { role: "system" | "user" | "assistant"; content: string; };

// export async function POST(req: Request) {
//   try {
//     const body = await req.json();
//     const messages: ChatMessage[] = Array.isArray(body?.messages) ? body.messages : [];
//     const lastUserMessage = messages[messages.length - 1]?.content?.trim() || "";

//     if (!lastUserMessage) return new Response(JSON.stringify({ error: "Kosong" }), { status: 400 });

//     // Cari Konteks
//     const context = await searchSimilarContext(lastUserMessage);
//     console.log(`\n=== Context Pertanyaan: "${lastUserMessage}" ===\n`);
//     console.log(context);
//     console.log(`\n================================================\n`);

//     const previousMessages = messages.slice(0, -1).map((m) => ({ role: m.role, content: m.content }));

//     const finalPrompt = `
//       Anda adalah Asisten Virtual Knowledge Management System Desa Digital.
//       Jawab pertanyaan hanya berdasarkan data berikut.
//       Jika informasi tidak tersedia dalam data, jawab:
//       "Maaf, informasi tersebut tidak ditemukan."

//       <konteks>
//       ${context || "TIDAK ADA INFORMASI DI DOKUMEN."}
//       </konteks>

//       PERTANYAAN PENGGUNA: ${lastUserMessage}

//       ATURAN SUPER KETAT:
//       1. JIKA JAWABAN TIDAK ADA DI DALAM <konteks>, KAMU WAJIB MENJAWAB: "Maaf, informasi tersebut tidak ditemukan."
//       2. DILARANG KERAS mengarang singkatan, nama, atau menambahkan informasi dari luar <konteks>.
//       3. Langsung ke inti jawaban.
//     `.trim();

//     const ragMessages: ChatMessage[] = [...previousMessages, { role: "user", content: finalPrompt }];
    
//     // Gemini API 
//     const result = await generateText({
//       model: google('gemma-3-27b-it'), 
//       messages: ragMessages,
//       temperature: 0.0, 
//       maxOutputTokens: 300,
//     });

//     // Ollama API 
//     // const result = await generateText({
//     //   model: ollama.chat('llama3.2:3b'),
//     //   messages: ragMessages,
//     //   temperature: 0.0,
//     //   maxOutputTokens: 300,
//     // });

//     // 4. Mengembalikan teks utuh (bukan stream)
//     return new Response(result.text, {
//       status: 200,
//       headers: {
//         "Content-Type": "text/plain; charset=utf-8",
//       },
//     });
    
//   } catch (error) {
//     console.error("Chatbot Error:", error);
//     return new Response(JSON.stringify({ error: "Server Error" }), { status: 500 });
//   }
// }
