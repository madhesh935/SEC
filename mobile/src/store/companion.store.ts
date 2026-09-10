import { create } from "zustand";
import { CompanionState, CompanionUiMode } from "../types/conversation";

interface CompanionStoreState {
  state: CompanionState;
  uiMode: CompanionUiMode;
  conversationId: string | null;
  recordingUri: string | null;
  isPlayingAudio: boolean;
  transcript: string | null;
  responseText: string | null;
  errorMessage: string | null;
  isOnline: boolean;

  // Actions
  setState: (state: CompanionState) => void;
  setUiMode: (mode: CompanionUiMode) => void;
  setConversationId: (id: string | null) => void;
  setRecordingUri: (uri: string | null) => void;
  setIsPlayingAudio: (isPlaying: boolean) => void;
  setTranscript: (transcript: string | null) => void;
  setResponseText: (text: string | null) => void;
  setErrorMessage: (msg: string | null) => void;
  setIsOnline: (online: boolean) => void;
  resetToIdle: () => void;
}

export const useCompanionStore = create<CompanionStoreState>((set) => ({
  state: "idle",
  uiMode: "normal",
  conversationId: null,
  recordingUri: null,
  isPlayingAudio: false,
  transcript: null,
  responseText: null,
  errorMessage: null,
  isOnline: true,

  setState: (state) => set({ state }),
  setUiMode: (uiMode) => set({ uiMode }),
  setConversationId: (conversationId) => set({ conversationId }),
  setRecordingUri: (recordingUri) => set({ recordingUri }),
  setIsPlayingAudio: (isPlayingAudio) => set({ isPlayingAudio }),
  setTranscript: (transcript) => set({ transcript }),
  setResponseText: (responseText) => set({ responseText }),
  setErrorMessage: (errorMessage) => set({ errorMessage }),
  setIsOnline: (isOnline) =>
    set((current) => ({
      isOnline,
      state: !isOnline
        ? "offline"
        : current.state === "offline"
          ? "idle"
          : current.state,
    })),
  resetToIdle: () =>
    set({
      state: "idle",
      recordingUri: null,
      isPlayingAudio: false,
      errorMessage: null,
    }),
}));
