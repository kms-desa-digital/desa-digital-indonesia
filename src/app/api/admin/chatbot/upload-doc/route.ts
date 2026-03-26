import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { generateEmbeddings } from "@/lib/ai/rag-utils";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const customSource = formData.get("sourceName") as string;

    if (!file) {
      return NextResponse.json(
        { error: "File tidak ditemukan" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Fungsi render khusus untuk memisahkan teks per halaman
    let pageTexts: string[] = [];
    
    // pdf-parse options
    const options = {
      pagerender: (pageData: any) => {
        return pageData.getTextContent().then((textContent: any) => {
          let lastY, text = "";
          for (let item of textContent.items) {
            if (lastY !== item.transform[5] && lastY !== undefined) {
              text += "\n";
            }
            text += item.str;
            lastY = item.transform[5];
          }
          pageTexts.push(text);
          return text;
        });
      }
    };

    await pdf(buffer, options);

    if (pageTexts.length === 0) {
      return NextResponse.json(
        { error: "Gagal mengekstrak teks dari PDF" },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();
    const collection = db.collection("doc_embeddings");

    const results = [];
    const sourceName = customSource || file.name;

    // Proses per halaman
    for (let i = 0; i < pageTexts.length; i++) {
      const content = pageTexts[i].replace(/\s+/g, " ").trim();
      
      if (content.length < 10) continue; // Skip halaman kosong atau terlalu pendek

      // Generate embedding
      const vector = await generateEmbeddings(content);

      const newNode = {
        source: sourceName,
        content: content,
        embedding_vector: vector,
        metadata: {
          type: "document",
          page: i + 1,
          total_pages: pageTexts.length,
        },
        createdAt: new Date(),
      };

      await collection.insertOne(newNode);
      results.push({ page: i + 1, success: true });
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil mengunggah dan memproses ${results.length} halaman dari ${sourceName}`,
      processed_pages: results.length,
    });

  } catch (error: any) {
    console.error("Error in upload-doc API:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Support body size up to 10MB
export const config = {
  api: {
    bodyParser: false,
  },
};
