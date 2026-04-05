import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { generateEmbeddings } from "@/lib/ai/rag-utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      judul,
      deskripsi,
      perspektif,
      keunggulan_inovasi,
      potensi_aplikasi,
      inovator_nama,
      inovator_status_paten,
      kategori,
    } = body;

    if (!judul || !deskripsi) {
      return NextResponse.json(
        { error: "Judul dan deskripsi wajib diisi" },
        { status: 400 }
      );
    }

    const keunggulanText = Array.isArray(keunggulan_inovasi)
      ? keunggulan_inovasi.join(", ")
      : keunggulan_inovasi ?? "";

    const inovatorText = Array.isArray(inovator_nama)
      ? inovator_nama.join(", ")
      : inovator_nama ?? "";

    const text = `
      Kategori: ${kategori || "UMUM"}.
      Judul: ${judul}.
      Deskripsi: ${deskripsi}.
      Perspektif: ${perspektif ?? ""}.
      Keunggulan: ${keunggulanText}.
      Potensi Aplikasi: ${potensi_aplikasi ?? ""}.
      Inovator: ${inovatorText}.
    `
      .replace(/\s+/g, " ")
      .trim();

    // Generate embedding
    const vector = await generateEmbeddings(text);

    // Save to database
    const db = await connectToDatabase();
    const collection = db.collection("doc_embeddings");

    const newDoc = {
      source: body.source || "manual_entry_innovation",
      content: text,
      embedding_vector: vector,
      metadata: {
        type: "inovasi",
        kategori: kategori || "UMUM",
        judul,
        deskripsi,
        perspektif,
        keunggulan_inovasi,
        potensi_aplikasi,
        inovator_nama,
        inovator_status_paten,
      },
      createdAt: new Date(),
    };

    const result = await collection.insertOne(newDoc);

    return NextResponse.json({
      success: true,
      id: result.insertedId,
      message: "Data inovasi berhasil ditambahkan ke chatbot",
    });
  } catch (error: any) {
    console.error("Error in ingest-innovation API:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}