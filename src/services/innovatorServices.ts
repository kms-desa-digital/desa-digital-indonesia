import api from "./api";

export const getInnovators = async () => {
  return api.get("/innovators");
};

export const getInnovatorById = async (id: string) => {
  return api.get(`/innovators/${id}`);
};

export const createInnovator = async (data: any) => {
  return api.post("/innovators", data);
};

export const updateInnovator = async (id: string, data: any) => {
  return api.put(`/innovators/${id}`, data);
};

export const deleteInnovator = async (id: string) => {
  return api.delete(`/innovators/${id}`);
};
