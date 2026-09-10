export const CONFIG = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || "",
  API_TIMEOUT_MS: 30000,
  APP_NAME: "GeriCare AI",
  SESSION_STORE_KEYS: {
    ACCESS_TOKEN: "gericare_access_token",
    REFRESH_TOKEN: "gericare_refresh_token",
    PATIENT_ID: "gericare_patient_id",
    DEVICE_ID: "gericare_device_id",
    SETTINGS: "gericare_settings",
  },
} as const;
