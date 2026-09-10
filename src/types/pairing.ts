export interface VerifyPairingRequest {
  pairingCode: string;
  deviceId: string;
}

export interface VerifyPinRequest {
  pin: string;
  deviceId: string;
}

export interface PairingResponse {
  accessToken: string;
  refreshToken: string;
  patientId: string;
  patientPreferredName?: string;
}
