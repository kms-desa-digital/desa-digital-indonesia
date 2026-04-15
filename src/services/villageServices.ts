import api from "./api";

type VillageFilters = {
  status?: string;
  search?: string;
  provinsi?: string;
  kabupatenKota?: string;
  limit?: number;
  skip?: number;
};

export const getVillages = async (filters?: string | VillageFilters) => {
  const params: VillageFilters =
    typeof filters === "string"
      ? { status: filters }
      : filters || {};

  return api.get("/villages", { params });
};

export const getVillageById = async (id: string) => {
  return api.get(`/villages/${id}`);
};

export const createVillage = async (data: any) => {
  return api.post("/villages", data);
};

export const updateVillage = async (id: string, data: any) => {
  return api.put(`/villages/${id}`, data);
};

export const deleteVillage = async (id: string) => {
  return api.delete(`/villages/${id}`);
};

export const claimInnovation = async (data: any) => {
  return api.post("/villages/claim", data);
};

export const getClaims = async (desaId?: string, status?: string, limit?: number, skip?: number, search?: string) => {
  const params: any = {};
  if (desaId) params.desaId = desaId;
  if (status) params.status = status;
  if (limit) params.limit = limit;
  if (skip) params.skip = skip;
  if (search) params.search = search;
  return api.get("/villages/claim", { params });
};

export const getClaimById = async (id: string) => {
  return api.get(`/villages/claim/${id}`);
};

export const updateClaim = async (id: string, data: any) => {
  return api.put(`/villages/claim/${id}`, data);
};

export const getVillageInnovations = async (id: string, status?: string) => {
  const params: any = {};
  if (status) params.status = status;
  return api.get(`/villages/${id}/innovations`, { params });
};
