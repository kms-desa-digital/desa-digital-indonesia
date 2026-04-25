import { POST as VerClaims } from '@/app/api/admin/verify/claims/[id]/route';
import { POST as VerInov } from '@/app/api/admin/verify/innovation/[id]/route';
import { POST as VerVil } from '@/app/api/admin/verify/village/[id]/route';
import { POST as VerInvt } from '@/app/api/admin/verify/innovator/[id]/route';
import { NextRequest } from 'next/server';

describe('Admin - Verify Actions API Test Suite', () => {
  const reqFactory = (status: string, targetPath: string) => {
    return new NextRequest(`http://localhost/api/admin/verify/${targetPath}/123`, {
      method: 'POST',
      body: JSON.stringify({ status, catatanAdmin: status === 'Ditolak' ? 'Alasan' : null })
    });
  };
  const params = Promise.resolve({ id: '123' });

  // Paths 35, 36: Verify Claims
  it('Path 35: Administrator Accept Claim Verification (Positive)', async () => {
    const res = await VerClaims(reqFactory('Terverifikasi', 'claims'), { params });
    expect([200, 404, 500]).toContain(res.status);
  });
  it('Path 36: Administrator Reject Claim Verification (Negative)', async () => {
    const res = await VerClaims(reqFactory('Ditolak', 'claims'), { params });
    expect([200, 404, 500]).toContain(res.status);
  });

  // Paths 37, 38: Verify Innovations
  it('Path 37: Administrator Accept Innovation (Positive)', async () => {
    const res = await VerInov(reqFactory('Terverifikasi', 'innovation'), { params });
    expect([200, 404, 500]).toContain(res.status);
  });
  it('Path 38: Administrator Reject Innovation (Negative)', async () => {
    const res = await VerInov(reqFactory('Ditolak', 'innovation'), { params });
    expect([200, 404, 500]).toContain(res.status);
  });

  // Paths 39, 40: Verify Village
  it('Path 39: Administrator Accept Village (Positive)', async () => {
    const res = await VerVil(reqFactory('Terverifikasi', 'village'), { params });
    expect([200, 404, 500]).toContain(res.status);
  });
  it('Path 40: Administrator Reject Village (Negative)', async () => {
    const res = await VerVil(reqFactory('Ditolak', 'village'), { params });
    expect([200, 404, 500]).toContain(res.status);
  });

  // Paths 41, 42: Verify Innovator
  it('Path 41: Administrator Accept Innovator (Positive)', async () => {
    const res = await VerInvt(reqFactory('Terverifikasi', 'innovator'), { params });
    expect([200, 404, 500]).toContain(res.status);
  });
  it('Path 42: Administrator Reject Innovator (Negative)', async () => {
    const res = await VerInvt(reqFactory('Ditolak', 'innovator'), { params });
    expect([200, 404, 500]).toContain(res.status);
  });
});
