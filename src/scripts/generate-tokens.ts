import axios from 'axios';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

// Konfigurasi Firebase dari .env.local Anda
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_APIKEY;
const FIREBASE_AUTH_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;

// Lokasi file
const INPUT_CSV = path.join(process.cwd(), 'src', 'scripts', 'accounts_admin.csv');
const OUTPUT_CSV = path.join(process.cwd(), 'src', 'scripts', 'accounts_with_tokens.csv');

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

async function main() {
    if (!fs.existsSync(INPUT_CSV)) {
        console.error("File accounts.csv tidak ditemukan!");
        return;
    }

    const content = fs.readFileSync(INPUT_CSV, 'utf-8');
    const lines = content.split('\n');
    const header = lines[0].trim();

    console.log(`Memproses ${lines.length - 1} akun...`);

    const results = [header + ",token"];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const [email, password, role] = line.split(',');

        process.stdout.write(`Mendapatkan token untuk ${email}... `);
        const token = await getFirebaseToken(email, password);

        if (token) {
            results.push(`${email},${password},${role},${token}`);
            console.log("✅ Berhasil");
        } else {
            results.push(`${email},${password},${role},ERROR`);
            console.log("❌ Gagal");
        }
    }

    fs.writeFileSync(OUTPUT_CSV, results.join('\n'));
    console.log(`\nSelesai! File disimpan di: ${OUTPUT_CSV}`);
}

main();

// npx tsx src/scripts/generate-tokens.ts
// npx tsx --env-file=.env.local src/scripts/generate-tokens.ts