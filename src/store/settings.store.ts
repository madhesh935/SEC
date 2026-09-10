import { create } from 'zustand';
import { storage } from '../utils/storage';
import { CONFIG } from '../constants/config';

export type TextSizeOption = 'normal' | 'large' | 'extra-large';

interface SettingsState {
  textSize: TextSizeOption;
  voiceVolume: number;
  language: string;
  reducedMotion: boolean;
  replayVoiceResponse: boolean;

  // Actions
  setTextSize: (size: TextSizeOption) => void;
  setVoiceVolume: (volume: number) => void;
  setLanguage: (lang: string) => void;
  setReducedMotion: (reduced: boolean) => void;
  setReplayVoiceResponse: (replay: boolean) => void;
  loadSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  textSize: 'large',
  voiceVolume: 0.9,
  language: 'en',
  reducedMotion: false,
  replayVoiceResponse: true,

  setTextSize: (textSize) => {
    set({ textSize });
    storage.setItem(CONFIG.SESSION_STORE_KEYS.SETTINGS, JSON.stringify(get()));
  },

  setVoiceVolume: (voiceVolume) => {
    set({ voiceVolume });
    storage.setItem(CONFIG.SESSION_STORE_KEYS.SETTINGS, JSON.stringify(get()));
  },

  setLanguage: (language) => {
    set({ language });
    storage.setItem(CONFIG.SESSION_STORE_KEYS.SETTINGS, JSON.stringify(get()));
  },

  setReducedMotion: (reducedMotion) => {
    set({ reducedMotion });
    storage.setItem(CONFIG.SESSION_STORE_KEYS.SETTINGS, JSON.stringify(get()));
  },

  setReplayVoiceResponse: (replayVoiceResponse) => {
    set({ replayVoiceResponse });
    storage.setItem(CONFIG.SESSION_STORE_KEYS.SETTINGS, JSON.stringify(get()));
  },

  loadSettings: async () => {
    try {
      const saved = await storage.getItem(CONFIG.SESSION_STORE_KEYS.SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        set((state) => ({ ...state, ...parsed }));
      }
    } catch {
      // Use defaults
    }
  },
}));
