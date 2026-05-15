const admin = require('firebase-admin');
const { google } = require('googleapis');
const csv = require('csv-parser');
const fs = require('fs');
const axios = require('axios');

// --- CONFIGURATION ---
const FIREBASE_BUCKET = "desa-digital-prod.firebasestorage.app";
const API_BASE_URL = "https://desa-digital-v3.vercel.app/api";
const CSV_FILE = 'data_innovator.csv'; // Ganti nama file sesuai file CSV Anda
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
                .on('error', reject)
                .on('finish', () => {
                    const url = `https://storage.googleapis.com/${FIREBASE_BUCKET}/${destinationPath}`;
                    resolve(url);
                });
        });
    } catch (err) {
        console.error(`Gagal upload ke ${destinationPath}:`, err.message);
        return null;
    }
}

// 5. Proses Per Baris Innovator
async function processRow(row) {
    // Gunakan userId dari CSV sebagai identifier unik
    const id = row.userId;
    if (!id) return;

    console.log(`\n--- Memproses Innovator: ${row.nama} (${id}) ---`);

    // A. Upload Logo & Header
    // Folderisasi: innovator/{id}/logo.jpg
    const logoUrl = await uploadToFirebase(extractDriveId(row.logoInovator), `innovator/${id}/logo.jpg`);
    const headerUrl = await uploadToFirebase(extractDriveId(row.headerInovator), `innovator/${id}/header.jpg`);

    // B. Build Payload (Sesuai format yang Anda minta)
    const payload = {
        namaInovator: row.nama,
        deskripsi: row.deskripsi || "",
        kategori: row.kategori || "",
        whatsapp: row.whatsapp || "",
        instagram: row.instagram || "",
        website: row.website || "",
        logo: logoUrl || "",
        header: headerUrl || ""
    };

    // C. Kirim ke API Profile Innovator dengan ID di URL
    try {
        // Endpoint: https://desa-digital-v3.vercel.app/api/innovator/profile/{userId}
        const response = await axios.post(`${API_BASE_URL}/innovator/profile/${id}`, payload);
        console.log(`✅ Berhasil update profile untuk ${row.nama}`);
    } catch (err) {
        console.error(`❌ Gagal update profile untuk ${row.nama}:`, err.response?.data || err.message);
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
        console.log(`Memulai otomasi ${results.length} data innovator...`);
        for (const row of results) {
            await processRow(row);
        }
        console.log('\n--- SEMUA PROSES INNOVATOR SELESAI ---');
    });

// node src/scripts/automation/automate-innovator.js