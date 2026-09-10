import axios from "axios";
import { z } from "zod";
import { storage } from "../utils/storage";
import { CONFIG } from "../constants/config";
import { SessionData } from "../types/session";
import { pairingSchema } from "./contracts";
const key = "gericare_device_session_v2";
const schema = pairingSchema.extend({ deviceId: z.string() });
export const sessionService = {
  async saveSession(session: SessionData): Promise<void> {
    await storage.setItem(key, JSON.stringify(schema.parse(session)));
  },
  async getSession(): Promise<SessionData | null> {
    const value = await storage.getItem(key);
    if (value) {
      const parsed = schema.safeParse(JSON.parse(value));
      return parsed.success ? parsed.data : null;
    }
    // Preserve existing native sessions during upgrade.
    const keys = CONFIG.SESSION_STORE_KEYS;
    const [accessToken, refreshToken, patientId, deviceId] = await Promise.all(
      [
        keys.ACCESS_TOKEN,
        keys.REFRESH_TOKEN,
        keys.PATIENT_ID,
        keys.DEVICE_ID,
      ].map((k) => storage.getItem(k)),
    );
    if (!accessToken || !refreshToken || !patientId || !deviceId) return null;
    const session = { accessToken, refreshToken, patientId, deviceId };
    await this.saveSession(session);
    await Promise.all(
      [keys.ACCESS_TOKEN, keys.REFRESH_TOKEN, keys.PATIENT_ID].map((k) =>
        storage.removeItem(k),
      ),
    );
    return session;
  },
  async clearSession(): Promise<void> {
    await Promise.all(
      [
        key,
        CONFIG.SESSION_STORE_KEYS.ACCESS_TOKEN,
        CONFIG.SESSION_STORE_KEYS.REFRESH_TOKEN,
        CONFIG.SESSION_STORE_KEYS.PATIENT_ID,
        "gericare_patient_name",
      ].map((k) => storage.removeItem(k)),
    );
  },
  async refreshSession(): Promise<string | null> {
    const session = await this.getSession();
    if (!session?.refreshToken) return null;
    try {
      const response = await axios.post(
        CONFIG.API_BASE_URL + "/api/v1/auth/refresh",
        { refreshToken: session.refreshToken, deviceId: session.deviceId },
        { timeout: 15000 },
      );
      const tokens = z
        .object({
          accessToken: z.string().min(1),
          refreshToken: z.string().min(1),
        })
        .parse(response.data);
      await this.saveSession({ ...session, ...tokens });
      return tokens.accessToken;
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        [401, 403].includes(error.response?.status || 0)
      )
        return null;
      throw error; // A temporary outage must not destroy a valid pairing.
    }
  },
};
