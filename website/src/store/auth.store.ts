import { create } from "zustand";
import { User, UserRole } from "@/types";
interface AuthState {
  user: User | null;
  token: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setSession: (user: User, token: string) => void;
  setUser: (user: User | null) => void;
  clearSession: () => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  setSession: (user, token) =>
    set({
      user,
      token,
      role: user.role,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    }),
  setUser: (user) =>
    set({ user, role: user?.role ?? null, isAuthenticated: !!user }),
  clearSession: () =>
    set({
      user: null,
      token: null,
      role: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
}));
