import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { router } from "expo-router";
import { CONFIG } from "../constants/config";
import { sessionService } from "./session.service";
import { sanitizePatientErrorMessage } from "../utils/error";
import { useSessionStore } from "../store/session.store";
import { ROUTES } from "../constants/routes";

// Called whenever a session is confirmed unrecoverable (refresh failed or
// was never possible). Without this, a stale/invalid session (e.g. old
// cached dev-only data, or a token the backend no longer recognizes) leaves
// the app stuck showing "Unable to load profile" forever with no way
// forward, since clearing storage alone doesn't update in-memory state or
// navigate the user anywhere.
async function handleUnrecoverableSession() {
  await useSessionStore.getState().clearSession();
  router.replace(ROUTES.ONBOARDING.WELCOME as any);
}

export const apiClient = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  timeout: CONFIG.API_TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor: Attach JWT token from SecureStore
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (!CONFIG.API_BASE_URL)
      throw new Error("The connection has not been configured.");
    const session = await sessionService.getSession();
    if (session?.accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor: Handle 401 token expiration and standardized errors
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Check for 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers && token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await sessionService.refreshSession();
        if (newToken) {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          processQueue(null, newToken);
          return apiClient(originalRequest);
        } else {
          processQueue(new Error("Session expired"), null);
          await handleUnrecoverableSession();
          return Promise.reject(error);
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // Attach standardized patient-safe message
    const patientSafeMessage = sanitizePatientErrorMessage(error);
    return Promise.reject(Object.assign(error, { patientSafeMessage }));
  },
);
