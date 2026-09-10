import apiClient from "./api";
import { User } from "@/types";
import { LoginFormData, SignupFormData, ForgotPasswordFormData } from "@/schemas/auth.schema";

export interface LoginResponse {
  token: string;
  user: User;
}

export const authService = {
  /**
   * Real sign-in via backend endpoint.
   * Can be configured to pass Firebase ID token or direct credentials.
   */
  async login(credentials: LoginFormData): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      "/api/v1/auth/login",
      credentials
    );
    return response.data;
  },

  /**
   * Create a new caregiver account and sign in immediately.
   */
  async signup(data: SignupFormData): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>("/api/v1/auth/signup", {
      name: data.name,
      email: data.email,
      password: data.password,
    });
    return response.data;
  },

  /**
   * Real sign-in via Google provider OAuth / Firebase token.
   */
  async loginWithGoogle(idToken?: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      "/api/v1/auth/google",
      { idToken }
    );
    return response.data;
  },

  /**
   * Sign out and invalidate server session.
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post("/api/v1/auth/logout");
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("gericare_token");
      }
    }
  },

  /**
   * Fetch currently authenticated user session from backend.
   */
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>("/api/v1/auth/me");
    return response.data;
  },

  /**
   * Request session token refresh.
   */
  async refreshSession(): Promise<{ token: string }> {
    const response = await apiClient.post<{ token: string }>(
      "/api/v1/auth/refresh"
    );
    return response.data;
  },

  /**
   * Send password reset email.
   */
  async forgotPassword(data: ForgotPasswordFormData): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      "/api/v1/auth/forgot-password",
      data
    );
    return response.data;
  },
};
