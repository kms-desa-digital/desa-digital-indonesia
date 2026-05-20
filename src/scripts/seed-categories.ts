// ==================================================================
// Script: seed-categories.ts
// Menambahkan kategori baru ke collection 'categories' di MongoDB.
// Jalankan sekali: npx ts-node -r tsconfig-paths/register src/scripts/seed-categories.ts
// ==================================================================

import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { MongoClient } from "mongodb";

const MONGODB_URL = process.env.MONGODB_URL!;
const MONGODB_DB = process.env.MONGODB_DB || process.env.MONGODB_DB_NAME || "desa_digital_db";

const NEW_CATEGORIES = [
  {
    icon: "/icons/Peternakan.svg",
    title: "Peternakan",
    description: "Teknologi untuk mengelola ternak dan hasil ternak mereka.",
  },
  {
    icon: "/icons/Kehutanan.svg",
    title: "Kehutanan",
    description: "Inovasi berupa teknologi untuk membantu dalam mengelola hutan desa.",
  },
  {
    icon: "/icons/Perikanan.svg",
    title: "Perikanan",
    description: "Teknologi untuk membantu nelayan dalam mengelola perikanan.",
  },
  {
    icon: "/icons/Perkebunan.svg",
    title: "Perkebunan",
    description: "Inovasi berupa teknologi untuk membantu petani dalam mengelola kebun dan hasil kebun mereka.",
  },
];

async function main() {
  const client = new MongoClient(MONGODB_URL);
  await client.connect();
  console.log("Terhubung ke MongoDB:", MONGODB_DB);

  const db = client.db(MONGODB_DB);
  const collection = db.collection("categories");

  for (const cat of NEW_CATEGORIES) {
    const existing = await collection.findOne({ title: cat.title });
    if (existing) {
      console.log(`[SKIP] Kategori sudah ada: "${cat.title}"`);
      continue;
    }
    await collection.insertOne({ ...cat, createdAt: new Date() });
    console.log(`[INSERT] Kategori ditambahkan: "${cat.title}"`);
  }

  await client.close();
  console.log("Selesai.");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
