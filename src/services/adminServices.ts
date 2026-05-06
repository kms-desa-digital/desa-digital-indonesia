import api from "./api";

export const getUsers = async (params?: { search?: string; role?: string; page?: number; limit?: number }) => {
  return api.get("/admin/users", { params });
};


export const createUser = async (data: any) => {
  return api.post("/admin/users", data);
};

export const getUserById = async (id: string) => {
  return api.get(`/admin/users/${id}`);
};


export const updateUser = async (id: string, data: any) => {
  return api.put(`/admin/users/${id}`, data);
};

export const deleteUser = async (id: string) => {
  return api.delete(`/admin/users/${id}`);
};

export const verifyVillage = async (id: string, data: { status: string; catatanAdmin?: string }) => {
  return api.post(`/admin/verify/village/${id}`, data);
};

export const verifyInnovator = async (id: string, data: { status: string; catatanAdmin?: string }) => {
  return api.post(`/admin/verify/innovator/${id}`, data);
};

export const verifyInnovation = async (id: string, data: { status: string; catatanAdmin?: string }) => {
  return api.post(`/admin/verify/innovation/${id}`, data);
};

export const verifyClaim = async (id: string, data: { status: string; catatanAdmin?: string }) => {
  return api.post(`/admin/verify/claims/${id}`, data);
};

export const getAdminDashboardStats = async () => {
  return api.get("/admin/dashboard");
};

export const getAdminNotificationStats = async () => {
  return api.get("/admin/notifications");
};

export const broadcastNotification = async (data: any) => {
  return api.post("/admin/notifications", data);
};

// Ads
export const createAd = async (body: {
  name: string;
  minDate: string;
  maxDate: string;
  link: string;
  image?: string;
  status?: string;
}) => {
  return api.post("/admin/ads/make", body);
};

export const getAds = async (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
  return api.get("/admin/ads", { params });
};

export const deleteAd = async (id: string) => {
  return api.delete(`/admin/ads/${id}`);
};

export const getAdById = async (id: string) => {
  return api.get(`/admin/ads/${id}`);
};

export const updateAd = async (id: string, body: any) => {
  return api.put("/admin/ads/edit", { id, ...body });
};
