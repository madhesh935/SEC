import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
// Native tokens are encrypted. Browser previews keep credentials in memory only.
const browserMemory = new Map<string, string>();
// Remove plaintext credentials left by older web previews; never migrate them.
if (Platform.OS === "web" && typeof window !== "undefined") {
  try {
    [
      "gericare_access_token",
      "gericare_refresh_token",
      "gericare_patient_id",
      "gericare_patient_name",
      "gericare_device_session_v2",
    ].forEach((key) => window.localStorage.removeItem(key));
  } catch {
    /* Browser storage may be disabled. Sessions still stay in memory. */
  }
}
export const storage = {
  async getItem(key: string): Promise<string | null> {
    return Platform.OS === "web"
      ? (browserMemory.get(key) ?? null)
      : SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<boolean> {
    if (Platform.OS === "web") browserMemory.set(key, value);
    else await SecureStore.setItemAsync(key, value);
    return true;
  },
  async removeItem(key: string): Promise<boolean> {
    if (Platform.OS === "web") browserMemory.delete(key);
    else await SecureStore.deleteItemAsync(key);
    return true;
  },
};
