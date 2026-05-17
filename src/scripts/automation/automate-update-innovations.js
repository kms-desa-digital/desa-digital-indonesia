const admin = require('firebase-admin');
const csv = require('csv-parser');
const fs = require('fs');
const axios = require('axios');
const path = require('path');

// --- CONFIGURATION ---
const FIREBASE_BUCKET = "desa-digital-prod.firebasestorage.app";
const API_BASE_URL = "https://desa-digital-v3.vercel.app/api";
const CSV_FILE = path.join(__dirname, 'data_inovasi.csv'); // Kita buat file khusus untuk update
const SERVICE_ACCOUNT_PATH = path.join(__dirname, "../../../serviceAccountKey.json");

// Gunakan Token Admin yang sama
const AUTH_TOKEN = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImVlYzIxN2Q0MThjYjhlNWEzMTQzMThhMGQyZmZhNGUwY2ViMmU0Y2MiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vZGVzYS1kaWdpdGFsLXByb2QiLCJhdWQiOiJkZXNhLWRpZ2l0YWwtcHJvZCIsImF1dGhfdGltZSI6MTc3OTAwMzc4OSwidXNlcl9pZCI6IlBnT0JKNmxTbURUa2p0aHFKeG9pNlVvVEtDUTIiLCJzdWIiOiJQZ09CSjZsU21EVGtqdGhxSnhvaTZVb1RLQ1EyIiwiaWF0IjoxNzc5MDEzNjkyLCJleHAiOjE3NzkwMTcyOTIsImVtYWlsIjoiYWRtaW5AZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7ImVtYWlsIjpbImFkbWluQGdtYWlsLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6InBhc3N3b3JkIn19.O97hVafSF-OwzYtMtme7TwCHH5h4yiy-kYifLbvHVgibSVOGXqr60hB0ySkEHp9hCuamSdVzXVO8t7OKnVgBxWlxV_AK3zTIOnsnztmQjSrw6ajkLhaoS8HadcXyAi-06GXVRj3BWtPQqpT0UjC8kGBdj9ExgJvnPP6jgMILQbFPqrQZbcZFvJanz-1gSifRD5cd-lMnaZaLkhrXk049QlFiUjji5wdSGhde8RmMutzhc-XM4w-e2HeFpYqHWy6Rfkwbr4T-qhUDcmh6C2dOtMg16yWbm93O4bJ4GP7CpS9DxQU6cwrrOUNx1g6Roi3peHtsaQGOB01QUTiCwZB1rQ";

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
    const matchD = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (matchD && matchD[1]) return matchD[1];
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
        const downloadUrl = `https://drive.google.com/uc?export=download&id=${driveId}`;
        const driveResponse = await axios.get(downloadUrl, { responseType: 'stream' });

        return new Promise((resolve, reject) => {
            driveResponse.data
                .pipe(file.createWriteStream({ metadata: { contentType: 'image/jpeg' }, public: true }))
                .on('error', (err) => {
                    console.error(`Upload error for ${destinationPath}:`, err.message);
                    reject(err);
                })
                .on('finish', () => resolve(`https://storage.googleapis.com/${FIREBASE_BUCKET}/${destinationPath}`));
        });
    } catch (err) {
        console.error(`Gagal mengunduh file Drive (ID: ${driveId}):`, err.message);
        return null;
    }
}

// 4. Proses Per Baris Inovasi
async function processRow(row) {
    // Kunci utamanya sekarang adalah inovasiId (yang dari MongoDB _id)
    const inovasiId = row.inovasiId;
    if (!inovasiId) return;

    console.log(`\n--- Memperbarui Inovasi: ${row.nama || inovasiId} ---`);

    const payload = {};

    // Update data teks (Hanya masukkan ke payload jika kolomnya ada di CSV)
    if (row.deskripsi !== undefined) payload.deskripsi = row.deskripsi;
    if (row.nama !== undefined) payload.namaInovasi = row.nama;
    if (row.kategori !== undefined) payload.kategori = row.kategori;

    // A. Upload Foto Inovasi & timpa data images
    if (
        row.fotoInovasi !== undefined ||
        row.fotoInovasi2 !== undefined ||
        row.fotoInovasi3 !== undefined ||
        row.fotoInovasi4 !== undefined
    ) {
        let images = [];
        const timestamp = Date.now();

        if (row.fotoInovasi) {
            const img1 = await uploadToFirebase(extractDriveId(row.fotoInovasi), `innovations/${inovasiId}_${timestamp}/images/img1.jpg`);
            if (img1) images.push(img1);
        }
        if (row.fotoInovasi2) {
            const img2 = await uploadToFirebase(extractDriveId(row.fotoInovasi2), `innovations/${inovasiId}_${timestamp}/images/img2.jpg`);
            if (img2) images.push(img2);
        }
        if (row.fotoInovasi3) {
            const img3 = await uploadToFirebase(extractDriveId(row.fotoInovasi3), `innovations/${inovasiId}_${timestamp}/images/img3.jpg`);
            if (img3) images.push(img3);
        }
        if (row.fotoInovasi4) {
            const img4 = await uploadToFirebase(extractDriveId(row.fotoInovasi4), `innovations/${inovasiId}_${timestamp}/images/img4.jpg`);
            if (img4) images.push(img4);
        }

        // Timpa field 'images' dengan URL baru. Jika CSV kosong, otomatis di-reset menjadi array kosong [].
        payload.images = images;
    }

    // B. Kirim Update ke API dengan PUT
    try {
        const response = await axios.put(`${API_BASE_URL}/innovations/${inovasiId}`, payload, {
            headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
        });
        console.log(`✅ Berhasil UPDATE inovasi ${row.nama || inovasiId}`);
    } catch (err) {
        console.error(`❌ Gagal UPDATE inovasi ${row.nama || inovasiId}:`, err.response?.data || err.message);
    }
}

// 5. Jalankan Runner
const results = [];
if (!fs.existsSync(CSV_FILE)) {
    console.error(`Error: File data_inovasi_update.csv tidak ditemukan!`);
    process.exit(1);
}

fs.createReadStream(CSV_FILE)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
        console.log(`Memulai proses UPDATE ${results.length} baris data Inovasi...`);
        for (const row of results) {
            await processRow(row);
        }
        console.log('\n--- SEMUA PROSES UPDATE INOVASI SELESAI ---');
        process.exit(0);
    });
