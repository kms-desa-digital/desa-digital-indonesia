import { POST } from '@/app/api/innovations/route';
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { requireRole } from '@/lib/auth/apiAuth';
import { invalidateCachePattern, invalidateCacheKeys } from '@/lib/utils/cache';
import { notifyAllAdmins } from '@/services/notificationServices';

jest.mock('@/lib/db/mongodb', () => ({
  connectToDatabase: jest.fn(),
}));

jest.mock('@/lib/auth/apiAuth', () => ({
  requireRole: jest.fn(),
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

describe('Modul Inovasi (POST /api/innovations)', () => {
  let mockDb: any;
  let mockCollections: Record<string, any>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCollections = {
      users: {
        findOne: jest.fn(),
      },
      innovators: {
        findOne: jest.fn(),
      },
      innovations: {
        insertOne: jest.fn().mockResolvedValue({ insertedId: 'new-innovation-id' }),
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
    return new NextRequest('http://localhost/api/innovations', {
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

  test('Path 2 (Error): Salah satu field wajib kosong', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'user123', role: 'innovator' });

    // Missing 'kategori'
    const req = createRequest({
      namaInovasi: 'Inovasi A',
      tahunDibuat: '2023',
      deskripsi: 'Deskripsi Inovasi A',
      innovatorId: 'innovator123',
      statusInovasi: 'Aktif',
      modelBisnis: ['B2B'],
      inputDesaMenerapkan: 'Desa A',
      manfaat: ['Efisiensi'],
      infrastruktur: ['Server'],
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.message).toMatch(/Field wajib tidak lengkap/i);
  });

  test('Path 3 (Error): Field array (modelBisnis, manfaat) dikirim kosong', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'user123', role: 'innovator' });

    const req = createRequest({
      namaInovasi: 'Inovasi A',
      kategori: 'IT',
      tahunDibuat: '2023',
      deskripsi: 'Deskripsi Inovasi A',
      innovatorId: 'innovator123',
      statusInovasi: 'Aktif',
      modelBisnis: [], // Kosong
      inputDesaMenerapkan: 'Desa A',
      manfaat: ['Efisiensi'],
      infrastruktur: ['Server'],
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.message).toMatch(/Field wajib tidak lengkap/i);
  });

  test('Path 4 (Error): Deskripsi melebihi batas 80 kata', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'user123', role: 'innovator' });

    const longDesc = new Array(81).fill('kata').join(' ');

    const req = createRequest({
      namaInovasi: 'Inovasi A',
      kategori: 'IT',
      tahunDibuat: '2023',
      deskripsi: longDesc,
      innovatorId: 'innovator123',
      statusInovasi: 'Aktif',
      modelBisnis: ['B2B'],
      inputDesaMenerapkan: 'Desa A',
      manfaat: ['Efisiensi'],
      infrastruktur: ['Server'],
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.message).toMatch(/Maksimal 80 kata untuk deskripsi/i);
  });

  test('Path 5 (Error): Input desa menerapkan melebihi batas 20 kata', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'user123', role: 'innovator' });

    const longDesa = new Array(21).fill('desa').join(' ');

    const req = createRequest({
      namaInovasi: 'Inovasi A',
      kategori: 'IT',
      tahunDibuat: '2023',
      deskripsi: 'Valid deskripsi',
      innovatorId: 'innovator123',
      statusInovasi: 'Aktif',
      modelBisnis: ['B2B'],
      inputDesaMenerapkan: longDesa,
      manfaat: ['Efisiensi'],
      infrastruktur: ['Server'],
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.message).toMatch(/Maksimal 20 kata untuk desa yang menerapkan/i);
  });

  test('Path 6 (Error): Salah satu model bisnis melebihi batas 5 kata', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'user123', role: 'innovator' });


    const longModel = new Array(6).fill('model').join(' ');

    const req = createRequest({
      namaInovasi: 'Inovasi A',
      kategori: 'IT',
      tahunDibuat: '2023',
      deskripsi: 'Valid deskripsi',
      innovatorId: 'innovator123',
      statusInovasi: 'Aktif',
      modelBisnis: [longModel],
      inputDesaMenerapkan: 'Desa A',
      manfaat: ['Efisiensi'],
      infrastruktur: ['Server'],
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.message).toMatch(/Maksimal 5 kata untuk model bisnis/i);
  });

  test('Path 7 (Error): Profil Inovator belum Terverifikasi', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'user123', role: 'innovator' });

    mockCollections.users.findOne.mockResolvedValueOnce({ userId: 'user123' });
    mockCollections.innovators.findOne.mockResolvedValueOnce({ userId: 'user123', status: 'Menunggu' });

    const req = createRequest({
      namaInovasi: 'Inovasi A',
      kategori: 'IT',
      tahunDibuat: '2023',
      deskripsi: 'Valid deskripsi',
      innovatorId: 'innovator123',
      statusInovasi: 'Aktif',
      modelBisnis: ['B2B'],
      inputDesaMenerapkan: 'Desa A',
      manfaat: ['Efisiensi'],
      infrastruktur: ['Server'],
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.message).toMatch(/Profil Inovator Anda belum diverifikasi/i);

    expect(mockDb.collection).toHaveBeenCalledWith('users');
    expect(mockDb.collection).toHaveBeenCalledWith('innovators');
    expect(mockCollections.innovations.insertOne).not.toHaveBeenCalled();
  });

  test('Path 8 (Success): Input valid dan Profil Terverifikasi, berhasil insert data', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'user123', role: 'innovator' });

    mockCollections.users.findOne.mockResolvedValueOnce({ _id: 'mongo123', uid: 'user123' });

    mockCollections.innovators.findOne.mockResolvedValueOnce({
      userId: 'mongo123',
      status: 'Terverifikasi',
    });

    mockCollections.innovators.findOne.mockResolvedValueOnce({
      userId: 'mongo123',
      status: 'Terverifikasi',
      namaInnovator: 'Bu Siti',
      logo: 'https://example.com/logo-bu-siti.png',
    });

    const req = createRequest({
      namaInovasi: 'Inovasi Cerdas',
      kategori: 'IT',
      tahunDibuat: '2023',
      deskripsi: 'Sistem pengairan cerdas.',
      innovatorId: 'innovator123',
      statusInovasi: 'Aktif',
      modelBisnis: ['Langganan'],
      inputDesaMenerapkan: 'Desa B',
      manfaat: ['Hemat Air'],
      infrastruktur: ['Sensor'],
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.message).toMatch(/Inovasi berhasil ditambahkan/i);
    expect(mockCollections.innovations.insertOne).toHaveBeenCalled();

    const insertedDoc = mockCollections.innovations.insertOne.mock.calls[0][0];
    expect(insertedDoc.namaInnovator).toBe('Bu Siti');
    expect(insertedDoc.innovatorImgURL).toBe('https://example.com/logo-bu-siti.png');
    expect(invalidateCachePattern).toHaveBeenCalledWith('cache:innovations:list:*');
    expect(invalidateCachePattern).toHaveBeenCalledWith('cache:recommendations:*');
    expect(invalidateCacheKeys).toHaveBeenCalledWith([
      'cache:innovator:dashboard:innovator123',
      'cache:auth:me:innovator123',
    ]);

    expect(notifyAllAdmins).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'innovation_submission',
        title: expect.stringContaining('Inovasi Cerdas'),
        relatedId: json.innovationId,
      })
    );
  });

  test('Path 9 (Error): Field array manfaat dikirim kosong (terisolasi dari modelBisnis)', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'user123', role: 'innovator' });

    const req = createRequest({
      namaInovasi: 'Inovasi A',
      kategori: 'IT',
      tahunDibuat: '2023',
      deskripsi: 'Deskripsi Inovasi A',
      innovatorId: 'innovator123',
      statusInovasi: 'Aktif',
      modelBisnis: ['B2B'],
      inputDesaMenerapkan: 'Desa A',
      manfaat: [],
      infrastruktur: ['Server'],
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.message).toMatch(/Field wajib tidak lengkap/i);
    expect(mockCollections.innovations.insertOne).not.toHaveBeenCalled();
  });

  test('Path 10 (Error): Field array infrastruktur dikirim kosong (terisolasi dari modelBisnis & manfaat)', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'user123', role: 'innovator' });

    const req = createRequest({
      namaInovasi: 'Inovasi A',
      kategori: 'IT',
      tahunDibuat: '2023',
      deskripsi: 'Deskripsi Inovasi A',
      innovatorId: 'innovator123',
      statusInovasi: 'Aktif',
      modelBisnis: ['B2B'],
      inputDesaMenerapkan: 'Desa A',
      manfaat: ['Efisiensi'],
      infrastruktur: [],
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.message).toMatch(/Field wajib tidak lengkap/i);
    expect(mockCollections.innovations.insertOne).not.toHaveBeenCalled();
  });

  test('Path 11 (Keamanan): innovatorId di body tidak boleh mengambil identitas innovator lain', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ uid: 'userA', role: 'innovator' });

    mockCollections.users.findOne.mockResolvedValueOnce({ _id: 'mongoA', uid: 'userA' });

    mockCollections.innovators.findOne.mockResolvedValueOnce({
      userId: 'mongoA',
      status: 'Terverifikasi',
      namaInnovator: 'Innovator A',
      logo: 'https://example.com/logo-a.png',
    });

    mockCollections.innovators.findOne.mockResolvedValueOnce({
      _id: 'innovatorB-id',
      userId: 'userB',
      status: 'Terverifikasi',
      namaInnovator: 'Innovator B',
      logo: 'https://example.com/logo-b.png',
    });

    const req = createRequest({
      namaInovasi: 'Inovasi Pinjam Identitas',
      kategori: 'IT',
      tahunDibuat: '2023',
      deskripsi: 'Deskripsi valid.',
      innovatorId: 'innovatorB-id', // <-- milik innovator LAIN
      statusInovasi: 'Aktif',
      modelBisnis: ['B2B'],
      inputDesaMenerapkan: 'Desa A',
      manfaat: ['Efisiensi'],
      infrastruktur: ['Server'],
    });

    const res = await POST(req);
    const insertedDoc = mockCollections.innovations.insertOne.mock.calls[0]?.[0];

    expect(insertedDoc?.namaInnovator).not.toBe('Innovator B');
    expect(insertedDoc?.innovatorImgURL).not.toBe('https://example.com/logo-b.png');
  });
});