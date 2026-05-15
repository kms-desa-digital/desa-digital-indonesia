const admin = require('firebase-admin');
const { google } = require('googleapis');
const csv = require('csv-parser');
const fs = require('fs');
const axios = require('axios');

// --- CONFIGURATION ---
const FIREBASE_BUCKET = "desa-digital-prod.firebasestorage.app";
const API_BASE_URL = "https://desa-digital-v3.vercel.app/api";
const CSV_FILE = 'data_desa.csv';
const SERVICE_ACCOUNT_PATH = "./serviceAccountKey.json";

// 1. Setup Firebase Admin
const serviceAccount = require(SERVICE_ACCOUNT_PATH);
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: FIREBASE_BUCKET
});

// 2. Setup Google Drive Auth
const auth = new google.auth.GoogleAuth({
    keyFile: SERVICE_ACCOUNT_PATH,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});

// 3. Extract ID dari link Google Drive
function extractDriveId(url) {
    if (!url || typeof url !== 'string' || !url.includes('id=')) return null;
    return url.split('id=')[1].split('&')[0];
}

// 4. Fungsi Utama Upload
async function uploadToFirebase(driveId, destinationPath) {
    if (!driveId) return null;

    try {
        const driveAuth = await auth.getClient();
        const drive = google.drive({ version: 'v3', auth: driveAuth });
        const bucket = admin.storage().bucket();
        const file = bucket.file(destinationPath);

        const driveResponse = await drive.files.get(
            { fileId: driveId, alt: 'media' },
            { responseType: 'stream' }
        );

        return new Promise((resolve, reject) => {
            driveResponse.data
                .pipe(file.createWriteStream({
                    metadata: { contentType: 'image/jpeg' },
                    public: true
                }))
                .on('error', (err) => {
                    console.error(`Upload error for ${destinationPath}:`, err.message);
                    reject(err);
                })
                .on('finish', () => {
                    const url = `https://storage.googleapis.com/${FIREBASE_BUCKET}/${destinationPath}`;
                    resolve(url);
                });
        });
    } catch (err) {
        console.error(`Gagal upload ${driveId}:`, err.message);
        return null;
    }
}

// 5. Proses Per Baris Spreadsheet
async function processRow(row) {
    const id = row.userId;
    if (!id) return;

    console.log(`\n--- Memproses Desa: ${row.nama} (${id}) ---`);

    // A. Upload Images & Files
    const logoUrl = await uploadToFirebase(extractDriveId(row.logoDesa), `villages/${id}/logo.jpg`);
    const headerUrl = await uploadToFirebase(extractDriveId(row.headerDesa), `villages/${id}/header.jpg`);

    // Upload multi images (jika ada fotoInovasi2, dst)
    const img1 = await uploadToFirebase(extractDriveId(row.fotoInovasi), `villages/${id}/gallery/img1.jpg`);
    const img2 = await uploadToFirebase(extractDriveId(row.fotoInovasi2), `villages/${id}/gallery/img2.jpg`);

    // B. Build Payload sesuai format Anda
    const payload = {
        userId: id,
        namaDesa: row.nama,
        lokasi: {
            provinsi: { value: row.kodeProv, label: row.namaProv },
            kabupatenKota: { value: row.kodeKota, label: row.namaKota },
            kecamatan: { value: row.kodeKec, label: row.namaKec },
            desaKelurahan: { value: row.kodeDesa, label: row.namaDesa }
        },
        logo: logoUrl || "",
        header: headerUrl || "",
        images: [img1, img2].filter(url => url !== null),
        deskripsi: row.deskripsi || "",
        potensiDesa: [row.potensi, row.potensi2].filter(p => p),
        geografisDesa: row.geografis || "",
        teknologi: row.perkembanganTeknologi || "",
        kemampuan: row.kemampuanTeknologi || "",
        sosialBudaya: row.sosialBudaya || "",
        sumberDaya: row.sumberDaya || "",
        kondisijalan: row.kondisiJalan || "",
        jaringan: row.jaringan || "",
        listrik: row.listrik || "",
        infrastrukturDesa: row.lainLain || "",
        whatsapp: row.whatsapp || "",
        instagram: row.instagram || "",
        website: row.website || ""
    };

    // C. Kirim ke API
    try {
        const response = await axios.post(`${API_BASE_URL}/villages`, payload);
        console.log(`✅ Berhasil input API untuk ${row.nama}`);
    } catch (err) {
        console.error(`❌ Gagal input API untuk ${row.nama}:`, err.response?.data || err.message);
    }
}

// 6. Jalankan Runner
const results = [];
if (!fs.existsSync(CSV_FILE)) {
    console.error(`Error: File ${CSV_FILE} tidak ditemukan!`);
    process.exit(1);
}

fs.createReadStream(CSV_FILE)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
        console.log(`Memulai proses ${results.length} baris data...`);
        for (const row of results) {
            await processRow(row);
        }
        console.log('\n--- SEMUA PROSES SELESAI ---');
    });

// node src/scripts/automation/automate-villages.js`