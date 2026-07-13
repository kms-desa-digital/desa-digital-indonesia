import { NextRequest } from 'next/server';
import { POST } from '@/app/api/recommendations/route';
import axios from 'axios';
import { getCachedData, setCachedData } from '@/lib/utils/cache';

// Mock dependencies
jest.mock('axios');
jest.mock('@/lib/utils/cache', () => ({
  getCachedData: jest.fn(),
  setCachedData: jest.fn(),
}));

const createRequest = (body: any) => {
  return new NextRequest('http://localhost:3000/api/recommendations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
};

describe('Modul Rekomendasi AI (POST /api/recommendations)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Path 1 (Error 400): Parameter innovation_id tidak disertakan', async () => {
    const req = createRequest({ top_n: 5 });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.message).toMatch(/innovation_id is required/i);
  });

  test('Path 2 (Success 200 - Cache Hit): Mengembalikan data dari cache', async () => {
    const mockCachedData = [{ id: 'innov-1', score: 0.9 }];
    (getCachedData as jest.Mock).mockResolvedValueOnce(mockCachedData);

    const req = createRequest({ innovation_id: 'innov-123', top_n: 4 });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual(mockCachedData);
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('Path 3 (Success 200 - API Call): Memanggil external API dan update cache', async () => {
    (getCachedData as jest.Mock).mockResolvedValueOnce(null);
    const mockApiResponse = { data: [{ id: 'innov-2', score: 0.8 }] };
    (axios.post as jest.Mock).mockResolvedValueOnce(mockApiResponse);

    const req = createRequest({ innovation_id: 'innov-123', top_n: 4 });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual(mockApiResponse.data);
    expect(axios.post).toHaveBeenCalled();
    expect(setCachedData).toHaveBeenCalled();
  });

  test('Path 4 (Error 500): External API gagal atau throw error', async () => {
    (getCachedData as jest.Mock).mockResolvedValueOnce(null);
    const errorResponse = { response: { data: { detail: 'Service unavailable' } } };
    (axios.post as jest.Mock).mockRejectedValueOnce(errorResponse);

    const req = createRequest({ innovation_id: 'innov-123', top_n: 4 });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.message).toMatch(/Failed to fetch recommendations/i);
    expect(json.error).toBe('Service unavailable');
  });
});
