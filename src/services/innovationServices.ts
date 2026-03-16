import api from "./api";

export const addInnovation = async (body: any): Promise<any> =>
  await api.post("/innovations", body);
export const getInnovation = async (): Promise<any> =>
  await api.get("/innovations");
export const getInnovationById = async (id: string | undefined) =>
  await api.get(`/innovations/${id}`);
export const getInnovationByCategory = async (category: string) =>
  await api.get(`/innovations/categories?name=${category}`);
export const updateInnovation = async (id: string, body: any) =>
  await api.put(`/innovations/${id}`, body);
export const getAppliedVillages = async (id: string) =>
  await api.get(`/innovations/${id}/villages`);
