import api from "./api";

type InnovatorFilters = {
  status?: string;
  search?: string;
  kategori?: string;
};

export const getInnovators = async (filters?: InnovatorFilters) => {
  return api.get("/innovator", { params: filters || {} });
};

export const getInnovatorById = async (id: string) => {
  return api.get(`/innovator/detail/${id}`); // Assumes it uses detail endpoint now
};

export const createInnovator = async (data: any) => {
  return api.post("/innovator", data);
};

export const updateInnovator = async (id: string, data: any) => {
  return api.put(`/innovator/edit`, data); // Note: update API endpoints if it expects ID in URL
};

export const deleteInnovator = async (id: string) => {
  return api.delete(`/innovator/${id}`);
};

export const getAssistedVillages = async (id: string) => {
  return api.get(`/innovator/${id}/villages`);
};
