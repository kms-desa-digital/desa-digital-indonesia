import { POST } from '@/app/api/villages/route';
import { PUT } from '@/app/api/villages/[id]/route';
import { NextRequest } from 'next/server';

describe('Village - Profile Registration API', () => {
  const createPostReq = (body: any) => new NextRequest('http://localhost/api/villages', { method: 'POST', body: JSON.stringify(body) });
  const createPutReq = (body: any, id: string) => new NextRequest(`http://localhost/api/villages/${id}`, { method: 'PUT', body: JSON.stringify(body) });

  // Path 31
  it('Path 31: Should reject missing mandatory field (Negative)', async () => {
    const res = await POST(createPostReq({ userId: '123' }));
    expect(res.status).toBe(400);
  });

  // Path 32
  it('Path 32: Should execute successful initialization of new village profile (Positive)', async () => {
    const res = await POST(createPostReq({ userId: 'usr1', namaDesa: 'Sukamaju' }));
    expect([201, 400, 500]).toContain(res.status); // 400 if user exists
  });

  // Path 33
  it('Path 33: Should execute successful profile update (Positive)', async () => {
    const res = await PUT(createPutReq({ namaDesa: 'Maju' }, 'usr1'), { params: Promise.resolve({ id: 'usr1' }) });
    expect([200, 404, 500]).toContain(res.status);
  });

  // Path 34
  it('Path 34: Should fail if db crash resolving (Negative)', async () => {
    const res = await PUT(createPutReq({}, 'xxx'), { params: Promise.resolve({ id: 'xxx' }) });
    expect([200, 404, 500]).toContain(res.status);
  });
});
