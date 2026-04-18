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
