import { apiClient } from "./api";
import {
  PatientSettings,
  recommendationSchema,
  settingsSchema,
} from "./contracts";

export const experienceService = {
  async recommendation(id: string) {
    return recommendationSchema.parse(
      (await apiClient.get(`/api/v1/patients/${id}/recommendation`)).data,
    );
  },
  async settings(id: string) {
    return settingsSchema.parse(
      (await apiClient.get(`/api/v1/patients/${id}/settings`)).data,
    );
  },
  async saveSettings(id: string, value: PatientSettings) {
    return settingsSchema.parse(
      (await apiClient.put(`/api/v1/patients/${id}/settings`, value)).data,
    );
  },
};
