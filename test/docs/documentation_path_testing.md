# Dokumentasi Pengujian Basis Path - Endpoints

Dokumen ini memetakan jalur uji (Path Testing) untuk setiap endpoint utama (API Next.js & Service Backend) pada sistem Desa Digital v3.

## 1. Modul Autentikasi Login (`login.test.ts`)
Fokus: Logika *client-side* halaman Login (Firebase SDK & Form Validation).
- **Path 1 (Error):** Login gagal - format email salah (Berdasarkan respon error `auth/invalid-email` dari Firebase).
- **Path 2 (Error):** Login gagal - password kurang 6 karakter.
- **Path 3 (Error):** Login gagal - data belum terdaftar di Firebase/Email tidak ada.
- **Path 4 (Error):** Login gagal - form email kosong.
- **Path 5 (Error):** Login gagal - kredensial/password salah (Simulasi Firebase `auth/wrong-password`).
- **Path 6 (Error):** Login gagal - data pengguna tidak ditemukan di database (Firestore).
- **Path 7 (Success):** Login berhasil - role Admin (Redirect ke Admin Page).
- **Path 8 (Success):** Login berhasil - role Ministry (Redirect ke Dasbor Kementrian).
- **Path 9 (Success):** Login berhasil - role Village / Innovator (Redirect ke Landing Page).

## 2. Modul Autentikasi Register (`register.test.ts`)
Fokus: Logika *client-side* halaman Register (Firebase SDK & Validasi Form).
- **Path 1 (Error):** Register tanpa memilih role.
- **Path 2 (Success):** Register sukses dengan Google Sign-In (`signInWithPopup`).
- **Path 3 (Error):** Register gagal - format email salah (tanpa karakter `@`).
- **Path 4 (Error):** Register dengan email dan password kosong.
- **Path 5 (Error):** Register dengan password kurang 6 karakter.
- **Path 6 (Error):** Register dengan password dan konfirmasi tidak cocok.
- **Path 7 (Error):** Register gagal - kolom konfirmasi password dikosongkan.
- **Path 8 (Error):** Register gagal - email sudah digunakan (`auth/email-already-in-use`).
- **Path 9 (Success):** Register user baru berhasil (Email & password).

## 3. Modul Autentikasi Endpoint Me (`auth-me.test.ts`)
Fokus: API Backend `/api/auth/me` untuk validasi Token.
- **Path 1 (Error):** Kondisi jika tidak ada `authHeader` (401 Unauthorized).
- **Path 2 (Error):** Kondisi jika tidak ada `uid` (Token gagal di-decode, 401 Unauthorized).
- **Path 3 (Error):** Kondisi jika tidak ada user di database MongoDB (401 Unauthorized).
- **Path 4 (Success - Edge Case):** Kondisi sinkronisasi *Role* jika *Role* di Firebase berbeda dengan MongoDB.
- **Path 5 (Error Database):** Kondisi Internal Server Error (Database terputus, 500).
- **Path 6 (Success):** Kondisi *Auth me* berhasil menghasilkan data profil yang valid (200 OK).

## 4. Modul Inovasi (`innovations.test.ts`)
Fokus: Endpoint `POST /api/innovations/route.ts`
- **Path 1 (Error 401/403):** Request dikirim tanpa token atau role yang salah.
- **Path 2 (Error 400):** Field wajib kosong (contoh: kategori, namaInovasi).
- **Path 3 (Error 400):** Field array (modelBisnis, manfaat, infrastruktur) kosong.
- **Path 4 (Error 400):** Deskripsi inovasi melebihi batas 80 kata.
- **Path 5 (Error 400):** Nama desa yang menerapkan melebihi batas 20 kata.
- **Path 6 (Error 400):** Salah satu elemen model bisnis melebihi batas 5 kata.
- **Path 7 (Error 403):** Role Inovator valid, tetapi profil di MongoDB belum 'Terverifikasi'.
- **Path 8 (Success 201):** Input valid, profil terverifikasi, inovasi berhasil dibuat dan cache di-invalidate.

## 5. Modul Klaim Desa (`claims.test.ts`)
Fokus: Endpoint `POST /api/villages/claim/route.ts`
- **Path 1 (Error 401/403):** Request tanpa token atau oleh role selain village/admin.
- **Path 2 (Error 400):** Field wajib kosong (desaId, namaInovasi, namaInovator, deskripsiInovasi).
- **Path 3 (Error 400):** Parameter buktiJenis tidak dikirim atau array kosong.
- **Path 4 (Error 400):** Batas kata terlampaui (deskripsiInovasi > 80, namaInovasi > 10, namaInovator > 10).
- **Path 5 (Error 400):** Object buktiFiles tidak dikirim atau tidak valid.
- **Path 6 (Error 400):** Bukti foto ditandai tapi file foto kosong atau tidak valid.
- **Path 7 (Error 400):** Bukti video ditandai tapi file video kosong atau tidak valid.
- **Path 8 (Error 400):** Bukti dokumen ditandai tapi file dokumen kosong atau tidak valid.
- **Path 9 (Error 403):** Desa belum terverifikasi di MongoDB.
- **Path 10 (Error 409):** Konflik klaim ganda (inovasiId sama dan klaim sebelumnya belum ditolak).
- **Path 11 (Success 201):** Input valid, dokumen lengkap, klaim berhasil disubmit dengan status 'Menunggu'.

## 6. Modul Profil Desa (`village-profile.test.ts`)
Fokus: Endpoint `POST /api/villages/route.ts`
- **Path 1 (Error 401/403):** Request tanpa token atau oleh role yang bukan `village`/`admin`.
- **Path 2 (Error 400):** Parameter wajib (seperti namaDesa, deskripsi, lokasi, potensiDesa) tidak lengkap.
- **Path 3 (Error 400):** Jumlah kata melebihi batas (contoh: deskripsi > 100 kata).
- **Path 4 (Error 400):** Data pengguna tidak ditemukan di MongoDB.
- **Path 5 (Error 400):** Peran (role) pengguna di MongoDB bukan `village`.
- **Path 6 (Error 409):** Profil desa untuk *user* ini sudah ada.
- **Path 7 (Success 201):** Input valid, profil desa berhasil dibuat, *cache* dihapus, dan admin mendapatkan notifikasi.

## 7. Modul Profil Inovator (`innovator-profile.test.ts`)
Fokus: Endpoint `POST /api/innovator/route.ts`
- **Path 1 (Error 401/403):** Request tanpa token atau oleh role yang bukan `innovator`/`admin`.
- **Path 2 (Error 400):** Parameter wajib (seperti namaInovator, deskripsi, kategori) tidak lengkap.
- **Path 3 (Error 400):** Jumlah kata melebihi batas (contoh: namaInovator > 10 kata, deskripsi > 80 kata).
- **Path 4 (Error 400):** Data pengguna tidak ditemukan di MongoDB dan gagal melakukan *auto-sync*.
- **Path 5 (Error 400):** Peran (role) pengguna di MongoDB bukan `innovator`.
- **Path 6 (Error 409):** Profil inovator untuk *user* ini sudah ada.
- **Path 7 (Success 201):** Input valid, profil inovator berhasil dibuat, *cache* dihapus, dan admin mendapatkan notifikasi.

## 8. Modul Verifikasi Klaim Admin (`verify-claims.test.ts`)
Fokus: Endpoint `POST /api/admin/verify/claims/[id]/route.ts`
- **Path 1 (Error 401/403):** Request dikirim oleh selain Admin (atau tanpa token).
- **Path 2 (Error 400):** Parameter ID klaim tidak dikirimkan.
- **Path 3 (Error 404):** ID klaim tidak ditemukan di dalam database.
- **Path 4 (Success 200 - Disetujui):** Status diubah menjadi 'Terverifikasi', sinkronisasi ke tabel villages & innovations, serta kirim notifikasi.
- **Path 5 (Success 200 - Ditolak):** Status diubah menjadi 'Ditolak', sinkronisasi tidak berjalan, dan mengirim notifikasi penolakan.

## 9. Modul Rekomendasi AI (`recommendations.test.ts`)
Fokus: Endpoint `POST /api/recommendations/route.ts`
- **Path 1 (Error 400):** Parameter `innovation_id` tidak disertakan di payload request.
- **Path 2 (Success 200 - Cache Hit):** Mengembalikan rekomendasi secara langsung dari *cache* tanpa memanggil external API.
- **Path 3 (Success 200 - API Call):** Memanggil *endpoint* FastAPI eksternal menggunakan Axios, menyimpannya ke *cache*, dan mengembalikan response.
- **Path 4 (Error 500):** Simulasi kegagalan koneksi atau error 500 dari API FastAPI eksternal.
