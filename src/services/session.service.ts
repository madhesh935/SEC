import { storage } from '../utils/storage';
import { CONFIG } from '../constants/config';
import { SessionData } from '../types/session';

export const sessionService = {
  async saveSession(session: SessionData): Promise<void> {
    await Promise.all([
      storage.setItem(CONFIG.SESSION_STORE_KEYS.ACCESS_TOKEN, session.accessToken),
      session.refreshToken
        ? storage.setItem(CONFIG.SESSION_STORE_KEYS.REFRESH_TOKEN, session.refreshToken)
        : Promise.resolve(true),
      storage.setItem(CONFIG.SESSION_STORE_KEYS.PATIENT_ID, session.patientId),
      storage.setItem(CONFIG.SESSION_STORE_KEYS.DEVICE_ID, session.deviceId),
      session.patientPreferredName
        ? storage.setItem('gericare_patient_name', session.patientPreferredName)
        : Promise.resolve(true),
    ]);
  },

  async getSession(): Promise<SessionData | null> {
    const [accessToken, refreshToken, patientId, deviceId, patientPreferredName] = await Promise.all([
      storage.getItem(CONFIG.SESSION_STORE_KEYS.ACCESS_TOKEN),
      storage.getItem(CONFIG.SESSION_STORE_KEYS.REFRESH_TOKEN),
      storage.getItem(CONFIG.SESSION_STORE_KEYS.PATIENT_ID),
      storage.getItem(CONFIG.SESSION_STORE_KEYS.DEVICE_ID),
      storage.getItem('gericare_patient_name'),
    ]);

    if (!accessToken || !patientId || !deviceId) {
      return null;
    }

    return {
      accessToken,
      refreshToken: refreshToken ?? undefined,
      patientId,
      deviceId,
      patientPreferredName: patientPreferredName ?? undefined,
    };
  },

  async clearSession(): Promise<void> {
    await Promise.all([
      storage.removeItem(CONFIG.SESSION_STORE_KEYS.ACCESS_TOKEN),
      storage.removeItem(CONFIG.SESSION_STORE_KEYS.REFRESH_TOKEN),
      storage.removeItem(CONFIG.SESSION_STORE_KEYS.PATIENT_ID),
      storage.removeItem('gericare_patient_name'),
    ]);
  },

  async refreshSession(): Promise<string | null> {
    const refreshToken = await storage.getItem(CONFIG.SESSION_STORE_KEYS.REFRESH_TOKEN);
    const deviceId = await storage.getItem(CONFIG.SESSION_STORE_KEYS.DEVICE_ID);

    if (!refreshToken || !deviceId) {
      await this.clearSession();
      return null;
    }

    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken, deviceId }),
      });

      if (!response.ok) {
        await this.clearSession();
        return null;
      }

      const data = await response.json();
      if (data.accessToken) {
        await storage.setItem(CONFIG.SESSION_STORE_KEYS.ACCESS_TOKEN, data.accessToken);
        if (data.refreshToken) {
          await storage.setItem(CONFIG.SESSION_STORE_KEYS.REFRESH_TOKEN, data.refreshToken);
        }
        return data.accessToken;
      }
      return null;
    } catch {
      return null;
    }
  },
};
