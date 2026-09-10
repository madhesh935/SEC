import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useAuthStore } from "@/store/auth.store";
import { authService } from "@/services/auth.service";
import { auth as firebaseAuth } from "@/services/firebase";
import { LoginFormData, SignupFormData, ForgotPasswordFormData } from "@/schemas/auth.schema";
import { ApiError } from "@/types";

export function useAuth() {
  const router = useRouter();
  const { user, token, role, isAuthenticated, setSession, clearSession } =
    useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(data);
      setSession(response.user, response.token);
      router.push(response.user.role === "family" ? "/family" : "/caregiver");
      return response;
    } catch (err) {
      const apiErr = err as ApiError;
      const message =
        apiErr.message ||
        "Unable to sign in right now. Please check your credentials or try again.";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: SignupFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.signup(data);
      setSession(response.user, response.token);
      router.push(response.user.role === "family" ? "/family" : "/caregiver");
      return response;
    } catch (err) {
      const apiErr = err as ApiError;
      const message =
        apiErr.message || "Unable to create your account right now. Please try again.";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!firebaseAuth) {
        throw { message: "Google sign-in is not configured on this device." } as ApiError;
      }
      // Firebase's client SDK performs the actual Google OAuth popup and
      // returns a real Firebase ID token - that's what the backend verifies.
      const credential = await signInWithPopup(firebaseAuth, new GoogleAuthProvider());
      const idToken = await credential.user.getIdToken();

      const response = await authService.loginWithGoogle(idToken);
      setSession(response.user, response.token);
      router.push(response.user.role === "family" ? "/family" : "/caregiver");
      return response;
    } catch (err) {
      const apiErr = err as ApiError;
      const message =
        apiErr.message ||
        "Unable to sign in with Google right now. Please try again later.";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      clearSession();
      setIsLoading(false);
      router.push("/login");
    }
  };

  const forgotPassword = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      return await authService.forgotPassword(data);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Failed to send reset instructions.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    token,
    role,
    isAuthenticated,
    isLoading,
    error,
    login,
    signup,
    loginWithGoogle,
    logout,
    forgotPassword,

    clearError: () => setError(null),
  };
}

