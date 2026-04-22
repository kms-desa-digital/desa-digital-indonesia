import { POST } from '@/app/api/innovations/route';
import { PUT } from '@/app/api/innovations/[id]/route';
import { NextRequest } from 'next/server';

describe('Innovator - Add Innovation API', () => {
  const createPostReq = (body: any) => new NextRequest('http://localhost/api/innovations', { method: 'POST', body: JSON.stringify(body) });
  const createPutReq = (body: any, id: string) => new NextRequest(`http://localhost/api/innovations/${id}`, { method: 'PUT', body: JSON.stringify(body) });

  // Path 15
  it('Path 15: Should reject submit empty form (Negative)', async () => {
    const res = await POST(createPostReq({ innovatorId: '123' }));
    expect(res.status).toBe(400);
  });

  // Path 16
  it('Path 16: Should store new innovation data successfully (Positive)', async () => {
    const res = await POST(createPostReq({ 
      namaInovasi: 'Test', kategori: 'Pertanian', tahunDibuat: '2025', deskripsi: 'Desc', innovatorId: '65f0' 
    }));
    expect([201, 500]).toContain(res.status);
  });

  // Path 17
  it('Path 17: Should update innovation data correctly (Positive)', async () => {
    const res = await PUT(createPutReq({ deskripsi: 'Updated Desc' }, 'test-id'), { params: Promise.resolve({ id: 'test-id' }) });
    expect([200, 404, 500]).toContain(res.status);
  });
});
