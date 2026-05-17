const fs = require('fs');
const csv = require('csv-parser');
const axios = require('axios');
const path = require('path');

const API_BASE_URL = "https://desa-digital-v3.vercel.app/api";

// Gunakan Token Admin (harus role admin untuk endpoint verify)
const AUTH_TOKEN = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImVlYzIxN2Q0MThjYjhlNWEzMTQzMThhMGQyZmZhNGUwY2ViMmU0Y2MiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vZGVzYS1kaWdpdGFsLXByb2QiLCJhdWQiOiJkZXNhLWRpZ2l0YWwtcHJvZCIsImF1dGhfdGltZSI6MTc3OTAwMzc4OSwidXNlcl9pZCI6IlBnT0JKNmxTbURUa2p0aHFKeG9pNlVvVEtDUTIiLCJzdWIiOiJQZ09CSjZsU21EVGtqdGhxSnhvaTZVb1RLQ1EyIiwiaWF0IjoxNzc5MDIwMjk0LCJleHAiOjE3NzkwMjM4OTQsImVtYWlsIjoiYWRtaW5AZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7ImVtYWlsIjpbImFkbWluQGdtYWlsLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6InBhc3N3b3JkIn19.C7LwYZZQeUIWnKmkspH5adr85NGEToXsGraOLaaUOekTYy1Geu0zcjaZDITRyF88s0JknXMK_0L9cX_oNjN9q3mIXJVrgTz4M3UeUihFR0fRHGiMZiAOocu0KYniaxYPTWRhwqMHoAHFLbUidxMl40OZaabfXX6phNxTAOSI4LbOUcpKKxry7L4Og9QNKGKPVKa1wcginSCK49iXDFxLDHe27OEU1rKo6noo5fSRRiQgMNuxVHeJwauRLShKgPN3_85TjdK8SNDGe4nMBhokW_9AXWfdspaNp_YtB35uoZ6hkJMikQU6BdB_90ZkvmIN1PwKJc5DYF-yi2GyfJjOjg";

// Fungsi Helper untuk request Verify
async function verifyItem(type, id, name = "") {
    try {
        let endpoint = "";
        if (type === 'village') endpoint = `${API_BASE_URL}/admin/verify/village/${id}`;
        else if (type === 'innovator') endpoint = `${API_BASE_URL}/admin/verify/innovator/${id}`;
        else if (type === 'innovation') endpoint = `${API_BASE_URL}/admin/verify/innovation/${id}`;
        else throw new Error("Tipe tidak valid");

        await axios.post(endpoint, { status: "Terverifikasi", catatanAdmin: "Diverifikasi otomatis melalui script automation." }, {
            headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
        });
        console.log(`✅ [${type.toUpperCase()}] Berhasil diverifikasi: ${name || id}`);
    } catch (err) {
        // Cek jika error 404 (tidak ditemukan), mungkin karena sudah diverifikasi atau ID salah
        if (err.response && err.response.status === 404) {
            console.log(`⚠️  [${type.toUpperCase()}] Tidak ditemukan (mungkin sudah dihapus/berbeda ID): ${name || id}`);
        } else {
            console.error(`❌ [${type.toUpperCase()}] Gagal memverifikasi ${name || id}:`, err.response?.data || err.message);
        }
    }
}

// Fungsi Helper baca CSV
function readCSV(filePath) {
    return new Promise((resolve) => {
        const results = [];
        if (!fs.existsSync(filePath)) {
            console.log(`File tidak ditemukan: ${filePath}`);
            resolve([]);
            return;
        }
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results));
    });
}

// MAIN RUNNER
async function run() {
    console.log("=== MEMULAI PROSES VERIFIKASI MASSAL ===\n");

    // 1. Verifikasi Desa
    const desaPath = path.join(__dirname, '../data_desa.csv');
    console.log(`\n--- Memproses Data Desa ---`);
    const desaData = await readCSV(desaPath);
    for (const row of desaData) {
        if (row.userId) await verifyItem('village', row.userId, row.namaDesa);
    }

    // 2. Verifikasi Innovator
    const inovatorPath = path.join(__dirname, '../data_inovator.csv');
    console.log(`\n--- Memproses Data Innovator ---`);
    const inovatorData = await readCSV(inovatorPath);
    for (const row of inovatorData) {
        if (row.userId) await verifyItem('innovator', row.userId, row.nama);
    }

    // 3. Verifikasi Inovasi
    const inovasiPath = path.join(__dirname, '../data_inovasi.csv');
    console.log(`\n--- Memproses Data Inovasi ---`);
    const inovasiData = await readCSV(inovasiPath);
    for (const row of inovasiData) {
        if (row.inovasiId) await verifyItem('innovation', row.inovasiId, row.namaInovasi);
    }

    console.log("\n=== SEMUA PROSES VERIFIKASI SELESAI ===");
}

run();
