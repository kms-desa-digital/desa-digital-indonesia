import api from "./api";

type InnovatorFilters = {
  status?: string;
  search?: string;
  kategori?: string;
};

export interface InnovatorPayload {
  namaInovator: string;
  deskripsi: string;
  kategori: string;
  whatsapp: string;
  instagram?: string;
  website?: string;
  logo: string;
  header: string;
  desaId?: string[];
  jumlahInovasi?: number;
  jumlahDesaDampingan?: number;
  status?: string;
  targetId?: string; // used when admin creates a profile for someone else
}

export const getInnovators = async (filters?: InnovatorFilters) => {
  return api.get("innovator", { params: filters || {} });
};

export const getInnovatorById = async (id: string) => {
  return api.get(`innovator/${id}`);
};

export const createInnovator = async (id: string, data: InnovatorPayload) => {
  return api.post(`innovator`, { ...data, targetId: id });
};

export const updateInnovator = async (id: string, data: Partial<InnovatorPayload>) => {
  return api.put(`innovator/${id}`, data);
};

export const deleteInnovator = async (id: string) => {
  return api.delete(`innovator/${id}`);
};

export const getAssistedVillages = async (id: string) => {
  return api.get(`innovator/${id}/villages`);
};
