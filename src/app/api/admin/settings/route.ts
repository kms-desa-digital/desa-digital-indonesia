import { connectToDatabase } from "@/lib/db/mongodb";
import { verifyRoleFromToken } from "@/lib/auth/verifyRole";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const db = await connectToDatabase();
    const settings = await db.collection("settings").findOne({ key: "chatbot_config" });
    
    // Default config — baca dari env, tidak ada hardcoded
    const defaultConfig = {
      provider: "ollama",
      modelName: process.env.OLLAMA_GENERATIVE_MODEL || "qwen3:8b",
      // provider: process.env.CHATANYWHERE_API_KEY ? "chatanywhere" : "gemini",
      // modelName: process.env.CHATANYWHERE_API_KEY
      //   ? (process.env.CHATANYWHERE_DEFAULT_MODEL ?? "")
      //   : (process.env.GEMINI_DEFAULT_MODEL ?? ""),
    };
    
    return NextResponse.json(settings?.value || defaultConfig);
  } catch (error) {
    console.error("[GET Settings] Error:", error);
    return NextResponse.json({ error: "Gagal mengambil konfigurasi" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    const { role } = await verifyRoleFromToken(authHeader);
    
    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json(); // { provider: 'gemini' | 'chatanywhere', modelName: string }
    const db = await connectToDatabase();
    
    await db.collection("settings").updateOne(
      { key: "chatbot_config" },
      { $set: { value: body, updatedAt: new Date() } },
      { upsert: true }
    );

    return NextResponse.json({ message: "Konfigurasi AI diperbarui" });
  } catch (error) {
    console.error("[POST Settings] Error:", error);
    return NextResponse.json({ error: "Gagal memperbarui konfigurasi" }, { status: 500 });
  }
}