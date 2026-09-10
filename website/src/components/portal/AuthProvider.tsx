"use client";
import { useEffect } from "react";
import { onIdTokenChanged } from "firebase/auth";
import { useQueryClient } from "@tanstack/react-query";
import { auth } from "@/services/firebase";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { usePatientStore } from "@/store/patient.store";
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const cache = useQueryClient();
  useEffect(() => {
    localStorage.removeItem("gericare_token");
    if (!auth) {
      useAuthStore
        .getState()
        .setError(
          "Sign-in is not configured. Please contact the service administrator.",
        );
      return;
    }
    let generation = 0;
    let previous: string | null = null;
    const stop = onIdTokenChanged(auth, async (identity) => {
      const current = ++generation;
      if (previous !== identity?.uid) {
        cache.clear();
        usePatientStore.getState().setSelectedPatientId(null);
      }
      previous = identity?.uid ?? null;
      if (!identity) {
        useAuthStore.getState().clearSession();
        return;
      }
      useAuthStore.getState().setIsLoading(true);
      const sessionBeforeRequest = useAuthStore.getState().token;
      try {
        const token = await identity.getIdToken();
        const user = await authService.getCurrentUser();
        if (current === generation)
          useAuthStore.getState().setSession(user, token);
      } catch (error) {
        if (
          current === generation &&
          useAuthStore.getState().token === sessionBeforeRequest
        )
          useAuthStore
            .getState()
            .setError(
              (error as Error).message ||
                "We couldn't verify your account. Please sign in again.",
            );
      }
    });
    return () => {
      generation++;
      stop();
    };
  }, [cache]);
  return children;
}
