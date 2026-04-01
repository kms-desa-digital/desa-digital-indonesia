import api from "./api";

export const addInnovation = async (body: any): Promise<any> =>
  await api.post("/innovations", body);
export const getInnovation = async (params: { category?: string; status?: string; innovatorId?: string } = {}): Promise<any> => {
  const query = new URLSearchParams();
  if (params.category) query.append("category", params.category);
  if (params.status) query.append("status", params.status);
  if (params.innovatorId) query.append("innovatorId", params.innovatorId);
  return await api.get(`/innovations?${query.toString()}`);
};
export const getInnovationById = async (id: string | undefined) =>
  await api.get(`/innovations/${id}`);
export const getInnovationByCategory = async (category: string) =>
  await api.get(`/innovations/categories?name=${category}`);
export const updateInnovation = async (id: string, body: any) =>
  await api.put(`/innovations/${id}`, body);
export const getAppliedVillages = async (id: string) =>
  await api.get(`/innovations/${id}/villages`);
export const deleteInnovation = async (id: string) =>
  await api.delete(`/innovations/${id}`);
