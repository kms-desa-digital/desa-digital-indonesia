import { BASE_URL } from "Consts/url";
import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { auth } from "src/firebase/clientApp";

/**
 * Axios instance config
 */
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60 * 1000, // 60 seconds (increased for dev server cold starts)
  headers: {
    "Content-Type": "application/json",
    "x-internal-request": "true",
  },
});

const onRequest = async (config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    if (
      typeof config.url === "string" &&
      config.url.startsWith("/") &&
      !config.url.startsWith("/api/")
    ) {
      config.url = config.url.replace(/^\//, "");
    }

    let authToken = localStorage.getItem("token");

    if (auth.currentUser) {
      try {
        const currentToken = await auth.currentUser.getIdToken();
        if (currentToken) {
          authToken = currentToken;
          localStorage.setItem("token", currentToken);
        }
      } catch (tokenError) {
        console.warn("Failed to refresh auth token:", tokenError);
      }
    }

    if (authToken) {
      config.headers = config.headers || {};
      (config.headers as Record<string, string>)["Authorization"] =
        `Bearer ${authToken}`;
    }
  }

  return config;
};


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
