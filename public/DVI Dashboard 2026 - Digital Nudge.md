# Task Board: Digital Nudge & Refactor Frontend

## Overview
- **Title:** Task Board — Digital Nudge & Refactor Frontend
- **Reengineering Documentation:** [Google Drive](https://drive.google.com/drive/folders/1Jp8Tb9SJB2pWSlWXdbZhpieCKbVrfSLd)
- **Figma Design:** [Prototype - MVP](https://www.figma.com/design/21RcVPBI1luMuiI4UoMV7Z/Prototype--MVP---Copy-?node-id=30-1789&p=f&t=aDDGXJRzgUgRM32i-0)

---

## Tasks Table

| Task ID | Sprint | Judul Task | Deskripsi | Assignee | Tag | Prioritas | Status | Estimasi |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TASK-01** | Sprint 0 — Foundation | Review Figma & inventaris screen badge | Pelajari semua screen di Figma. Catat semua halaman yang menampilkan badge (profil desa, profil inovator, dashboard admin). Buat list komponen yang perlu dibuat. | Muthia | Figma | High | Done | 4 Jam |
| **TASK-02** | Sprint 0 — Foundation | Koordinasi API — cek endpoint & field kategori | Pastikan API sudah/akan punya endpoint untuk: badge per desa, badge per inovator, dan field kategori di inovasi (penting untuk Adopter Giat & Adopter Spesialis). | Wildan | API | High | Done | 8 Jam |
| **TASK-03** | Sprint 0 — Foundation | Setup folder struktur fitur digital-nudge | Buat skeleton folder: `features/digital-nudge/components/`, `hooks/`, `services.ts`, `types.ts`. Definisikan TypeScript types untuk `Badge`, `BadgeType`, `Desa`, dan `Inovator`. | Daffa | FE · Setup | Mid | Done | 3 Jam |
| **TASK-04** | Sprint 1 — Profil Badge | Buat komponen BadgeCard reusable | Komponen menerima props: nama badge, ikon, status (diperoleh/belum), deskripsi kriteria. Dipakai di profil desa maupun inovator. Sesuaikan dengan desain Figma. | Daffa | FE · Component | High | Done | 8 Jam |
| **TASK-05** | Sprint 1 — Profil Badge | Integrasi badge di halaman profil Desa | Fetch data badge desa dari API. Tampilkan 5 badge desa (Penggerak Inovasi, Penggiat Digital, Adopter Giat, Adopter Spesialis, Sahabat Inovator) dengan status masing-masing. Handle loading & empty state. | Benadeo | FE · Desa | High | Done | 8 Jam |
| **TASK-06** | Sprint 1 — Profil Badge | Integrasi badge di halaman profil Inovator | Fetch data badge inovator dari API. Tampilkan 5 badge inovator (Terus Berkembang, Si Inovatif, Kolaboratif Handal, Sahabat Desa, Pemimpin Pasar). Reuse BadgeCard dari TASK-04. | Jelita | FE · Inovator | High | Done | 8 Jam |
| **TASK-07** | Sprint 1 — Profil Badge | Buat hook useBadge | Custom hook di `features/digital-nudge/hooks/` yang handle fetch badge, caching, dan error handling. Dipakai oleh semua halaman yang butuh data badge. | Daffa | FE · Hook | Mid | Done | 8 Jam |
| **TASK-08** | Sprint 2 — Dashboard Admin | Halaman daftar badge & kriteria (admin) | Admin dapat melihat semua 10 badge beserta kriteria masing-masing dan jumlah desa/inovator yang sudah mendapatkannya. | Benadeo | FE · Admin | High | To Do | 8 Jam |
| **TASK-09** | Sprint 2 — Dashboard Admin | Halaman monitoring badge per desa/inovator | Admin dapat search desa atau inovator tertentu dan melihat badge apa saja yang sudah diraih beserta progress menuju badge berikutnya. | Wildan | FE · Admin | High | To Do | 8 Jam |
| **TASK-10** | Sprint 2 — Dashboard Admin | Integrasi services.ts digital-nudge | Buat semua fungsi fetch di `features/digital-nudge/services.ts`: `getBadgeByDesa()`, `getBadgeByInovator()`, `getAllBadgeSummary()`. Gunakan axios/fetcher dari `lib/`. | Daffa | FE · Service | High | To Do | 8 Jam |
| **TASK-11** | Sprint 3 — QA & Finalisasi | Testing semua kondisi badge | Test tiap badge: mock data yang memenuhi & belum memenuhi kriteria. Perhatian khusus pada Adopter Giat vs Adopter Spesialis (query by kategori). Pastikan multi-badge bisa tampil bersamaan. | Jelita | QA | High | To Do | 8 Jam |
| **TASK-12** | Sprint 3 — QA & Finalisasi | Refactor frontend — sesuaikan struktur folder | Pastikan semua komponen & fitur lama sudah align dengan struktur target (`components/ui`, `features/`, `hooks/`, `store/`). Bersihkan duplikasi. | Benadeo | Refactor | Mid | To Do | 4 Jam |
| **TASK-13** | Sprint 3 — QA & Finalisasi | Dokumentasi fitur & PR final | Tulis README singkat untuk fitur digital-nudge: cara kerja badge, struktur folder, cara pakai komponen & hook. Merge semua branch ke main. | Muthia | Docs | Low | To Do | 2 Jam |

---

## Task Details by Sprint

### Sprint 0 — Foundation
- **TASK-01:** Review Figma & inventaris screen badge
  - **Assignee:** Muthia
  - **Priority:** High
  - **Status:** Done
  - **Estimate:** 4 Hours
  - **Description:** Pelajari semua screen di Figma. Catat semua halaman yang menampilkan badge (profil desa, profil inovator, dashboard admin). Buat list komponen yang perlu dibuat.
- **TASK-02:** Koordinasi API — cek endpoint & field kategori
  - **Assignee:** Wildan
  - **Priority:** High
  - **Status:** Done
  - **Estimate:** 8 Hours
  - **Description:** Pastikan API sudah/akan punya endpoint untuk: badge per desa, badge per inovator, dan field kategori di inovasi (penting untuk Adopter Giat & Adopter Spesialis).
- **TASK-03:** Setup folder struktur fitur digital-nudge
  - **Assignee:** Daffa
  - **Priority:** Mid
  - **Status:** Done
  - **Estimate:** 3 Hours
  - **Description:** Buat skeleton folder: `features/digital-nudge/components/`, `hooks/`, `services.ts`, `types.ts`. Definisikan TypeScript types untuk `Badge`, `BadgeType`, `Desa`, dan `Inovator`.

### Sprint 1 — Profil Badge
- **TASK-04:** Buat komponen BadgeCard reusable
  - **Assignee:** Daffa
  - **Priority:** High
  - **Status:** Done
  - **Estimate:** 8 Hours
  - **Description:** Komponen menerima props: nama badge, ikon, status (diperoleh/belum), deskripsi kriteria. Dipakai di profil desa maupun inovator. Sesuaikan dengan desain Figma.
- **TASK-05:** Integrasi badge di halaman profil Desa
  - **Assignee:** Benadeo
  - **Priority:** High
  - **Status:** Done
  - **Estimate:** 8 Hours
  - **Description:** Fetch data badge desa dari API. Tampilkan 5 badge desa (Penggerak Inovasi, Penggiat Digital, Adopter Giat, Adopter Spesialis, Sahabat Inovator) dengan status masing-masing. Handle loading & empty state.
- **TASK-06:** Integrasi badge di halaman profil Inovator
  - **Assignee:** Jelita
  - **Priority:** High
  - **Status:** Done
  - **Estimate:** 8 Hours
  - **Description:** Fetch data badge inovator dari API. Tampilkan 5 badge inovator (Terus Berkembang, Si Inovatif, Kolaboratif Handal, Sahabat Desa, Pemimpin Pasar). Reuse BadgeCard dari TASK-04.
- **TASK-07:** Buat hook useBadge
  - **Assignee:** Daffa
  - **Priority:** Mid
  - **Status:** Done
  - **Estimate:** 8 Hours
  - **Description:** Custom hook di `features/digital-nudge/hooks/` yang handle fetch badge, caching, dan error handling. Dipakai oleh semua halaman yang butuh data badge.

### Sprint 2 — Dashboard Admin
- **TASK-08:** Halaman daftar badge & kriteria (admin)
  - **Assignee:** Benadeo
  - **Priority:** High
  - **Status:** To Do
  - **Estimate:** 8 Hours
  - **Description:** Admin dapat melihat semua 10 badge beserta kriteria masing-masing dan jumlah desa/inovator yang sudah mendapatkannya.
- **TASK-09:** Halaman monitoring badge per desa/inovator
  - **Assignee:** Wildan
  - **Priority:** High
  - **Status:** To Do
  - **Estimate:** 8 Hours
  - **Description:** Admin dapat search desa atau inovator tertentu dan melihat badge apa saja yang sudah diraih beserta progress menuju badge berikutnya.
- **TASK-10:** Integrasi services.ts digital-nudge
  - **Assignee:** Daffa
  - **Priority:** High
  - **Status:** To Do
  - **Estimate:** 8 Hours
  - **Description:** Buat semua fungsi fetch di `features/digital-nudge/services.ts`: `getBadgeByDesa()`, `getBadgeByInovator()`, `getAllBadgeSummary()`. Gunakan axios/fetcher dari `lib/`.

### Sprint 3 — QA & Finalisasi
- **TASK-11:** Testing semua kondisi badge
  - **Assignee:** Jelita
  - **Priority:** High
  - **Status:** To Do
  - **Estimate:** 8 Hours
  - **Description:** Test tiap badge: mock data yang memenuhi & belum memenuhi kriteria. Perhatian khusus pada Adopter Giat vs Adopter Spesialis (query by kategori). Pastikan multi-badge bisa tampil bersamaan.
- **TASK-12:** Refactor frontend — sesuaikan struktur folder
  - **Assignee:** Benadeo
  - **Priority:** Mid
  - **Status:** To Do
  - **Estimate:** 4 Hours
  - **Description:** Pastikan semua komponen & fitur lama sudah align dengan struktur target (`components/ui`, `features/`, `hooks/`, `store/`). Bersihkan duplikasi.
- **TASK-13:** Dokumentasi fitur & PR final
  - **Assignee:** Muthia
  - **Priority:** Low
  - **Status:** To Do
  - **Estimate:** 2 Hours
  - **Description:** Tulis README singkat untuk fitur digital-nudge: cara kerja badge, struktur folder, cara pakai komponen & hook. Merge semua branch ke main.
