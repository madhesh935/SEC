import * as SecureStore from 'expo-secure-store';

export const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<boolean> {
    try {
      await SecureStore.setItemAsync(key, value);
      return true;
    } catch {
      return false;
    }
  },

  async removeItem(key: string): Promise<boolean> {
    try {
      await SecureStore.deleteItemAsync(key);
      return true;
    } catch {
      return false;
    }
  },
};
