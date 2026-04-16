// src/types/index.ts

export type AuthRole = 'admin' | 'kementerian' | 'innovator' | 'village' | 'guest';

export interface User {
  id: string;
  _id?: string;
  email: string;
  name?: string;
  role: AuthRole;
  firebaseUid?: string;
  createdAt?: string | Date;
}

export interface Innovation {
  id: string;
  _id?: string;
  namaInovasi: string;
  label?: string; // Often used as alternative title
  deskripsi: string;
  kategori: string;
  status: 'Terverifikasi' | 'Menunggu' | 'Ditolak';
  inovator_nama?: string | string[];
  inovatorId?: string;
  userId?: string;
  perspektif?: string;
  keunggulan_inovasi?: string | string[];
  potensi_aplikasi?: string;
  inovator_status_paten?: string;
  logo?: string;
  header?: string;
  verifiedAt?: string | Date;
  createdAt: string | Date;
  editedAt?: string | Date;
}

export interface Village {
  id: string;
  _id?: string;
  namaDesa: string;
  userId: string;
  kepalaDesa?: string;
  deskripsi?: string;
  logo?: string;
  headerImage?: string;
  status?: 'Terverifikasi' | 'Menunggu' | 'Ditolak';
  verifiedAt?: string | Date;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface InnovationClaim {
  id: string;
  _id?: string;
  desaId: string;
  innovationId: string;
  namaDesa: string;
  namaInovasi: string;
  status: 'Terverifikasi' | 'Menunggu' | 'Ditolak';
  catatanAdmin?: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
}
