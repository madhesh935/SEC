import { create } from "zustand";
import { User, UserRole } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  setSession: (user: User, token: string) => void;
  setUser: (user: User | null) => void;
  setRole: (role: UserRole) => void;
  clearSession: () => void;
  setIsLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: typeof window !== "undefined" ? localStorage.getItem("gericare_token") : null,
  role: "caregiver",
  isAuthenticated: false,
  isLoading: false,
  setSession: (user, token) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("gericare_token", token);
    }
    set({
      user,
      token,
      role: user.role,
      isAuthenticated: true,
      isLoading: false,
    });
  },
  setUser: (user) => {
    set({
      user,
      role: user ? user.role : "caregiver",
      isAuthenticated: !!user,
    });
  },
  setRole: (role) => {
    set((state) => ({
      role,
      user: state.user ? { ...state.user, role } : null,
    }));
  },
  clearSession: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("gericare_token");
    }
    set({
      user: null,
      token: null,
      role: "caregiver",
      isAuthenticated: false,
      isLoading: false,
    });
  },
  setIsLoading: (isLoading) => set({ isLoading }),
}));
