import { NextRequest, NextResponse } from 'next/server';
import { POST } from '@/app/api/admin/verify/claims/[id]/route';
import { requireRole } from '@/lib/auth/apiAuth';
import { connectToDatabase } from '@/lib/db/mongodb';
import { invalidateCachePattern, invalidateCacheKeys } from '@/lib/utils/cache';
import { createNotification } from '@/services/notificationServices';

// Mock dependencies
jest.mock('@/lib/auth/apiAuth', () => ({
  requireRole: jest.fn(),
}));

jest.mock('@/lib/db/mongodb', () => ({
  connectToDatabase: jest.fn(),
}));

jest.mock('@/lib/utils/cache', () => ({
  getCachedData: jest.fn(),
  setCachedData: jest.fn(),
  invalidateCachePattern: jest.fn(),
  invalidateCacheKeys: jest.fn(),
}));

jest.mock('@/services/notificationServices', () => ({
  createNotification: jest.fn(),
}));

const createRequest = (body: any) => {
  return new NextRequest('http://localhost:3000/api/admin/verify/claims/claim-123', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
};

describe('Modul Verifikasi Klaim Admin (POST /api/admin/verify/claims/[id])', () => {
  let mockDb: any;
  let mockCollections: Record<string, any>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCollections = {
      claimInnovations: {
        findOne: jest.fn(),
        updateOne: jest.fn().mockResolvedValue({ matchedCount: 1 }),
      },
      villages: {
        updateOne: jest.fn().mockResolvedValue({ matchedCount: 1 }),
      },
      innovations: {
        updateOne: jest.fn().mockResolvedValue({ matchedCount: 1 }),
      },
      users: {
        findOne: jest.fn(),
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

  test('Path 1 (Error 401/403): Request dikirim oleh selain Admin', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce(
      NextResponse.json({ message: 'Unauthorized' }, { status: 403 })
    );

    const req = createRequest({ status: 'Terverifikasi' });
    const res = await POST(req, { params: Promise.resolve({ id: 'claim-123' }) });
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.message).toMatch(/Unauthorized/i);
    expect(connectToDatabase).not.toHaveBeenCalled();
  });

  test('Path 2 (Error 400): Parameter ID klaim tidak dikirimkan', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'admin-123', role: 'admin' });

    const req = createRequest({ status: 'Terverifikasi' });
    const res = await POST(req, { params: Promise.resolve({ id: '' }) });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.message).toMatch(/Claim ID is required/i);
    expect(connectToDatabase).not.toHaveBeenCalled();
  });

  test('Path 3 (Error 404): ID klaim tidak ditemukan di database', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'admin-123', role: 'admin' });

    mockCollections.claimInnovations.findOne.mockResolvedValueOnce(null);

    const req = createRequest({ status: 'Terverifikasi' });
    const res = await POST(req, { params: Promise.resolve({ id: 'invalid-id' }) });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.message).toMatch(/Klaim tidak ditemukan/i);

    expect(mockCollections.claimInnovations.findOne).toHaveBeenCalledWith({ _id: 'invalid-id' });
    expect(mockCollections.claimInnovations.updateOne).not.toHaveBeenCalled();
  });

  test('Path 4 (Success 200 - Disetujui): Status diubah menjadi Terverifikasi', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'admin-123', role: 'admin' });

    mockCollections.claimInnovations.findOne.mockResolvedValueOnce({
      _id: 'claim-123',
      desaId: 'village-123',
      inovasiId: 'innov-123',
      namaInovasi: 'Inovasi A',
    });
    mockCollections.users.findOne.mockResolvedValueOnce({ uid: 'village-123' });

    const req = createRequest({ status: 'Terverifikasi', catatanAdmin: 'OK' });
    const res = await POST(req, { params: Promise.resolve({ id: 'claim-123' }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.message).toMatch(/Klaim berhasil diverifikasi/i);
    expect(mockCollections.claimInnovations.updateOne).toHaveBeenCalled();

    const updateCall = mockCollections.claimInnovations.updateOne.mock.calls[0];
    expect(updateCall[0]).toEqual({ _id: 'claim-123' });
    expect(updateCall[1].$set).toEqual(
      expect.objectContaining({
        status: 'Terverifikasi',
        catatanAdmin: 'OK',
        updatedAt: expect.any(Date),
        verifiedAt: expect.any(Date), // hanya muncul untuk status Terverifikasi
      })
    );

    expect(mockCollections.villages.updateOne).toHaveBeenCalledWith(
      { $or: [{ userId: 'village-123' }, { desaId: 'village-123' }] },
      { $inc: { jumlahInovasiDiterapkan: 1 } }
    );
    expect(mockCollections.innovations.updateOne).toHaveBeenCalledWith(
      { _id: 'innov-123' }, // 'innov-123' bukan ObjectId valid, dipakai sebagai string
      { $addToSet: { desaId: 'village-123' }, $inc: { jumlahPenerapan: 1 } }
    );

    expect(invalidateCacheKeys).toHaveBeenCalledWith([
      'cache:claim:detail:claim-123',
      'cache:claim:detail:claim-123',
      'cache:village:detail:village-123',
      'cache:village:dashboard:village-123',
      'cache:auth:me:village-123',
      'cache:innovation:detail:innov-123',
    ]);
    expect(invalidateCachePattern).toHaveBeenCalledWith('cache:claims:list:*');
    expect(invalidateCachePattern).toHaveBeenCalledWith('cache:innovator:dashboard:*');
    expect(invalidateCachePattern).toHaveBeenCalledWith('cache:innovations:list:*');
    expect(invalidateCachePattern).toHaveBeenCalledWith('cache:villages:list:*');

    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'village-123',
        title: 'Klaim Inovasi Disetujui',
        description: expect.stringContaining('Inovasi A'),
        relatedId: 'claim-123',
      })
    );
  });

  test('Path 5 (Success 200 - Ditolak): Status diubah menjadi Ditolak', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'admin-123', role: 'admin' });

    mockCollections.claimInnovations.findOne.mockResolvedValueOnce({
      _id: 'claim-123',
      desaId: 'village-123',
      namaInovasi: 'Inovasi B',
    });
    mockCollections.users.findOne.mockResolvedValueOnce({ uid: 'village-123' });

    const req = createRequest({ status: 'Ditolak', catatanAdmin: 'Kurang data' });
    const res = await POST(req, { params: Promise.resolve({ id: 'claim-123' }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.message).toMatch(/Klaim berhasil ditolak/i);
    expect(mockCollections.claimInnovations.updateOne).toHaveBeenCalled();

    const updateCall = mockCollections.claimInnovations.updateOne.mock.calls[0];
    expect(updateCall[1].$set).toEqual({
      status: 'Ditolak',
      catatanAdmin: 'Kurang data',
      updatedAt: expect.any(Date),
    });
    expect(updateCall[1].$set.verifiedAt).toBeUndefined();

    expect(mockCollections.villages.updateOne).not.toHaveBeenCalled();
    expect(mockCollections.innovations.updateOne).not.toHaveBeenCalled();
    expect(invalidateCacheKeys).toHaveBeenCalledWith([
      'cache:claim:detail:claim-123',
      'cache:claim:detail:claim-123',
      'cache:village:detail:village-123',
      'cache:village:dashboard:village-123',
      'cache:auth:me:village-123',
    ]);

    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'village-123',
        title: 'Klaim Inovasi Ditolak',
        description: expect.stringContaining('Kurang data'),
        relatedId: 'claim-123',
      })
    );
  });

  test('Path 6 (Bug Keamanan): Body tanpa field status TIDAK BOLEH otomatis menyetujui klaim', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'admin-123', role: 'admin' });

    mockCollections.claimInnovations.findOne.mockResolvedValueOnce({
      _id: 'claim-123',
      desaId: 'village-123',
      namaInovasi: 'Inovasi C',
    });
    mockCollections.users.findOne.mockResolvedValueOnce({ uid: 'village-123' });

    const req = createRequest({ catatanAdmin: 'Tanpa status' });
    const res = await POST(req, { params: Promise.resolve({ id: 'claim-123' }) });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.status).not.toBe('Terverifikasi');
  });

  test('Path 7 (Bug Keamanan): Nilai status yang tidak dikenal (typo/sampah) TIDAK BOLEH diperlakukan sebagai persetujuan', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'admin-123', role: 'admin' });

    mockCollections.claimInnovations.findOne.mockResolvedValueOnce({
      _id: 'claim-123',
      desaId: 'village-123',
      namaInovasi: 'Inovasi D',
    });
    mockCollections.users.findOne.mockResolvedValueOnce({ uid: 'village-123' });

    const req = createRequest({ status: 'ditolak_typo_huruf_kecil' });
    const res = await POST(req, { params: Promise.resolve({ id: 'claim-123' }) });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.status).not.toBe('Terverifikasi');
  });

  test('Path 8 (Error 404): matchedCount 0 saat updateOne (klaim berubah di antara findOne dan updateOne)', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'admin-123', role: 'admin' });

    mockCollections.claimInnovations.findOne.mockResolvedValueOnce({
      _id: 'claim-123',
      desaId: 'village-123',
      namaInovasi: 'Inovasi E',
    });
    mockCollections.claimInnovations.updateOne.mockResolvedValueOnce({ matchedCount: 0 });

    const req = createRequest({ status: 'Terverifikasi' });
    const res = await POST(req, { params: Promise.resolve({ id: 'claim-123' }) });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.message).toMatch(/Klaim tidak ditemukan/i);
    // Karena update gagal, langkah sinkronisasi & notifikasi TIDAK BOLEH
    // berjalan.
    expect(mockCollections.villages.updateOne).not.toHaveBeenCalled();
    expect(createNotification).not.toHaveBeenCalled();
  });

  test('Path 9 (Success 200): Notifikasi memakai firebaseUid saat field uid tidak ada', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'admin-123', role: 'admin' });

    mockCollections.claimInnovations.findOne.mockResolvedValueOnce({
      _id: 'claim-123',
      desaId: 'village-123',
      namaInovasi: 'Inovasi F',
    });
    // User ditemukan, tapi HANYA punya firebaseUid, tidak ada uid.
    mockCollections.users.findOne.mockResolvedValueOnce({ firebaseUid: 'fb-village-123' });

    const req = createRequest({ status: 'Terverifikasi' });
    await POST(req, { params: Promise.resolve({ id: 'claim-123' }) });

    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'fb-village-123' })
    );
  });

  test('Path 10 (Success 200): Notifikasi fallback ke desaId mentah saat user tidak ditemukan di koleksi users', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'admin-123', role: 'admin' });

    mockCollections.claimInnovations.findOne.mockResolvedValueOnce({
      _id: 'claim-123',
      desaId: 'village-123',
      namaInovasi: 'Inovasi G',
    });
    mockCollections.users.findOne.mockResolvedValueOnce(null);

    const req = createRequest({ status: 'Terverifikasi' });
    const res = await POST(req, { params: Promise.resolve({ id: 'claim-123' }) });

    expect(res.status).toBe(200);
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'village-123' })
    );
  });

  test('Path 11 (Success 200): Notifikasi di-skip kalau claim tidak punya desaId', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'admin-123', role: 'admin' });

    mockCollections.claimInnovations.findOne.mockResolvedValueOnce({
      _id: 'claim-123',
      desaId: null,
      namaInovasi: 'Inovasi H',
    });

    const req = createRequest({ status: 'Terverifikasi' });
    const res = await POST(req, { params: Promise.resolve({ id: 'claim-123' }) });

    expect(res.status).toBe(200);
    expect(createNotification).not.toHaveBeenCalled();
    expect(mockCollections.users.findOne).not.toHaveBeenCalled();
  });
});