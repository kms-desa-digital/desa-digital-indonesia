// ==================================================================
// Ingest data dari collection MongoDB Atlas ke db_embeddings
// Collections: innovations, villages, innovators, claimInnovations
// ==================================================================

import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

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

// cek apakah error Ollama bersifat sementara
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

// tunggu sampai Ollama siap lagi
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

// builder text untuk data inovasi
function buildInnovationText(doc: any): string {
    const manfaat = Array.isArray(doc.manfaat)
        ? doc.manfaat.join(", ")
        : doc.manfaat ?? "";

    const infrastruktur = Array.isArray(doc.infrastruktur)
        ? doc.infrastruktur.join(", ")
        : doc.infrastruktur ?? "";

    const modelBisnis = Array.isArray(doc.modelBisnis)
        ? doc.modelBisnis.join(", ")
        : doc.modelBisnis ?? "";

    return `
    Inovasi: ${doc.namaInovasi ?? ""}.
    Kategori: ${doc.kategori ?? ""}.
    Deskripsi: ${doc.deskripsi ?? ""}.
    Status Inovasi: ${doc.statusInovasi ?? ""}.
    Model Bisnis: ${modelBisnis}.
    Manfaat: ${manfaat}.
    Infrastruktur: ${infrastruktur}.
    Harga: ${doc.hargaMinimal ?? ""} - ${doc.hargaMaksimal ?? ""}.
    Inovator: ${doc.namaInnovator ?? ""}.
    Tahun Dibuat: ${doc.tahunDibuat ?? ""}.
    Desa Menerapkan: ${doc.inputDesaMenerapkan ?? ""}.
  `
        .replace(/\s+/g, " ")
        .trim();
}

// builder text untuk data desa
function buildVillageText(doc: any): string {
    const lokasiStr = [doc.desa, doc.kecamatan, doc.kabupaten, doc.provinsi]
        .filter(Boolean)
        .join(", ");

    const lokasiFinal = lokasiStr || doc.lokasi?.deskripsi || "";

    const potensi = Array.isArray(doc.potensiDesa)
        ? doc.potensiDesa.join(", ")
        : doc.potensiDesa ?? "";
    const inovasiDiterapkan = Array.isArray(doc.inovasiDiterapkan)
        ? doc.inovasiDiterapkan.join(", ")
        : doc.inovasiDiterapkan ?? "";
    const inovatorDamping = Array.isArray(doc.inovatorDamping)
        ? doc.inovatorDamping.join(", ")
        : doc.inovatorDamping ?? "";

    return `
    Desa: ${doc.namaDesa ?? ""}.
    Deskripsi: ${doc.deskripsi ?? ""}.
    Manfaat: ${doc.manfaat ?? ""}.
    Potensi: ${potensi}.
    Lokasi: ${lokasiFinal}.
    Geografis: ${doc.geografisDesa ?? ""}.
    Jaringan: ${doc.jaringan ?? ""}.
    Kemampuan: ${doc.kemampuan ?? ""}.
    Kondisi Jalan: ${doc.kondisiJalan ?? ""}.
    Jumlah Inovasi Diterapkan: ${doc.jumlahInovasiDiterapkan ?? 0}.
    Kesiapan Digital: ${doc.kesiapanDigital ?? ""}.
    Kesiapan Teknologi: ${doc.kesiapanTeknologi ?? ""}.
    Infrastruktur: ${doc.infrastruktur ?? ""}.
    Listrik: ${doc.listrik ?? ""}.
    Sosial Budaya: ${doc.sosialBudaya ?? ""}.
    Sumber Daya: ${doc.sumberDaya ?? ""}.
    Kategori: ${doc.kategori ?? ""}.
    Tahun Data: ${doc.tahunData ?? ""}.
    WhatsApp: ${doc.whatsApp ?? doc.whatsapp ?? ""}.
  `
        .replace(/\s+/g, " ")
        .trim();
}

// builder text untuk data inovator
function buildInnovatorText(doc: any): string {
    return `
    Inovator: ${doc.namaInovator ?? ""}.
    Deskripsi: ${doc.deskripsi ?? ""}.
    Kategori: ${doc.kategori ?? ""}.
    Jumlah Inovasi: ${doc.jumlahInovasi ?? 0}.
    Jumlah Desa Dampingan: ${doc.jumlahDesaDampingan ?? 0}.
    Tahun Dibentuk: ${doc.tahunDibentuk ?? ""}.
    Status: ${doc.status ?? ""}.
    WhatsApp: ${doc.whatsapp ?? ""}.
    Website: ${doc.website ?? ""}.
    Instagram: ${doc.instagram ?? ""}.
  `
        .replace(/\s+/g, " ")
        .trim();
}

// builder text untuk data klaim inovasi
function buildClaimText(doc: any): string {
    return `
    Klaim Inovasi: ${doc.namaDesa ?? "Sebuah desa"} telah mengajukan klaim untuk menerapkan inovasi bernama ${doc.namaInovasi ?? ""}.
    Status Klaim saat ini: ${doc.status ?? ""}.
    Catatan Admin: ${doc.catatanAdmin ?? "Tidak ada catatan"}.
  `
        .replace(/\s+/g, " ")
        .trim();
}

// konfigurasi collection yang akan diproses
interface CollectionConfig {
    name: string;
    buildText: (doc: any) => string;
    labelField: string;
}

const COLLECTIONS_TO_INGEST: CollectionConfig[] = [
    {
        name: "innovations",
        buildText: buildInnovationText,
        labelField: "namaInovasi",
    },
    {
        name: "villages",
        buildText: buildVillageText,
        labelField: "namaDesa",
    },
    {
        name: "innovators",
        buildText: buildInnovatorText,
        labelField: "namaInovator",
    },
    {
        name: "claimInnovations",
        buildText: buildClaimText,
        labelField: "namaInovasi", 
    },
];

async function runIngestion() {
    try {
        const { connectToDatabase } = await import(
            "../lib/db/mongodb"
        );
        const { generateEmbeddings } = await import(
            "../lib/ai/rag-utils"
        );

        log.info("Mulai ingestion database ke db_embeddings");

        const db = await connectToDatabase();
        const embeddingCollection = db.collection("db_embeddings");

        for (const config of COLLECTIONS_TO_INGEST) {
            log.info(`Processing collection: ${config.name}`);

            // ambil semua data dari collection
            const sourceData = await db
                .collection(config.name)
                .find({})
                .toArray();

            if (sourceData.length === 0) {
                log.warn(`Collection ${config.name} kosong`);
                continue;
            }

            log.info(
                `Found ${sourceData.length} data di ${config.name}`
            );

            // hapus embedding lama
            const deleteResult = await embeddingCollection.deleteMany({
                source_collection: config.name,
            });

            log.info(
                `Deleted ${deleteResult.deletedCount} data lama`
            );

            let success = 0;
            let failed = 0;

            const docsBuffer: any[] = [];

            // proses satu record
            const processRecord = async (record: any, index: number) => {
                const text = config.buildText(record);

                if (!text || text.length < 10) {
                    log.warn(`Skip record ${index + 1}`);
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

                const label =
                    record[config.labelField] || `record-${index}`;

                log.info(
                    `[${config.name}] ${index + 1}/${sourceData.length} - ${label}`
                );

                // simpan ke buffer beserta metadatanya
                docsBuffer.push({
                    source_collection: config.name,
                    source_id: record._id.toString(),
                    content: text,
                    embedding_vector: vector,
                    metadata: {
                        label,

                        ...(config.name === "innovations" && {
                            namaInovasi: record.namaInovasi,
                            kategori: record.kategori,
                            deskripsi: record.deskripsi,
                            inputDesaMenerapkan: record.inputDesaMenerapkan,
                            status: record.status,
                        }),

                        ...(config.name === "villages" && {
                            namaDesa: record.namaDesa,
                            deskripsi: record.deskripsi,
                            lokasi: [
                                record.desa,
                                record.kecamatan,
                                record.kabupaten,
                                record.provinsi,
                            ]
                                .filter(Boolean)
                                .join(", ") || record.lokasi?.deskripsi,
                            potensiDesa: record.potensiDesa,
                            idm: record.idm,
                            status: record.status,
                            kategori: record.kategori,
                            inovasiDiterapkan: record.inovasiDiterapkan,
                            inovatorDamping: record.inovatorDamping,
                        }),

                        ...(config.name === "innovators" && {
                            namaInovator: record.namaInovator,
                            kategori: record.kategori,
                            deskripsi: record.deskripsi,
                            status: record.status,
                            instagram: record.instagram,
                        }),

                        ...(config.name === "claimInnovations" && {
                            namaDesa: record.namaDesa,
                            namaInovasi: record.namaInovasi,
                            status: record.status,
                            desaId: record.desaId,
                            inovasiId: record.inovasiId,
                            inovatorId: record.inovatorId,
                            catatanAdmin: record.catatanAdmin,
                        }),
                    },
                    createdAt: new Date(),
                });
            };

            // concurrency control sederhana
            let index = 0;
            const workers: Promise<void>[] = [];

            for (let i = 0; i < MAX_CONCURRENT; i++) {
                workers.push(
                    (async () => {
                        while (index < sourceData.length) {
                            const currentIndex = index++;
                            await processRecord(
                                sourceData[currentIndex],
                                currentIndex
                            );
                        }
                    })()
                );
            }

            await Promise.all(workers);

            // insert sekaligus
            if (docsBuffer.length > 0) {
                await embeddingCollection.insertMany(docsBuffer);
            }

            log.success(
                `${config.name} selesai | Success: ${success} | Failed: ${failed}`
            );
        }

        log.success("Semua ingestion database selesai");
        process.exit(0);
    } catch (err) {
        log.error(`Error: ${err}`);
        process.exit(1);
    }
}

runIngestion();