<div align="center">
  <h1>🌟 Desa Digital v3</h1>
  <p><strong>Platform Inovasi Desa Digital Berbasis Web Terintegrasi AI</strong></p>
</div>

---

## 📖 Tentang Proyek

**Desa Digital v3** adalah iterasi ketiga dari platform Desa Digital. Proyek ini merupakan pembaruan arsitektur besar-besaran (*re-engineering*) yang bermigrasi dari ekosistem Vite/React menuju **Next.js 15 (App Router)**. Platform ini dirancang untuk mendata, memvalidasi, dan menampilkan inovasi-inovasi yang ada di desa, memfasilitasi setiap desa untuk mengklaim atau mengajukan inovasi baru secara mandiri, lengkap dengan antarmuka yang modern, dukungan AI *Chatbot*, dan infrastruktur *backend* yang tangguh dan skalabel.

---

## ✨ Fitur Utama

- 🚀 **Katalog Inovasi**: Jelajahi daftar inovasi dari berbagai desa dengan fitur pencarian yang akurat.
- 📝 **Sistem Klaim Inovasi**: 
  - **Klaim Katalog**: Desa dapat mengklaim inovasi yang sudah diregistrasi.
  - **Klaim Manual**: Mendukung pengajuan inovasi baru yang belum terdata di dalam sistem.
- 📄 **Pratinjau Dokumen Terintegrasi**: Lihat bukti dokumen (PDF/Gambar) secara langsung (*In-App Preview*) tanpa harus membuka tab baru, menjaga kerahasiaan tautan (*link privacy*).
- 📊 **Dashboard Manajemen (*Role-Based*)**: Ruang kerja terpisah yang disesuaikan antara **Admin** (verifikasi & pemantauan) dan **Desa** (pengelolaan profil & inovasi).
- 🤖 **Chatbot AI Terpadu**: Asisten virtual cerdas berbasis RAG (*Retrieval-Augmented Generation*) untuk memudahkan navigasi, tanya jawab, serta pencarian informasi.
- 🎨 **Antarmuka Premium & Responsif**: Dibangun menggunakan estetika UI modern (*mobile-first*) yang memastikan kemudahan dan kenyamanan pengguna di semua ukuran layar.

---

## 🛠️ Teknologi & Infrastruktur

Ekosistem teknologi yang digunakan untuk menunjang skalabilitas aplikasi:

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router & Turbopack), TypeScript.
- **Styling**: [Chakra UI](https://chakra-ui.com/) & Emotion (CSS-in-JS).
- **Database Utama**: [MongoDB](https://www.mongodb.com/) (Data relasional & operasional).
- **BaaS (Backend-as-a-Service)**: [Firebase](https://firebase.google.com/) (Authentication & Cloud Storage).
- **Email Service**: [Resend](https://resend.com/) (Pengiriman email transaksional).
- **AI & LLM Integration**: Google Generative AI, OpenAI-compatible APIs, dan [Ollama](https://ollama.com/) (Local Embeddings).

---

## 🚀 Panduan Instalasi & Pengembangan

Berikut adalah cara menjalankan aplikasi ini di environment lokal Anda.

### 1. Prasyarat Sistem
- **Node.js** (v18 atau terbaru)
- **MongoDB** (Pastikan service berjalan di port `27017`)
- **Docker Desktop** (Dibutuhkan jika ingin menjalankan *local embedding server*)

### 2. Kloning Repositori
```bash
git clone https://github.com/ahqsa24/desa-digital.v3.git
cd desa-digital.v3
```

### 3. Instalasi Dependensi
```bash
npm install
```

### 4. Konfigurasi Environment Variables
Salin contoh konfigurasi ke dalam `.env.local` dan sesuaikan kodenya. Konfigurasi wajib meliputi URL koneksi MongoDB dan Kunci API Firebase.
```bash
cp .env.example .env.local
```
*(Panduan tiap field variabel tersedia di dalam file `.env.example`)*

### 5. Menjalankan AI Embedding Server (Ollama)
Ollama digunakan untuk mengenerate *embeddings* (Vektor RAG).
- **Menjalankan via Docker:**
  ```bash
  docker compose up -d
  ```
  *(Ollama akan berjalan di `http://localhost:11434`. Model AI akan diunduh secara otomatis)*
- **Mengekspos Akses (Opsional via Ngrok):**
  Digunakan bila Frontend Anda berada di Cloud tapi ingin mengakses Ollama di mesin lokal.
  ```bash
  docker compose --profile ngrok up -d
  ```
  *(Pastikan token ngrok sudah diset di `.env.local`. URL akses ngrok dapat dilihat di `http://localhost:4040`)*

### 6. Menjalankan Development Server
Pastikan MongoDB berjalan, lalu jalankan perintah:
```bash
npm run dev
```
Buka **[http://localhost:3000](http://localhost:3000)** di peramban (browser) untuk mengakses aplikasi.

---

## 📂 Struktur Direktori

Penempatan kode mengikuti arsitektur Next.js terbaru dengan pemisahan *concern* yang jelas:

```text
desa-digital.v3/
├── .github/workflows/    # Konfigurasi CI/CD pipelines
├── src/
│   ├── app/              # Routing utama (Pages, Layouts, API Routes)
│   ├── components/       # Komponen visual UI yang dapat digunakan kembali
│   ├── contexts/         # Provider & React Context untuk State global
│   ├── lib/              # Koneksi DB, Firebase Admin, & tools utilitas
│   ├── services/         # Layer pemanggilan API eksternal/internal
│   └── scripts/          # Skrip CLI utilitas (contoh: Database Seeder / Ingestion)
├── public/               # Asset statis web (Ikon, Favicon, dll)
└── docker-compose.yml    # Orkestrasi container server lokal (Ollama)
```

---

## ⚠️ Catatan Penting
- **CORS Firebase Storage**: Fitur pratinjau PDF/Gambar membutuhkan pengaturan spesifik terkait *CORS* pada bucket Firebase Anda. Pastikan nama domain (*localhost* / URL Production) Anda terdaftar agar browser diizinkan melakukan pembacaan dokumen.
- **Ketersediaan Ngrok**: Link yang dihasilkan akun ngrok gratis bersifat dinamis. Anda harus selalu memperbarui `OLLAMA_BASE_URL` jika container di-restart.

---

<div align="center">
  <small>&copy; 2026 Desa Digital Project</small>
</div>
