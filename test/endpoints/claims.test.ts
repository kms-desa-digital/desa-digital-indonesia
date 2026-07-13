import { POST } from '@/app/api/villages/claim/route';
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { requireRole } from '@/lib/auth/apiAuth';
import { createNotification, notifyAllAdmins } from '@/services/notificationServices';
import { invalidateCachePattern, invalidateCacheKeys } from '@/lib/utils/cache';

jest.mock('@/lib/db/mongodb', () => ({
  connectToDatabase: jest.fn(),
}));

jest.mock('@/lib/auth/apiAuth', () => ({
  requireRole: jest.fn(),
}));

jest.mock('@/services/notificationServices', () => ({
  createNotification: jest.fn(),
  notifyAllAdmins: jest.fn(),
}));

jest.mock('@/lib/utils/cache', () => ({
  getCachedData: jest.fn(),
  setCachedData: jest.fn(),
  invalidateCachePattern: jest.fn(),
  invalidateCacheKeys: jest.fn(),
}));

describe('Modul Klaim Desa (POST /api/villages/claim)', () => {
  let mockDb: any;
  let mockCollections: Record<string, any>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCollections = {
      villages: {
        findOne: jest.fn(),
      },
      claimInnovations: {
        findOne: jest.fn(),
        insertOne: jest.fn().mockResolvedValue({ insertedId: 'new-claim-id' }),
      },
    };

    mockDb = {
      collection: jest.fn((name: string) => {
        if (!mockCollections[name]) {
          throw new Error(`Unexpected collection accessed in test: ${name}`);
        }
        return mockCollections[name];
      }),
    };

    (connectToDatabase as jest.Mock).mockResolvedValue(mockDb);
  });

  const createRequest = (body: any) => {
    return new NextRequest('http://localhost/api/villages/claim', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  };

  test('Path 1 (Error): Request ditolak karena Auth Header salah / tidak ada token', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce(
      NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    );

    const req = createRequest({});
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.message).toMatch(/Unauthorized/i);
  });

  test('Path 2 (Error): Salah satu field wajib (desaId) kosong', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'village123', role: 'village' });

    const req = createRequest({
      // desaId: hilang
      namaInovasi: 'Inovasi A',
      namaInovator: 'Pak Tani',
      deskripsiInovasi: 'Deskripsi Inovasi A',
      buktiJenis: ['foto'],
      buktiFiles: { foto: ['url-foto'] },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.message).toMatch(/Field wajib tidak lengkap/i);
    expect(json.message).toMatch(/desaId/);
  });

  test('Path 3 (Error): BuktiJenis kosong', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'village123', role: 'village' });

    const req = createRequest({
      desaId: 'desa123',
      namaInovasi: 'Inovasi A',
      namaInovator: 'Pak Tani',
      deskripsiInovasi: 'Deskripsi Inovasi A',
      buktiJenis: [], // Kosong
      buktiFiles: { foto: ['url-foto'] },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.message).toMatch(/Field wajib tidak lengkap/i);
    expect(json.message).toMatch(/buktiJenis/);
  });

  test('Path 4 (Error): Batas kata namaInovasi terlampaui', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'village123', role: 'village' });

    const overLimitName = new Array(11).fill('nama').join(' ');

    const req = createRequest({
      desaId: 'desa123',
      namaInovasi: overLimitName,
      namaInovator: 'Pak Tani',
      deskripsiInovasi: 'Deskripsi Inovasi A',
      buktiJenis: ['foto'],
      buktiFiles: { foto: ['url-foto'] },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.message).toMatch(/Maksimal 10 kata untuk nama inovasi/i);
  });

  test('Path 5 (Error): Object BuktiFiles tidak valid', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'village123', role: 'village' });

    const req = createRequest({
      desaId: 'desa123',
      namaInovasi: 'Inovasi A',
      namaInovator: 'Pak Tani',
      deskripsiInovasi: 'Deskripsi Inovasi A',
      buktiJenis: ['foto'],
      buktiFiles: null, // Invalid
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.message).toMatch(/Bukti file wajib diisi/i);
  });

  test('Path 6 (Error): Bukti foto ditandai tapi file foto kosong', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'village123', role: 'village' });

    const req = createRequest({
      desaId: 'desa123',
      namaInovasi: 'Inovasi A',
      namaInovator: 'Pak Tani',
      deskripsiInovasi: 'Deskripsi Inovasi A',
      buktiJenis: ['foto'],
      buktiFiles: { foto: [] }, // Kosong
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.message).toMatch(/Bukti foto harus menyertakan file foto yang valid/i);
  });

  test('Path 7 (Error): Bukti video ditandai tapi salah satu file video kosong', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'village123', role: 'village' });

    mockCollections.villages.findOne.mockResolvedValueOnce({ status: 'Terverifikasi' });
    mockCollections.claimInnovations.findOne.mockResolvedValueOnce(null);

    const req = createRequest({
      desaId: 'desa123',
      namaInovasi: 'Inovasi A',
      namaInovator: 'Pak Tani',
      deskripsiInovasi: 'Deskripsi Inovasi A',
      buktiJenis: ['video'],
      buktiFiles: { video: ['url-video-valid.mp4', ''] },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.message).toMatch(/Bukti video harus menyertakan file video yang valid/i);
  });

  test('Path 8 (Error): Bukti dokumen ditandai tapi file dokumen kosong', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'village123', role: 'village' });

    const req = createRequest({
      desaId: 'desa123',
      namaInovasi: 'Inovasi A',
      namaInovator: 'Pak Tani',
      deskripsiInovasi: 'Deskripsi Inovasi A',
      buktiJenis: ['dokumen'],
      buktiFiles: { dokumen: [] }, // Kosong
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.message).toMatch(/Bukti dokumen harus menyertakan file dokumen yang valid/i);
  });

  test('Path 9 (Error): Desa belum Terverifikasi', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'village123', role: 'village' });

    mockCollections.villages.findOne.mockResolvedValueOnce({ status: 'Menunggu' });

    const req = createRequest({
      desaId: 'desa123',
      namaInovasi: 'Inovasi A',
      namaInovator: 'Pak Tani',
      deskripsiInovasi: 'Deskripsi Inovasi A',
      buktiJenis: ['foto'],
      buktiFiles: { foto: ['url-foto'] },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.message).toMatch(/Profil Desa Anda belum diverifikasi/i);

    expect(mockDb.collection).toHaveBeenCalledWith('villages');
    expect(mockCollections.villages.findOne).toHaveBeenCalledWith({ userId: 'village123' });
    expect(mockCollections.claimInnovations.insertOne).not.toHaveBeenCalled();
  });

  test('Path 10 (Error): Konflik Klaim Ganda', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'village123', role: 'village' });

    mockCollections.villages.findOne.mockResolvedValueOnce({ status: 'Terverifikasi' });
    mockCollections.claimInnovations.findOne.mockResolvedValueOnce({ _id: 'klaimLama' });

    const req = createRequest({
      desaId: 'desa123',
      inovasiId: 'inovasi123',
      namaInovasi: 'Inovasi A',
      namaInovator: 'Pak Tani',
      deskripsiInovasi: 'Deskripsi Inovasi A',
      buktiJenis: ['foto'],
      buktiFiles: { foto: ['url-foto'] },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.message).toMatch(/Inovasi ini sudah dalam proses klaim/i);

    expect(mockCollections.claimInnovations.findOne).toHaveBeenCalledWith({
      desaId: 'desa123',
      inovasiId: 'inovasi123',
      status: { $ne: 'Ditolak' },
    });
    expect(mockCollections.claimInnovations.insertOne).not.toHaveBeenCalled();
  });

  test('Path 11 (Success): Klaim berhasil disubmit', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'village123', role: 'village' });

    mockCollections.villages.findOne.mockResolvedValueOnce({ status: 'Terverifikasi' });
    mockCollections.claimInnovations.findOne.mockResolvedValueOnce(null);

    const req = createRequest({
      desaId: 'desa123',
      namaDesa: 'Desa Sukamaju',
      inovasiId: 'inovasi123',
      namaInovasi: 'Inovasi A',
      namaInovator: 'Pak Tani',
      deskripsiInovasi: 'Deskripsi Inovasi A',
      buktiJenis: ['foto'],
      buktiFiles: { foto: ['url-foto'] },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(mockCollections.claimInnovations.insertOne).toHaveBeenCalled();

    expect(invalidateCachePattern).toHaveBeenCalledWith('cache:claims:list:*');
    expect(invalidateCacheKeys).toHaveBeenCalledWith([
      'cache:village:detail:desa123',
      'cache:village:dashboard:desa123',
    ]);

    expect(notifyAllAdmins).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'claim_submission',
        title: expect.stringContaining('Inovasi A'),
        relatedId: json.claimId,
      })
    );

    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'desa123', // harus desaId, BUKAN auth.uid
        category: 'claim_submission',
        relatedId: json.claimId,
      })
    );

    // Pastikan response memuat claimId hasil insertOne.
    expect(json.claimId).toBe('new-claim-id');
  });
});