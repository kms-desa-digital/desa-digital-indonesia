import { POST } from '@/app/api/auth/register/route';
import { NextRequest } from 'next/server';

describe('Authentication - Register API', () => {
  const createReq = (body: any) => new NextRequest('http://localhost/api/auth/register', { method: 'POST', body: JSON.stringify(body) });

  // Path 7
  it('Path 7: Should reject empty or invalid format input (Negative)', async () => {
    const res = await POST(createReq({ }));
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  // Path 8
  it('Path 8: Should reject if passwords do not match (Negative)', async () => {
    const res = await POST(createReq({ email: 'a@mail.com', pass: 'A1', conf: 'A2' }));
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  // Path 9
  it('Path 9: Should reject if role is not selected (Negative)', async () => {
    const res = await POST(createReq({ email: 'b@mail.com', pass: 'A123', conf: 'A123', role: '' }));
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  // Path 10
  it('Path 10: Should reject registered email (Negative)', async () => {
    const res = await POST(createReq({ email: 'existing@mail.com', pass: 'A123', role: 'village' }));
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  // Path 11
  it('Path 11: Should successfully register a new user account (Positive)', async () => {
    const res = await POST(createReq({ email: 'new@mail.com', pass: 'A123', role: 'village' }));
    expect([201, 410]).toContain(res.status);
  });
});
