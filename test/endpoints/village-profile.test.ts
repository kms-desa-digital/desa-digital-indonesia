import { NextRequest, NextResponse } from 'next/server';
import { POST } from '@/app/api/villages/route';
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
  return new NextRequest('http://localhost:3000/api/villages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
};

const validPayload = {
  userId: 'user-123',
  namaDesa: 'Desa Maju',
  deskripsi: 'Deskripsi singkat',
  lokasi: { provinsi: 'Jabar', kabupatenKota: 'Bandung', kecamatan: 'Cibiru', desaKelurahan: 'Cipadung' },
  potensiDesa: ['Pertanian'],
  logo: 'logo.png',
  header: 'header.png',
  geografisDesa: 'Pegunungan',
  sosialBudaya: 'Ramah',
  sumberDaya: 'Air melimpah',
  infrastrukturDesa: 'Jalan aspal',
  whatsapp: '081234567890',
  kondisijalan: 'Baik',
  jaringan: '4G',
  listrik: 'PLN',
  teknologi: 'Ada',
  kemampuan: 'Baik',
};

describe('Modul Profil Desa (POST /api/villages)', () => {
  let mockDb: any;
  let mockCollections: Record<string, any>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCollections = {
      users: {
        findOne: jest.fn(),
      },
      villages: {
        findOne: jest.fn(),
        insertOne: jest.fn().mockResolvedValue({ insertedId: 'new-village-id' }),
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

  test('Path 1 (Error 401/403): Request tanpa token atau oleh role yang bukan village/admin', async () => {
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
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'user-123', role: 'village' });

    const invalidPayload = { ...validPayload };
    delete (invalidPayload as any).namaDesa;

    const req = createRequest(invalidPayload);
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.message).toMatch(/Field wajib tidak lengkap/i);
    expect(connectToDatabase).not.toHaveBeenCalled();
  });

  test('Path 3 (Error 400): Jumlah kata melebihi batas (deskripsi > 100 kata)', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'user-123', role: 'village' });

    const longDesc = Array(101).fill('kata').join(' ');
    const req = createRequest({ ...validPayload, deskripsi: longDesc });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.message).toMatch(/Maksimal 100 kata untuk deskripsi/i);
  });

  test('Path 4 (Error 400): Data pengguna tidak ditemukan di MongoDB', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'user-123', role: 'village' });

    mockCollections.users.findOne.mockResolvedValueOnce(null);

    const req = createRequest(validPayload);
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.message).toMatch(/User tidak ditemukan di sistem/i);

    expect(mockDb.collection).toHaveBeenCalledWith('users');
    expect(mockCollections.users.findOne).toHaveBeenCalledWith({
      $or: [
        { uid: 'user-123' },
        { firebaseUid: 'user-123' },
        { id: 'user-123' },
        { _id: 'user-123' },
      ],
    });
    expect(mockCollections.villages.insertOne).not.toHaveBeenCalled();
  });

  test('Path 5 (Error 400): Peran pengguna di MongoDB bukan village', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'user-123', role: 'village' });

    mockCollections.users.findOne.mockResolvedValueOnce({ role: 'innovator' });

    const req = createRequest(validPayload);
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.message).toMatch(/Peran pengguna haruslah perangkat desa/i);
    expect(mockCollections.villages.insertOne).not.toHaveBeenCalled();
  });

  test('Path 6 (Error 409): Profil desa untuk user ini sudah ada', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'user-123', role: 'village' });

    mockCollections.users.findOne.mockResolvedValueOnce({ role: 'village' });
    mockCollections.villages.findOne.mockResolvedValueOnce({ _id: 'existing-village' });

    const req = createRequest(validPayload);
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.message).toMatch(/Profil desa untuk user ini sudah ada/i);

    expect(mockCollections.villages.findOne).toHaveBeenCalledWith({ userId: 'user-123' });
    expect(mockCollections.villages.insertOne).not.toHaveBeenCalled();
  });

  test('Path 7 (Success 201): Input valid, profil berhasil dibuat', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'user-123', role: 'village' });

    mockCollections.users.findOne.mockResolvedValueOnce({ role: 'village' });
    mockCollections.villages.findOne.mockResolvedValueOnce(null);

    const attackerPayload = {
      ...validPayload,
      _id: 'id-milik-orang-lain',
    };

    const req = createRequest(attackerPayload);
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.message).toMatch(/Profil desa berhasil dibuat/i);
    expect(mockCollections.villages.insertOne).toHaveBeenCalled();

    const insertedDoc = mockCollections.villages.insertOne.mock.calls[0][0];
    expect(insertedDoc._id).toBeUndefined();

    expect(invalidateCachePattern).toHaveBeenCalledWith('cache:villages:list:*');
    expect(invalidateCacheKeys).toHaveBeenCalledWith([
      'cache:auth:me:user-123',
      'cache:user:role:user-123',
    ]);

    expect(notifyAllAdmins).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'village_submission',
        title: expect.stringContaining('Desa Maju'),
        relatedId: 'user-123',
      })
    );

    expect(json.villageId).toBe('new-village-id');
  });

  test('Path 8 (Seharusnya Sukses): infrastrukturDesa kosong, field wajib lain lengkap', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'user-123', role: 'village' });

    mockCollections.users.findOne.mockResolvedValueOnce({ role: 'village' });
    mockCollections.villages.findOne.mockResolvedValueOnce(null);

    const payloadWithoutInfrastruktur = { ...validPayload };
    delete (payloadWithoutInfrastruktur as any).infrastrukturDesa;

    const req = createRequest(payloadWithoutInfrastruktur);
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.message).toMatch(/Profil desa berhasil dibuat/i);
  });

  test('Path 9 (Error 400): geografisDesa melebihi batas 30 kata', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'user-123', role: 'village' });

    const longGeografis = Array(31).fill('gunung').join(' ');
    const req = createRequest({ ...validPayload, geografisDesa: longGeografis });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.message).toMatch(/Maksimal 30 kata untuk kondisi geografis/i);
    // Pastikan gagal SEBELUM sampai ke database.
    expect(connectToDatabase).not.toHaveBeenCalled();
  });

  test('Path 10 (Error 400): sosialBudaya melebihi batas 30 kata', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'user-123', role: 'village' });

    const longSosial = Array(31).fill('ramah').join(' ');
    const req = createRequest({ ...validPayload, sosialBudaya: longSosial });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.message).toMatch(/Maksimal 30 kata untuk kondisi sosial dan budaya/i);
    expect(connectToDatabase).not.toHaveBeenCalled();
  });

  test('Path 11 (Error 400): sumberDaya melebihi batas 30 kata', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'user-123', role: 'village' });

    const longSumberDaya = Array(31).fill('air').join(' ');
    const req = createRequest({ ...validPayload, sumberDaya: longSumberDaya });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.message).toMatch(/Maksimal 30 kata untuk kondisi sumber daya alam/i);
    expect(connectToDatabase).not.toHaveBeenCalled();
  });

  test('Path 12 (Error 400): lokasi.provinsi kosong', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'user-123', role: 'village' });

    const payload = {
      ...validPayload,
      lokasi: { ...validPayload.lokasi, provinsi: '' },
    };
    const req = createRequest(payload);
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.message).toMatch(/Field wajib tidak lengkap/i);
    expect(connectToDatabase).not.toHaveBeenCalled();
  });

  test('Path 13 (Error 400): lokasi.kabupatenKota kosong', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'user-123', role: 'village' });

    const payload = {
      ...validPayload,
      lokasi: { ...validPayload.lokasi, kabupatenKota: '' },
    };
    const req = createRequest(payload);
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.message).toMatch(/Field wajib tidak lengkap/i);
    expect(connectToDatabase).not.toHaveBeenCalled();
  });

  test('Path 14 (Error 400): lokasi.kecamatan kosong', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'user-123', role: 'village' });

    const payload = {
      ...validPayload,
      lokasi: { ...validPayload.lokasi, kecamatan: '' },
    };
    const req = createRequest(payload);
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.message).toMatch(/Field wajib tidak lengkap/i);
    expect(connectToDatabase).not.toHaveBeenCalled();
  });

  test('Path 15 (Error 400): lokasi.desaKelurahan kosong', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'user-123', role: 'village' });

    const payload = {
      ...validPayload,
      lokasi: { ...validPayload.lokasi, desaKelurahan: '' },
    };
    const req = createRequest(payload);
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.message).toMatch(/Field wajib tidak lengkap/i);
    expect(connectToDatabase).not.toHaveBeenCalled();
  });
});