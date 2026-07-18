import { GET } from '@/app/api/auth/me/route';
import { NextRequest, NextResponse } from 'next/server';
import { verifyRoleFromToken } from '@/lib/auth/verifyRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import { getCachedData, setCachedData } from '@/lib/utils/cache';

// Mock Dependencies
jest.mock('@/lib/auth/verifyRole', () => ({
  verifyRoleFromToken: jest.fn(),
}));

jest.mock('@/lib/db/mongodb', () => ({
  connectToDatabase: jest.fn(),
}));

jest.mock('@/lib/utils/cache', () => ({
  getCachedData: jest.fn(),
  setCachedData: jest.fn(),
}));

const createRequest = (withAuth = true) => {
  return new NextRequest('http://localhost/api/auth/me', {
    method: 'GET',
    headers: withAuth ? { Authorization: 'Bearer VALID_TOKEN' } : {},
  });
};

describe('Modul Autentikasi Endpoint Me (GET /api/auth/me)', () => {
  let mockDb: any;
  let mockCollections: Record<string, any>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCollections = {
      users: {
        findOne: jest.fn(),
        updateOne: jest.fn().mockResolvedValue({ matchedCount: 1 }),
        insertOne: jest.fn().mockResolvedValue({ insertedId: 'mongo-generated-id' }),
      },
      innovators: {
        findOne: jest.fn(),
      },
      villages: {
        findOne: jest.fn(),
      },
      innovations: {
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
    (getCachedData as jest.Mock).mockResolvedValue(null);
  });

  test('Path 1 (Error): Kondisi jika tidak ada authHeader', async () => {
    const req = createRequest(false);

    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.message).toMatch(/Unauthorized/i);
    expect(verifyRoleFromToken).not.toHaveBeenCalled();
    expect(connectToDatabase).not.toHaveBeenCalled();
  });

  test('Path 2 (Error): Kondisi jika verifyRoleFromToken gagal decode dan return null', async () => {
    (verifyRoleFromToken as jest.Mock).mockResolvedValueOnce(null);

    const req = createRequest();

    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.message).toMatch(/Invalid or expired token/i);
  });

  test('Path 3 (Success): User baru, auto-sync ke MongoDB berhasil', async () => {
    (verifyRoleFromToken as jest.Mock).mockResolvedValueOnce({
      uid: 'firebase-uid-123',
      role: 'village',
      email: 'new-user@example.com',
    });

    mockCollections.users.findOne.mockResolvedValueOnce(null);

    const req = createRequest();

    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);

    expect(mockCollections.users.insertOne).toHaveBeenCalledWith(
      expect.objectContaining({
        uid: 'firebase-uid-123',
        firebaseUid: 'firebase-uid-123',
        email: 'new-user@example.com',
        role: 'village',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      })
    );

    expect(json.user.uid).toBe('mongo-generated-id');
    expect(json.user.firebaseUid).toBe('firebase-uid-123');
    expect(json.user.role).toBe('village');
  });

  test('Path 4 (Success): Kondisi sinkronisasi Role Firebase vs MongoDB', async () => {
    (verifyRoleFromToken as jest.Mock).mockResolvedValueOnce({
      uid: 'uid-123',
      role: 'admin',
    });

    mockCollections.users.findOne.mockResolvedValueOnce({
      _id: 'uid-123',
      email: 'test@example.com',
      role: 'village',
    });

    const req = createRequest();

    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.user.role).toBe('admin');

    expect(mockCollections.users.updateOne).toHaveBeenCalledWith(
      { _id: 'uid-123' },
      { $set: { role: 'admin', updatedAt: expect.any(Date) } }
    );
  });

  test('Path 5 (Error): Kondisi Internal Server Error (Koneksi Database gagal)', async () => {
    (verifyRoleFromToken as jest.Mock).mockResolvedValueOnce({
      uid: 'uid-123',
      role: 'village',
    });

    (connectToDatabase as jest.Mock).mockRejectedValueOnce(new Error('DB Timeout'));

    const req = createRequest();

    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.message).toMatch(/internal server error/i);
  });

  test('Path 6 (Success): Role tidak berubah (village == village), tidak ada sinkronisasi', async () => {
    (verifyRoleFromToken as jest.Mock).mockResolvedValueOnce({
      uid: 'uid-123',
      role: 'village',
    });

    mockCollections.users.findOne.mockResolvedValueOnce({
      _id: 'uid-123',
      email: 'village@example.com',
      role: 'village',
    });
    mockCollections.innovators.findOne.mockResolvedValueOnce(null);
    mockCollections.villages.findOne.mockResolvedValueOnce({
      _id: 'uid-123',
      namaDesa: 'Desa Maju',
      status: 'Menunggu', // belum terverifikasi
    });
    mockCollections.innovations.findOne.mockResolvedValueOnce(null);

    const req = createRequest();

    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.user.role).toBe('village');
    expect(json.user.isVillageVerified).toBe(false);
    expect(mockCollections.users.updateOne).not.toHaveBeenCalled(); // Tidak ada sinkronisasi
  });

  test('Path 7 (Success): Ketiga flag verifikasi (innovator, village, innovation) bernilai true', async () => {
    (verifyRoleFromToken as jest.Mock).mockResolvedValueOnce({
      uid: 'uid-456',
      role: 'innovator',
    });

    mockCollections.users.findOne.mockResolvedValueOnce({
      _id: 'uid-456',
      email: 'innovator@example.com',
      role: 'innovator',
    });
    mockCollections.innovators.findOne.mockResolvedValueOnce({
      _id: 'uid-456',
      status: 'Terverifikasi',
    });
    mockCollections.villages.findOne.mockResolvedValueOnce(null);
    mockCollections.innovations.findOne.mockResolvedValueOnce({
      _id: 'innov-1',
      innovatorId: 'uid-456',
      status: 'Terverifikasi',
    });

    const req = createRequest();

    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.user.isInnovatorVerified).toBe(true);
    expect(json.user.isVillageVerified).toBe(false);
    expect(json.user.isInnovationVerified).toBe(true);

    expect(mockCollections.innovations.findOne).toHaveBeenCalledWith({
      innovatorId: { $in: ['uid-456', 'uid-456'] },
      status: 'Terverifikasi',
    });
  });

  test('Path 8 (Success): Cache hit, langsung kembalikan data tanpa query DB', async () => {
    (verifyRoleFromToken as jest.Mock).mockResolvedValueOnce({
      uid: 'uid-cached',
      role: 'village',
    });

    const cachedPayload = {
      user: {
        uid: 'uid-cached',
        firebaseUid: 'uid-cached',
        email: 'cached@example.com',
        role: 'village',
        isInnovatorVerified: false,
        isVillageVerified: true,
        isInnovationVerified: false,
      },
    };
    (getCachedData as jest.Mock).mockResolvedValueOnce(cachedPayload);

    const req = createRequest();

    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual(cachedPayload);
    expect(connectToDatabase).not.toHaveBeenCalled();
  });

  test('Path 9 (Success): setCachedData dipanggil dengan key dan TTL yang benar', async () => {
    (verifyRoleFromToken as jest.Mock).mockResolvedValueOnce({
      uid: 'uid-789',
      role: 'village',
    });

    mockCollections.users.findOne.mockResolvedValueOnce({
      _id: 'uid-789',
      email: 'test@example.com',
      role: 'village',
    });
    mockCollections.innovators.findOne.mockResolvedValueOnce(null);
    mockCollections.villages.findOne.mockResolvedValueOnce(null);
    mockCollections.innovations.findOne.mockResolvedValueOnce(null);

    const req = createRequest();
    await GET(req);

    expect(setCachedData).toHaveBeenCalledWith(
      'cache:auth:me:uid-789',
      expect.objectContaining({
        user: expect.objectContaining({ uid: 'uid-789' }),
      }),
      30
    );
  });

  test('Path 10 (Success): Role guest tidak memicu sinkronisasi, fallback ke role MongoDB', async () => {
    (verifyRoleFromToken as jest.Mock).mockResolvedValueOnce({
      uid: 'uid-guest',
      role: 'guest',
    });

    mockCollections.users.findOne.mockResolvedValueOnce({
      _id: 'uid-guest',
      email: 'guest@example.com',
      role: 'village', // role tersimpan di MongoDB berbeda dari 'guest'
    });
    mockCollections.innovators.findOne.mockResolvedValueOnce(null);
    mockCollections.villages.findOne.mockResolvedValueOnce(null);
    mockCollections.innovations.findOne.mockResolvedValueOnce(null);

    const req = createRequest();

    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(mockCollections.users.updateOne).not.toHaveBeenCalled();
    expect(json.user.role).toBe('village');
  });

  test('Path 11 (Success): userIdString berformat ObjectId valid, query menyertakan klausa _id ObjectId', async () => {
    const validObjectIdString = '507f1f77bcf86cd799439011'; // 24 karakter hex valid

    (verifyRoleFromToken as jest.Mock).mockResolvedValueOnce({
      uid: 'firebase-uid-objid',
      role: 'village',
    });

    mockCollections.users.findOne.mockResolvedValueOnce({
      _id: validObjectIdString,
      email: 'test@example.com',
      role: 'village',
    });
    mockCollections.innovators.findOne.mockResolvedValueOnce(null);
    mockCollections.villages.findOne.mockResolvedValueOnce(null);
    mockCollections.innovations.findOne.mockResolvedValueOnce(null);

    const req = createRequest();
    await GET(req);

    const villagesCallArg = mockCollections.villages.findOne.mock.calls[0][0];
    const orClauses = villagesCallArg.$or;
    const hasObjectIdClause = orClauses.some(
      (clause: any) => clause._id && typeof clause._id === 'object' && clause._id.toString() === validObjectIdString
    );
    expect(hasObjectIdClause).toBe(true);
  });

  test('Path 12 (Success dengan fallback): insertOne gagal saat auto-sync, userIdString fallback ke uid Firebase', async () => {
    (verifyRoleFromToken as jest.Mock).mockResolvedValueOnce({
      uid: 'firebase-uid-fail-sync',
      role: 'village',
      email: 'fail-sync@example.com',
    });

    mockCollections.users.findOne.mockResolvedValueOnce(null);
    mockCollections.users.insertOne.mockRejectedValueOnce(new Error('Insert failed'));
    mockCollections.innovators.findOne.mockResolvedValueOnce(null);
    mockCollections.villages.findOne.mockResolvedValueOnce(null);
    mockCollections.innovations.findOne.mockResolvedValueOnce(null);

    const req = createRequest();

    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.user.uid).toBe('firebase-uid-fail-sync');
    expect(json.user.email).toBe('fail-sync@example.com');
  });
});