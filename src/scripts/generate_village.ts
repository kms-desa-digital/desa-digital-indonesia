import dotenv from "dotenv";
import { writeFile } from "node:fs/promises";
import path from "node:path";

dotenv.config({ path: ".env.local" });

interface CsvRow {
    id: string;
    namaDesa: string;
    status: string;
}

function toCsv(rows: CsvRow[]): string {
    const header = "id,nama,status";
    const body = rows
        .map((row) => `${escapeCsv(row.id)},${escapeCsv(row.namaDesa)},${escapeCsv(row.status)}`)
        .join("\n");

    return body ? `${header}\n${body}` : header;
}

function escapeCsv(value: string): string {
    const safeValue = value ? String(value) : "";
    const needsQuotes = /[",\n]/.test(safeValue);
    const escaped = safeValue.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
}

async function main() {
    const { connectToDatabase } = await import("../lib/db/mongodb");
    const db = await connectToDatabase();

    console.log("--- Menghasilkan List Desa (Menunggu) ---");

    const waitingFilter = {
        $or: [
            { status: { $regex: /menunggu/i } },
            { status: "" },
            { status: null },
            { status: { $exists: false } }
        ]
    };

    // Ambil data dari koleksi 'villages'
    const fromVillages = await db.collection("villages")
        .find(waitingFilter)
        .toArray();

    const rows: CsvRow[] = [];
    const addedIds = new Set<string>();

    fromVillages.forEach(doc => {
        const id = doc._id.toString();
        if (!addedIds.has(id)) {
            const nama = doc.namaDesa || doc.name || doc.nama || doc.displayName || "Tanpa Nama";

            rows.push({
                id,
                namaDesa: nama,
                status: "Terverifikasi"
            });

            addedIds.add(id);
        }
    });

    const csv = toCsv(rows);
    const outputPath = path.resolve(process.cwd(), "src/scripts/koleksi_id_village.csv");
    await writeFile(outputPath, csv, "utf8");

    console.log(`\nBerhasil mengumpulkan ${rows.length} data.`);
    console.log(`File tersimpan di: ${outputPath}`);
}

main().catch((error) => {
    console.error("Gagal export CSV:", error);
    process.exit(1);
});
