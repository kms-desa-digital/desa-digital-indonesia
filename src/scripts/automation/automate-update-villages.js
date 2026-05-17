const admin = require('firebase-admin');
const { google } = require('googleapis');
const csv = require('csv-parser');
const fs = require('fs');
const axios = require('axios');
const path = require('path');

// --- CONFIGURATION ---
const FIREBASE_BUCKET = "desa-digital-prod.firebasestorage.app";
const API_BASE_URL = "https://desa-digital-v3.vercel.app/api";
const CSV_FILE = path.join(__dirname, 'data_desa.csv');
const SERVICE_ACCOUNT_PATH = path.join(__dirname, "../../../serviceAccountKey.json");
// Gunakan Token Admin yang Anda dapatkan dari browser
const AUTH_TOKEN = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImVlYzIxN2Q0MThjYjhlNWEzMTQzMThhMGQyZmZhNGUwY2ViMmU0Y2MiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vZGVzYS1kaWdpdGFsLXByb2QiLCJhdWQiOiJkZXNhLWRpZ2l0YWwtcHJvZCIsImF1dGhfdGltZSI6MTc3OTAwMzc4OSwidXNlcl9pZCI6IlBnT0JKNmxTbURUa2p0aHFKeG9pNlVvVEtDUTIiLCJzdWIiOiJQZ09CSjZsU21EVGtqdGhxSnhvaTZVb1RLQ1EyIiwiaWF0IjoxNzc5MDEwMzkxLCJleHAiOjE3NzkwMTM5OTEsImVtYWlsIjoiYWRtaW5AZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7ImVtYWlsIjpbImFkbWluQGdtYWlsLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6InBhc3N3b3JkIn19.qCnkJPQOxOB_yPx2fl1iIZFeif8QV6tZLUEg3RIt264hVVKO0KmOeIFetvg9oPe67ddqO6neiXfQJCJHgAU9cJth9MpsODwIk6Weyq37bue2iyxEVR231sss_JZk4urDBtw_3W5QMmnaKsbhC7YIGAn-iY8pXK-OsNBuBCu0klf498fNXfhDQ60uIVQ4TBoVMhcbsX6CeUi-3VrOwabmlYNdNNsT0O7OlwxXonTumo1q-C4qLOznWxgh0Fh7Wk-PhW5LqtHRH8mmRo_hQ9uO3DRfqKiUIUJCRB-OTV8pau0zxTGCR_BMGF599yl3jHgH9bEY4ti0sP51eiC8owRZ0w";

// 1. Setup Firebase Admin
const serviceAccount = require(SERVICE_ACCOUNT_PATH);
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: FIREBASE_BUCKET
});


// 3. Extract ID dari link Google Drive
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

// 4. Fungsi Utama Upload
async function uploadToFirebase(driveId, destinationPath) {
    if (!driveId) return null;

    try {
        const bucket = admin.storage().bucket();
        const file = bucket.file(destinationPath);

        // Download dari Google Drive menggunakan public link (tidak perlu API Key jika sudah di-share publik)
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
        console.error(`Gagal mengunduh file dari Drive (ID: ${driveId}). Pastikan link bisa diakses publik (Anyone with the link). Error:`, err.message);
        return null;
    }
}

// 5. Proses Per Baris Spreadsheet
async function processRow(row) {
    const id = row.userId;
    if (!id) return;

    console.log(`\n--- Memperbarui Desa: ${row.nama} (${id}) ---`);

    // A. Upload Images & Files
    // Catatan: Jika logoUrl gagal (null), usahakan jangan menimpa logo yang lama dengan null
    const logoUrl = await uploadToFirebase(extractDriveId(row.logoDesa), `villages/${id}/logo.jpg`);
    const headerUrl = await uploadToFirebase(extractDriveId(row.headerDesa), `villages/${id}/header.jpg`);

    const img1 = await uploadToFirebase(extractDriveId(row.fotoInovasi), `villages/${id}/gallery/img1.jpg`);
    const img2 = await uploadToFirebase(extractDriveId(row.fotoInovasi2), `villages/${id}/gallery/img2.jpg`);

    // B. Build Payload (Hanya field yang valid / tidak null/undefined)
    let payload = {
        namaDesa: row.nama,
        lokasi: {
            provinsi: { value: row.kodeProv, label: row.namaProv },
            kabupatenKota: { value: row.kodeKota, label: row.namaKota },
            kecamatan: { value: row.kodeKec, label: row.namaKec },
            desaKelurahan: { value: row.kodeDesa, label: row.namaDesa }
        },
        deskripsi: row.deskripsi || "",
        potensiDesa: [row.potensi, row.potensi2]
            .filter(Boolean)
            .flatMap(p => String(p).split(',').map(s => s.trim()))
            .filter(Boolean),
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

    // Jika Anda mengosongkan kolom logoDesa di CSV, ini akan menghapus logo di database ("")
    payload.logo = logoUrl || "";

    // Jika Anda mengosongkan kolom headerDesa di CSV, ini akan menghapus header di database ("")
    payload.header = headerUrl || "";

    // Jika kolom fotoInovasi kosong, ini akan me-reset array images menjadi kosong []
    payload.images = [img1, img2].filter(url => url !== null);

    // C. Kirim ke API menggunakan PUT (Update)
    try {
        const response = await axios.put(`${API_BASE_URL}/villages/${id}`, payload, {
            headers: {
                Authorization: `Bearer ${AUTH_TOKEN}`
            }
        });
        console.log(`✅ Berhasil UPDATE data desa ${row.nama}`);
    } catch (err) {
        console.error(`❌ Gagal UPDATE desa ${row.nama}:`, err.response?.data || err.message);
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
        console.log(`Memulai proses UPDATE ${results.length} baris data...`);
        for (const row of results) {
            await processRow(row);
        }
        console.log('\n--- SEMUA PROSES UPDATE SELESAI ---');
        process.exit(0);
    });
