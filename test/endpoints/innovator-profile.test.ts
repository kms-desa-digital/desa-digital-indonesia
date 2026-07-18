import { NextRequest, NextResponse } from 'next/server';
import { POST } from '@/app/api/innovator/route';
import { requireRole } from '@/lib/auth/apiAuth';
import { connectToDatabase } from '@/lib/db/mongodb';
import { invalidateCachePattern, invalidateCacheKeys } from '@/lib/utils/cache';
import { notifyAllAdmins } from '@/services/notificationServices';

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
  notifyAllAdmins: jest.fn(),
}));

const createRequest = (body: any) => {
  return new NextRequest('http://localhost:3000/api/innovator', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
};

const validPayload = {
  targetId: 'innovator-123',
  namaInovator: 'Inovator X',
  deskripsi: 'Deskripsi Inovator',
  kategori: 'Pendidikan',
  whatsapp: '081234567890',
  logo: 'logo.png',
  header: 'header.png',
};

describe('Modul Profil Inovator (POST /api/innovator)', () => {
  let mockDb: any;
  let mockCollections: Record<string, any>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCollections = {
      users: {
        findOne: jest.fn(),
        insertOne: jest.fn().mockResolvedValue({ insertedId: 'new-user-id' }),
      },
      innovators: {
        findOne: jest.fn(),
        insertOne: jest.fn().mockResolvedValue({ insertedId: 'new-innovator-id' }),
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

  test('Path 1 (Error 401/403): Request tanpa token atau oleh role yang bukan innovator/admin', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce(
      NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    );

    const req = createRequest(validPayload);
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.message).toMatch(/Unauthorized/i);
  });

  test('Path 2 (Error 400): Parameter wajib tidak lengkap', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'innovator-123', role: 'innovator' });

    const invalidPayload = { ...validPayload };
    delete (invalidPayload as any).namaInovator;

    const req = createRequest(invalidPayload);
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.message).toMatch(/Field wajib tidak lengkap/i);
    expect(connectToDatabase).not.toHaveBeenCalled();
  });

  test('Path 3 (Error 400): Jumlah kata melebihi batas (namaInovator > 10 kata)', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'innovator-123', role: 'innovator' });

    const longName = Array(11).fill('nama').join(' ');
    const req = createRequest({ ...validPayload, namaInovator: longName });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.message).toMatch(/Maksimal 10 kata untuk nama inovator/i);
  });

  test('Path 4 (Error 400): Data pengguna tidak ditemukan di MongoDB dan gagal auto-sync', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'admin-123', role: 'admin' });

    mockCollections.users.findOne.mockResolvedValueOnce(null);

    const req = createRequest(validPayload);
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.message).toMatch(/User tidak ditemukan di sistem/i);

    expect(mockDb.collection).toHaveBeenCalledWith('users');
    expect(mockCollections.users.findOne).toHaveBeenCalledWith({
      $or: [
        { uid: 'innovator-123' },
        { firebaseUid: 'innovator-123' },
        { id: 'innovator-123' },
        { _id: 'innovator-123' },
      ],
    });

    expect(mockCollections.users.insertOne).not.toHaveBeenCalled();
    expect(mockCollections.innovators.insertOne).not.toHaveBeenCalled();
  });

  test('Path 5 (Error 400): Peran pengguna di MongoDB bukan innovator', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'innovator-123', role: 'innovator' });

    mockCollections.users.findOne.mockResolvedValueOnce({ role: 'village' });

    const req = createRequest(validPayload);
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.message).toMatch(/Peran pengguna haruslah inovator/i);
    expect(mockCollections.innovators.insertOne).not.toHaveBeenCalled();
  });

  test('Path 6 (Error 409): Profil inovator untuk user ini sudah ada', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'innovator-123', role: 'innovator' });

    mockCollections.users.findOne.mockResolvedValueOnce({ role: 'innovator' });
    mockCollections.innovators.findOne.mockResolvedValueOnce({ _id: 'existing-innovator' });

    const req = createRequest(validPayload);
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.message).toMatch(/Profil inovator sudah ada/i);

    expect(mockCollections.innovators.findOne).toHaveBeenCalledWith({
      $or: [{ _id: 'innovator-123' }, { userId: 'innovator-123' }],
    });
    expect(mockCollections.innovators.insertOne).not.toHaveBeenCalled();
  });

  test('Path 7 (Success 201): Input valid, profil berhasil dibuat', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'innovator-123', role: 'innovator' });

    mockCollections.users.findOne.mockResolvedValueOnce({ role: 'innovator' });
    mockCollections.innovators.findOne.mockResolvedValueOnce(null);

    const attackerPayload = {
      ...validPayload,
      status: 'Terverifikasi',
      jumlahInovasi: 999,
      jumlahDesaDampingan: 999,
      _id: 'id-milik-orang-lain',
    };

    const req = createRequest(attackerPayload);
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(mockCollections.innovators.insertOne).toHaveBeenCalled();

    const insertedDoc = mockCollections.innovators.insertOne.mock.calls[0][0];
    expect(insertedDoc._id).toBe('innovator-123');
    expect(insertedDoc.status).toBe('Menunggu');
    expect(insertedDoc.jumlahInovasi).toBe(0);
    expect(insertedDoc.jumlahDesaDampingan).toBe(0);

    expect(invalidateCachePattern).toHaveBeenCalledWith('cache:innovators:list:*');
    expect(invalidateCacheKeys).toHaveBeenCalledWith([
      'cache:auth:me:innovator-123',
      'cache:user:role:innovator-123',
    ]);

    expect(notifyAllAdmins).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'innovator_submission',
        title: expect.stringContaining('Inovator X'),
        relatedId: 'innovator-123',
      })
    );

    expect(json.profile.namaInovator).toBe('Inovator X');
    expect(json.profile.id).toBe('innovator-123');
  });
});