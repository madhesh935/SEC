import apiClient from "./api";
import { ConsentSettings } from "@/types";
import { ConsentFormData } from "@/schemas/consent.schema";

export const consentService = {
  /**
   * Fetch current consent and privacy settings for a patient.
   */
  async getConsent(patientId: string): Promise<ConsentSettings> {
    const response = await apiClient.get<ConsentSettings>(
      `/api/v1/patients/${patientId}/consent`
    );
    return response.data;
  },

  /**
   * Update consent and privacy settings.
   */
  async updateConsent(
    patientId: string,
    data: ConsentFormData
  ): Promise<ConsentSettings> {
    const response = await apiClient.put<ConsentSettings>(
      `/api/v1/patients/${patientId}/consent`,
      data
    );
    return response.data;
  },
};
