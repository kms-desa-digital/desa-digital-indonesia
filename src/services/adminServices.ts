import api from "./api";

export const verifyVillage = async (id: string, body: { status: string; catatanAdmin?: string | null }) => {
  return api.post(`admin/verify/village/${id}`, body);
};

export const verifyInnovator = async (id: string, body: { status: string; catatanAdmin?: string | null }) => {
  return api.post(`admin/verify/innovator/${id}`, body);
};

export const verifyInnovation = async (id: string, body: { status: string; catatanAdmin?: string | null }) => {
  return api.post(`admin/verify/innovation/${id}`, body);
};

export const verifyClaims = async (id: string, body: { status: string; catatanAdmin?: string | null }) => {
  return api.post(`admin/verify/claims/${id}`, body);
};

export const createAd = async (body: {
  name: string;
  minDate: string;
  maxDate: string;
  link: string;
  image?: string;
  status?: string;
}) => {
  return api.post("admin/ads/make", body);
};

export const getAds = async (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.status) queryParams.append('status', params.status);
  if (params?.search) queryParams.append('search', params.search);
  
  const queryString = queryParams.toString();
  return api.get(`admin/ads${queryString ? `?${queryString}` : ''}`);
};

export const deleteAd = async (id: string) => {
  return api.delete(`admin/ads/${id}`);
};

export const updateAd = async (id: string, body: any) => {
  return api.put(`admin/ads/edit`, { id, ...body });
};
