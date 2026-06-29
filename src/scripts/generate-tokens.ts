import axios from 'axios';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

// Konfigurasi Firebase dari .env.local Anda
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_APIKEY;
const FIREBASE_AUTH_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;

// Lokasi file
const INPUT_CSV = path.join(process.cwd(), 'src', 'scripts', 'full-accounts.csv');
const OUTPUT_CSV = path.join(process.cwd(), 'src', 'scripts', 'authMe.csv');
const OUTPUT_TOKENS_CSV = path.join(process.cwd(), 'src', 'scripts', 'authMe_tokens.csv');

async function getFirebaseToken(email: string, password: string): Promise<string | null> {
    try {
        const response = await axios.post(FIREBASE_AUTH_URL, {
            email,
            password,
            returnSecureToken: true,
        });
        return response.data.idToken;
    } catch (error: any) {
        console.error(`Gagal login untuk ${email}:`, error.response?.data?.error?.message || error.message);
        return null;
    }
}

// Helper untuk menjalankan async task dengan limitasi concurrency
async function runWithConcurrencyLimit<T, R>(
    items: T[], 
    limit: number, 
    fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
    const results: R[] = new Array(items.length);
    let currentIndex = 0;

    async function worker() {
        while (currentIndex < items.length) {
            const index = currentIndex++;
            const item = items[index];
            results[index] = await fn(item, index);
        }
    }

    const workers = [];
    for (let i = 0; i < Math.min(limit, items.length); i++) {
        workers.push(worker());
    }
    await Promise.all(workers);
    return results;
}

async function main() {
    if (!API_KEY) {
        console.error("Firebase API Key (NEXT_PUBLIC_FIREBASE_APIKEY) tidak ditemukan di environment!");
        return;
    }

    if (!fs.existsSync(INPUT_CSV)) {
        console.error("File accounts.csv tidak ditemukan!");
        return;
    }

    const content = fs.readFileSync(INPUT_CSV, 'utf-8');
    const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const header = lines[0];
    const accounts = lines.slice(1);

    console.log(`Memproses ${accounts.length} akun dengan concurrency limit...`);

    let successCount = 0;
    let failCount = 0;

    interface AccountResult {
        email: string;
        password?: string;
        role?: string;
        token: string | null;
    }

    // Ambil token secara paralel dengan concurrency limit 15 agar cepat namun aman dari rate limit
    const results = await runWithConcurrencyLimit<string, AccountResult>(
        accounts,
        15, // Concurrency limit
        async (line, index) => {
            const [email, password, role] = line.split(',');
            const token = await getFirebaseToken(email, password);
            if (token) {
                successCount++;
                console.log(`[${index + 1}/${accounts.length}] ✅ Berhasil mendapatkan token untuk ${email}`);
            } else {
                failCount++;
                console.log(`[${index + 1}/${accounts.length}] ❌ Gagal mendapatkan token untuk ${email}`);
            }
            return { email, password, role, token };
        }
    );

    // Filter hanya akun yang sukses login
    const successfulResults = results.filter((r): r is AccountResult & { token: string } => r.token !== null);

    // 1. Tulis ke file authMe.csv (full data: email, password, role, token)
    const fullRows = [
        "email,password,role,token",
        ...successfulResults.map(r => `${r.email},${r.password},${r.role},${r.token}`)
    ];
    fs.writeFileSync(OUTPUT_CSV, fullRows.join('\n'));

    // 2. Tulis ke file authMe_tokens.csv (hanya token - sangat cocok untuk input load test tool seperti k6/autocannon)
    const tokenRows = [
        "token",
        ...successfulResults.map(r => r.token)
    ];
    fs.writeFileSync(OUTPUT_TOKENS_CSV, tokenRows.join('\n'));

    console.log(`\nSelesai!`);
    console.log(`- Berhasil: ${successCount}`);
    console.log(`- Gagal: ${failCount}`);
    console.log(`- File data lengkap disimpan di: ${OUTPUT_CSV}`);
    console.log(`- File hanya token disimpan di: ${OUTPUT_TOKENS_CSV}`);
}

main();

// Run with: npx tsx --env-file=.env.local src/scripts/generate-tokens.ts