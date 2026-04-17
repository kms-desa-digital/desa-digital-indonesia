import { BASE_URL } from "Consts/url";
import axios, { AxiosError, AxiosResponse } from "axios";
import { auth } from "src/firebase/clientApp";

/**
 * Axios instance config
 */
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60 * 1000, // 60 seconds (increased for dev server cold starts)
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request interceptor
 */
const onRequest = async (config: any) => {
  if (typeof window !== "undefined") {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const idToken = await currentUser.getIdToken();
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${idToken}`;
    }
  }
  return config;
};

/**
 * Response interceptor
 */
const onResponseSuccess = (response: AxiosResponse): AxiosResponse =>
  response.data;
const onResponseError = (error: AxiosError): Promise<AxiosError> => {
  const responseData: any = error.response?.data;
  const normalizedError = {
    message:
      responseData?.message ||
      error.message ||
      "Request failed",
    status: error.response?.status,
    data: responseData,
    response: error.response,
  };

  return Promise.reject(normalizedError as any);
};

/**
 * Middleware
 */
api.interceptors.request.use(onRequest, (error) => Promise.reject(error));
api.interceptors.response.use(onResponseSuccess, onResponseError);

export default api;
