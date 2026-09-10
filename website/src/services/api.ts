import axios, { AxiosError } from "axios";
import { auth } from "./firebase";
import { useAuthStore } from "@/store/auth.store";
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});
apiClient.interceptors.request.use(async (config) => {
  const token = auth?.currentUser
    ? await auth.currentUser.getIdToken()
    : useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
apiClient.interceptors.response.use(
  (response) => response,
  async (
    error: AxiosError<{
      error?: { message?: string; code?: string };
      message?: string;
      detail?: unknown;
    }>,
  ) => {
    const config = error.config as typeof error.config & {
      refreshed?: boolean;
    };
    if (
      error.response?.status === 401 &&
      config &&
      !config.refreshed &&
      auth?.currentUser &&
      !config.url?.includes("/auth/")
    ) {
      config.refreshed = true;
      try {
        await auth.currentUser.getIdToken(true);
        return await apiClient(config);
      } catch {
        /* preserve server error */
      }
    }
    return Promise.reject({
      status: error.response?.status,
      code: error.response?.data?.error?.code || error.code,
      message:
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        (error.response?.status === 403
          ? "You do not have permission to view this information."
          : "We couldn't connect right now. Please try again."),
    });
  },
);
export default apiClient;
