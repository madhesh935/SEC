import apiClient from "./api";

export interface PairingCodeResponse {
  pairing_code: string;
  expires_at: string;
}

export interface PairingPinResponse {
  pin: string;
  expires_at: string;
}

export const pairingService = {
  /**
   * Generate a one-time, short-lived pairing code for the patient app.
   * The caregiver reads this code aloud or shows it on screen for the
   * patient device's "Pairing Code" entry screen.
   */
  async createPairingCode(patientId: string): Promise<PairingCodeResponse> {
    const response = await apiClient.post<PairingCodeResponse>(
      `/api/v1/pairing/${patientId}/code`
    );
    return response.data;
  },

  /**
   * Generate a one-time, short-lived 4-digit PIN - the "quick setup"
   * alternative to the longer pairing code, for the patient app's PIN entry.
   */
  async createPairingPin(patientId: string): Promise<PairingPinResponse> {
    const response = await apiClient.post<PairingPinResponse>(
      `/api/v1/pairing/${patientId}/pin`
    );
    return response.data;
  },
};
