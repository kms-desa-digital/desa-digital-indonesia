# Desa Digital v3

Proyek ini adalah iterasi ketiga dari aplikasi **Desa Digital**, yang dimigrasi dari Vite/React ke **Next.js**. Proyek ini merupakan pembaruan besar-besaran yang mencakup perubahan arsitektur, peningkatan UI/UX, dan migrasi basis data ke MongoDB.

## Fitur Utama

- **Katalog Inovasi**: Menampilkan daftar inovasi desa dengan kategori yang beragam.
- **Sistem Klaim Inovasi**: 
  - **Klaim Katalog**: Desa dapat mengklaim inovasi yang sudah ada di sistem.
  - **Klaim Manual**: Mendukung pengajuan inovasi baru yang belum terdaftar.
- **Pratinjau Dokumen In-App**: Melihat bukti dokumen (PDF/Gambar) langsung di dalam aplikasi tanpa membuka tab baru (menjaga privasi link).
- **Dashboard Desa & Admin**: Manajemen pengajuan klaim dan verifikasi status.
- **Redesign UI Modern**: Antarmuka mobile-first yang responsif, menggunakan estetika premium dengan integrasi Gambar dan Card.
- **Chatbot AI**: Asisten cerdas untuk membantu pengguna dalam navigasi dan informasi inovasi.

## Teknologi

- **Framework**: Next.js 15 (App Router) dengan Turbopack.
- **Bahasa**: TypeScript.
- **UI Framework**: Chakra UI & Emotion (CSS-in-JS).
- **Database**: MongoDB (untuk data relasional & master).
- **BaaS**: Firebase (Authentication, Storage untuk file bukti).
- **Email Service**: Resend (untuk pengiriman link reset password).
- **AI**: Google Generative AI & Ollama.

## Instalasi

Ikuti langkah-langkah berikut untuk menjalankan proyek secara lokal:

1. **Clone repository:**
    ```bash
    git clone https://github.com/ahqsa24/desa-digital.v3.git
    cd desa-digital.v3
    ```

2. **Instal dependensi:**
    ```bash
    npm install
    ```

3. **Konfigurasi Environment Variables:**
    Salin `.env.example` menjadi `.env.local`, lalu isi nilai yang sesuai:

    ```bash
    cp .env.example .env.local
    ```

    Berikut penjelasan tiap variabel:

    ```bash
    # FIREBASE CLIENT
    NEXT_PUBLIC_FIREBASE_APIKEY=            
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=       
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=        
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=    
    NEXT_PUBLIC_FIREBASE_MESSAGE_SENDER_ID= 
    NEXT_PUBLIC_FIREBASE_APP_ID=            
    
    # API & URL
    NEXT_PUBLIC_API_URL=http://localhost:3000/
    FRONTEND_URL=http://localhost:3000

    # DATABASE (MongoDB) 
    MONGODB_URL=mongodb://localhost:27017
    MONGODB_DB_NAME=db_desa

    # OLLAMA (Embedding Server) 
    # Lokal (Docker):       http://localhost:11434
    # Via ngrok (publik):   https://xxxx-xxxx.ngrok-free.app
    # Next.js dlm Docker:   http://ollama:11434
    OLLAMA_BASE_URL=http://localhost:11434
    OLLAMA_EMBED_MODEL=model_embedding_name

    # NGROK (opsional) 
    # Hanya diperlukan saat menjalankan: docker compose --profile ngrok up -d
    # Ambil authtoken di: https://dashboard.ngrok.com/get-started/your-authtoken
    NGROK_AUTHTOKEN=your_ngrok_token

    # CHATBOT LLM
    GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_llm
    CHATANYWHERE_API_KEY=your_chatanywhere_api_key  # OpenAI-compatible (opsional)
    CHATANYWHERE_URL=https://api.chatanywhere.tech/v1

    # GUARD LLM
    # Model ringan untuk validasi query sebelum masuk ke RAG + LLM utama.
    # GUARD_LLM_PROVIDER: "auto" | "gemini" | "openai"
    #   auto   → prioritas chatanywhere, fallback ke gemini
    #   gemini → pakai GOOGLE_GENERATIVE_AI_API_KEY
    #   openai → pakai CHATANYWHERE_API_KEY + CHATANYWHERE_URL
    # GUARD_LLM_MODEL: kosongkan untuk pakai default per provider
    #   gemini default: gemini-2.0-flash-lite | openai default: gpt-4o-mini
    GUARD_LLM_PROVIDER=auto
    GUARD_LLM_MODEL=
    GUARD_LLM_TIMEOUT_MS=5000

    # AUTENTIKASI 
    JWT_SECRET=gunakan_kunci_rahasia_anda

    # EMAIL SERVICE (Resend) opsional 
    # RESEND_API_KEY=re_xxxxxxxxxxxx
    # MAIL_FROM=Desa Digital <onboarding@resend.dev>

    # FIREBASE ADMIN (server-side) 
    FIREBASE_ADMIN_PROJECT_ID=
    FIREBASE_ADMIN_CLIENT_EMAIL=            
    FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATEKEY-----\n"
    ```

## Menjalankan Ollama (Embedding Server) via Docker

Proyek ini menggunakan Ollama sebagai server embedding lokal. Cara termudah menjalankannya adalah via Docker.

### Prasyarat
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) sudah terinstal dan berjalan.

---

### Mode 1: Lokal saja (default)

Gunakan ini saat Next.js dan Ollama sama-sama berjalan di mesin yang sama.

1. **Jalankan container Ollama:**
    ```bash
    docker compose up -d
    ```
    Perintah ini akan:
    - Menjalankan Ollama di `http://localhost:11434`
    - Otomatis menarik (pull) model embedding saat pertama kali dijalankan
    - Menyimpan model di Docker volume `desa-digital-ollama-data` agar tidak perlu download ulang

2. **Pastikan `.env.local` menggunakan URL lokal:**
    ```env
    OLLAMA_BASE_URL=http://localhost:11434
    ```

3. **Cek status & log:**
    ```bash
    docker compose ps
    docker compose logs -f ollama
    ```

4. **Hentikan container:**
    ```bash
    docker compose down
    ```

---

### Mode 2: Akses publik via ngrok

Gunakan ini saat aplikasi di-deploy ke Vercel/cloud dan perlu memanggil embedding server yang berjalan di mesin lokal.

#### Prasyarat tambahan
- Daftar akun di [ngrok.com](https://ngrok.com) (gratis)
- Ambil authtoken di [dashboard.ngrok.com](https://dashboard.ngrok.com/get-started/your-authtoken)
- Tambahkan ke `.env.local`:
    ```env
    NGROK_AUTHTOKEN=your_ngrok_authtoken
    ```

#### Langkah-langkah

1. **Jalankan Ollama + ngrok sekaligus:**
    ```bash
    docker compose --profile ngrok up -d
    ```

2. **Ambil URL publik ngrok:**

    Buka browser ke `http://localhost:4040` → tab **Status** → salin URL yang tertera (format: `https://xxxx-xxxx.ngrok-free.app`).

    Atau via terminal:
    ```bash
    curl http://localhost:4040/api/tunnels
    ```

3. **Update `OLLAMA_BASE_URL` di `.env.local`:**
    ```env
    OLLAMA_BASE_URL=https://xxxx-xxxx.ngrok-free.app
    ```
    Lalu restart Next.js dev server agar env terbaca ulang.

4. **Hentikan semua service:**
    ```bash
    docker compose --profile ngrok down
    ```

> **Catatan:** URL ngrok pada akun gratis berubah setiap kali container di-restart. Perbarui `OLLAMA_BASE_URL` setiap kali URL berubah. Untuk URL statis, upgrade ke ngrok Pro atau gunakan custom domain.

> **Header ngrok:** Kode embedding sudah menyertakan header `ngrok-skip-browser-warning` dan `Bypass-Tunnel-Reminder` secara otomatis, tidak perlu konfigurasi tambahan.

---

### Pull Model Manual (jika diperlukan)

```bash
docker exec -it desa-digital-ollama ollama pull "model_embed_name"
```

### GPU NVIDIA (opsional)

Buka `docker-compose.yml` dan hapus komentar pada bagian `deploy.resources.reservations`.

---

## Menjalankan Aplikasi

Jalankan perintah berikut untuk memulai server pengembangan:

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

## Arsitektur Folder

- `/src/app`: Rute aplikasi (App Router), halaman, dan API routes.
- `/src/components`: Komponen UI yang dapat digunakan kembali (Shared Components).
- `/src/services`: Logika pemanggilan API dan integrasi backend.
- `/src/lib`: Konfigurasi library (MongoDB client, Firebase Admin, dll).
- `/src/contexts`: State management menggunakan React Context.
- `/public`: Aset statis (gambar, ikon).

## Catatan Penting
- Pastikan MongoDB berjalan di port default (`27017`) sebelum menjalankan aplikasi.
- Untuk fitur pratinjau dokumen, pastikan aturan CORS di Firebase Storage sudah diatur agar mengizinkan akses dari domain aplikasi Anda.
