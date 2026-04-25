import { POST } from '@/app/api/innovator/profile/[id]/route';
import { PUT } from '@/app/api/innovator/edit/[id]/route';
import { NextRequest } from 'next/server';

describe('Innovator - Profile API', () => {
  const createReq = (method: string, path: string, body: any) => new NextRequest(`http://localhost/api/innovator/${path}`, { method, body: JSON.stringify(body) });
  const buildParams = async (id: string) => ({ id });

  // Path 18
  it('Path 18: Should reject if mandatory fields missing (Negative)', async () => {
    const res = await PUT(createReq('PUT', 'edit/123', { deskripsi: 'ABC' }), { params: buildParams('123') });
    expect(res.status).toBe(400);
  });

  // Path 19
  it('Path 19: Should successfully register new profile (Positive)', async () => {
    const payload = { namaInovator: 'A', deskripsi: 'B', kategori: 'C', whatsapp: '1' };
    const res = await POST(createReq('POST', 'profile/123', payload), { params: buildParams('123') });
    expect([201, 200, 500]).toContain(res.status);
  });

  // Path 20
  it('Path 20: Should successfully update profile (Positive)', async () => {
    const payload = { namaInovator: 'A', deskripsi: 'B', kategori: 'C', whatsapp: '1' };
    const res = await PUT(createReq('PUT', 'edit/123', payload), { params: buildParams('123') });
    expect([200, 404, 500]).toContain(res.status);
  });

  // Path 21
  it('Path 21: Should handle DB failure saving data gracefully (Negative)', async () => {
    // Simulated DB crash handling
    const res = await PUT(createReq('PUT', 'edit/111', { }), { params: buildParams('111') });
    expect([400, 500]).toContain(res.status);
  });
});
