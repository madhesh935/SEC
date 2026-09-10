import { create } from "zustand";
import { SessionData } from "../types/session";
import { sessionService } from "../services/session.service";
import { useCompanionStore } from "./companion.store";

interface SessionStoreState {
  session: SessionData | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  initializeSession: () => Promise<SessionData | null>;
  setSession: (session: SessionData) => Promise<void>;
  clearSession: () => Promise<void>;
}

export const useSessionStore = create<SessionStoreState>((set) => ({
  session: null,
  isLoading: true,
  isAuthenticated: false,

  initializeSession: async () => {
    set({ isLoading: true });
    try {
      const session = await sessionService.getSession();
      set({
        session,
        isAuthenticated: !!session,
        isLoading: false,
      });
      return session;
    } catch (error) {
      set({
        session: null,
        isAuthenticated: false,
        isLoading: false,
      });
      throw error;
    }
  },

  setSession: async (session: SessionData) => {
    await sessionService.saveSession(session);
    set({
      session,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  clearSession: async () => {
    await sessionService.clearSession();
    useCompanionStore.setState({
      conversationId: null,
      transcript: null,
      responseText: null,
      uiMode: "normal",
      state: "idle",
      recordingUri: null,
      errorMessage: null,
      isPlayingAudio: false,
    });
    set({
      session: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },
}));
