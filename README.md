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
    Buat file `.env.local` di direktori root dan masukkan konfigurasi berikut:

    ```bash
    # FIREBASE CLIENT
    NEXT_PUBLIC_FIREBASE_APIKEY=
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
    NEXT_PUBLIC_FIREBASE_MESSAGE_SENDER_ID=
    NEXT_PUBLIC_FIREBASE_APP_ID=

    # API & URL
    NEXT_PUBLIC_API_URL=http://localhost:3000
    FRONTEND_URL=http://localhost:3000

    # DATABASE (MONGODB)
    MONGODB_URL=mongodb://localhost:27017
    MONGODB_DB=db_desa

    # AI & CHATBOT
    GOOGLE_GENERATIVE_AI_API_KEY=
    OLLAMA_BASE_URL=http://localhost:11434
    OLLAMA_EMBED_MODEL=embeddinggemma:latest

    # AUTHENTICATION
    JWT_SECRET=gunakan_kunci_rahasia_anda

    # EMAIL SERVICE (RESEND)
    RESEND_API_KEY=
    MAIL_FROM=Desa Digital <onboarding@resend.dev>

    # FIREBASE ADMIN (Untuk Fitur Auth Server-side)
    FIREBASE_ADMIN_PROJECT_ID=
    FIREBASE_ADMIN_CLIENT_EMAIL=
    FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
    ```

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
