const admin = require('firebase-admin');
const csv = require('csv-parser');
const fs = require('fs');
const axios = require('axios');
const path = require('path');

// --- CONFIGURATION ---
const FIREBASE_BUCKET = "desa-digital-prod.firebasestorage.app";
const API_BASE_URL = "https://desa-digital-v3.vercel.app/api";
const CSV_FILE = path.join(__dirname, 'data_inovator.csv');
const SERVICE_ACCOUNT_PATH = path.join(__dirname, "../../../serviceAccountKey.json");

// Gunakan Token Admin yang sama dengan sebelumnya
const AUTH_TOKEN = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImVlYzIxN2Q0MThjYjhlNWEzMTQzMThhMGQyZmZhNGUwY2ViMmU0Y2MiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vZGVzYS1kaWdpdGFsLXByb2QiLCJhdWQiOiJkZXNhLWRpZ2l0YWwtcHJvZCIsImF1dGhfdGltZSI6MTc3OTAwMzc4OSwidXNlcl9pZCI6IlBnT0JKNmxTbURUa2p0aHFKeG9pNlVvVEtDUTIiLCJzdWIiOiJQZ09CSjZsU21EVGtqdGhxSnhvaTZVb1RLQ1EyIiwiaWF0IjoxNzc5MDEwMzkxLCJleHAiOjE3NzkwMTM5OTEsImVtYWlsIjoiYWRtaW5AZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7ImVtYWlsIjpbImFkbWluQGdtYWlsLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6InBhc3N3b3JkIn19.qCnkJPQOxOB_yPx2fl1iIZFeif8QV6tZLUEg3RIt264hVVKO0KmOeIFetvg9oPe67ddqO6neiXfQJCJHgAU9cJth9MpsODwIk6Weyq37bue2iyxEVR231sss_JZk4urDBtw_3W5QMmnaKsbhC7YIGAn-iY8pXK-OsNBuBCu0klf498fNXfhDQ60uIVQ4TBoVMhcbsX6CeUi-3VrOwabmlYNdNNsT0O7OlwxXonTumo1q-C4qLOznWxgh0Fh7Wk-PhW5LqtHRH8mmRo_hQ9uO3DRfqKiUIUJCRB-OTV8pau0zxTGCR_BMGF599yl3jHgH9bEY4ti0sP51eiC8owRZ0w";

// 1. Setup Firebase Admin
const serviceAccount = require(SERVICE_ACCOUNT_PATH);
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: FIREBASE_BUCKET
    });
}

// 2. Extract ID dari link Google Drive
function extractDriveId(url) {
    if (!url || typeof url !== 'string') return null;

    // Match format: /file/d/ID/view
    const matchD = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (matchD && matchD[1]) return matchD[1];

    // Match format: ?id=ID
    const matchId = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (matchId && matchId[1]) return matchId[1];

    return null;
}

// 3. Fungsi Utama Upload
async function uploadToFirebase(driveId, destinationPath) {
    if (!driveId) return null;

    try {
        const bucket = admin.storage().bucket();
        const file = bucket.file(destinationPath);

        // Download dari Google Drive menggunakan public link
        const downloadUrl = `https://drive.google.com/uc?export=download&id=${driveId}`;
        const driveResponse = await axios.get(downloadUrl, { responseType: 'stream' });

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
        console.error(`Gagal mengunduh file dari Drive (ID: ${driveId}). Pastikan link bisa diakses publik. Error:`, err.message);
        return null;
    }
}

// 4. Proses Per Baris Spreadsheet
async function processRow(row) {
    const id = row.userId;
    if (!id) return;

    console.log(`\n--- Memproses Innovator: ${row.nama} (${id}) ---`);

    // A. Upload Images
    const logoUrl = await uploadToFirebase(extractDriveId(row.logoInnovator), `innovators/${id}/logo.jpg`);
    const headerUrl = await uploadToFirebase(extractDriveId(row.headerInnovator), `innovators/${id}/header.jpg`);

    // B. Build Payload
    let payload = {
        namaInovator: row.nama || "",
        deskripsi: row.deskripsi || "",
        kategori: row.kategori || "",
        whatsapp: row.whatsapp || "",
        instagram: row.instagram || "",
        website: row.website || ""
    };

    // Seperti rules sebelumnya, kosongkan jika cell kosong
    payload.logo = logoUrl || "";
    payload.header = headerUrl || "";

    // C. Kirim ke API menggunakan POST (di endpoint ini POST berfungsi sebagai Upsert)
    try {
        const response = await axios.post(`${API_BASE_URL}/innovator/profile/${id}`, payload, {
            headers: {
                Authorization: `Bearer ${AUTH_TOKEN}`
            }
        });
        console.log(`✅ Berhasil UPSERT data innovator ${row.nama}`);
    } catch (err) {
        console.error(`❌ Gagal UPSERT innovator ${row.nama}:`, err.response?.data || err.message);
    }
}

// 5. Jalankan Runner
const results = [];
if (!fs.existsSync(CSV_FILE)) {
    console.error(`Error: File data_inovator.csv tidak ditemukan di folder automation!`);
    process.exit(1);
}

fs.createReadStream(CSV_FILE)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
        console.log(`Memulai proses UPSERT ${results.length} baris data innovator...`);
        for (const row of results) {
            await processRow(row);
        }
        console.log('\n--- SEMUA PROSES INNOVATOR SELESAI ---');
        process.exit(0);
    });
