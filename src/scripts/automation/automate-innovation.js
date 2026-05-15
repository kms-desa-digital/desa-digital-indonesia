const admin = require('firebase-admin');
const { google } = require('googleapis');
const csv = require('csv-parser');
const fs = require('fs');
const axios = require('axios');

// --- CONFIGURATION ---
const FIREBASE_BUCKET = "desa-digital-prod.firebasestorage.app";
const API_BASE_URL = "https://desa-digital-v3.vercel.app/api";
const CSV_FILE = 'data_inovasi.csv';
const SERVICE_ACCOUNT_PATH = "./serviceAccountKey.json";

// 1. Setup Firebase Admin
const serviceAccount = require(SERVICE_ACCOUNT_PATH);
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: FIREBASE_BUCKET
    });
}

// 2. Setup Google Drive Auth
const auth = new google.auth.GoogleAuth({
    keyFile: SERVICE_ACCOUNT_PATH,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});

function extractDriveId(url) {
    if (!url || typeof url !== 'string' || !url.includes('id=')) return null;
    return url.split('id=')[1].split('&')[0];
}

async function uploadToFirebase(driveId, destinationPath) {
    if (!driveId) return null;
    try {
        const driveAuth = await auth.getClient();
        const drive = google.drive({ version: 'v3', auth: driveAuth });
        const bucket = admin.storage().bucket();
        const file = bucket.file(destinationPath);
        const driveResponse = await drive.files.get({ fileId: driveId, alt: 'media' }, { responseType: 'stream' });

        return new Promise((resolve, reject) => {
            driveResponse.data
                .pipe(file.createWriteStream({ metadata: { contentType: 'image/jpeg' }, public: true }))
                .on('error', reject)
                .on('finish', () => {
                    resolve(`https://storage.googleapis.com/${FIREBASE_BUCKET}/${destinationPath}`);
                });
        });
    } catch (err) { return null; }
}

// 5. Proses Per Baris Inovasi
async function processRow(row) {
    const innovatorId = row.innovatorId;
    if (!innovatorId) return;

    console.log(`\n--- Memproses Inovasi: ${row.nama} ---`);

    // A. Upload Foto Inovasi
    // Folderisasi: innovations/{innovatorId}_{timestamp}/images/
    const timestamp = Date.now();
    const img1 = await uploadToFirebase(extractDriveId(row.fotoInovasi), `innovations/${innovatorId}_${timestamp}/images/img1.jpg`);
    const img2 = await uploadToFirebase(extractDriveId(row.fotoInovasi2), `innovations/${innovatorId}_${timestamp}/images/img2.jpg`);

    // B. Build Payload
    const payload = {
        innovatorId: innovatorId,
        statusInovasi: row.status || "",
        namaInovasi: row.nama || "",
        kategori: row.kategori || "",
        tahunDibuat: row.tahun || "",
        deskripsi: row.deskripsi || "",
        modelBisnis: [row.modelBisnis1, row.modelBisnis2].filter(m => m),
        inputDesaMenerapkan: row.desa || "",
        hargaMinimal: Number(row.hargaMin) || 0,
        hargaMaksimal: Number(row.hargaMax) || 0,
        images: [img1, img2].filter(url => url !== null),
        manfaat: [
            { judul: row.manfaat || "", deskripsi: row.desManfaat || "" },
            { judul: row.manfaat2 || "", deskripsi: row.desManfaat2 || "" }
        ].filter(m => m.judul),
        infrastruktur: [row.infrastruktur, row.infrastruktur2].filter(i => i)
    };

    // C. Kirim ke API Innovations
    try {
        const response = await axios.post(`${API_BASE_URL}/innovations`, payload);
        console.log(`✅ Berhasil input inovasi: ${row.nama}`);
    } catch (err) {
        console.error(`❌ Gagal input inovasi ${row.nama}:`, err.response?.data || err.message);
    }
}

// 6. Runner
const results = [];
fs.createReadStream(CSV_FILE)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
        for (const row of results) { await processRow(row); }
        console.log('\n--- SEMUA PROSES INOVASI SELESAI ---');
    });

// node src/scripts/automation/automate-innovation.js