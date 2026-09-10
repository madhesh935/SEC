import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { ApiError } from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: attach bearer token if available
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("gericare_token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: centralized error transformation & 401 handling
interface BackendErrorBody {
  message?: string;
  detail?: string;
  error?: { code?: string; message?: string; requestId?: string };
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<BackendErrorBody>) => {
    // Login/signup failures are also 401/409 and must not trigger a
    // redirect - only an already-authenticated request going stale should.
    const isAuthEndpoint = error.config?.url?.includes("/auth/login") ||
      error.config?.url?.includes("/auth/signup") ||
      error.config?.url?.includes("/auth/google");

    if (error.response?.status === 401 && !isAuthEndpoint) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("gericare_token");
        if (!window.location.pathname.startsWith("/login")) {
          window.location.href = "/login?session_expired=true";
        }
      }
    }

    // The backend's error envelope is {"error": {"code", "message", "requestId"}}
    // (see app/main.py's exception handlers) - unwrap that before falling
    // back to a generic axios message.
    const transformedError: ApiError = {
      message:
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.response?.data?.detail ||
        (error.message === "Network Error"
          ? "Unable to connect to GeriCare server. Please check your network connection."
          : error.message || "An unexpected error occurred."),
      status: error.response?.status,
      code: error.response?.data?.error?.code || error.code,
    };

    return Promise.reject(transformedError);
  }
);

export default apiClient;
