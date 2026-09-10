import { pairingSchema } from "./contracts";
import { apiClient } from "./api";
import {
  PairingResponse,
  VerifyPairingRequest,
  VerifyPinRequest,
} from "../types/pairing";

export const pairingService = {
  async verifyPairing(payload: VerifyPairingRequest): Promise<PairingResponse> {
    const response = await apiClient.post<PairingResponse>(
      "/api/v1/pairing/verify",
      {
        pairingCode: payload.pairingCode.trim().toUpperCase(),
        deviceId: payload.deviceId,
      },
    );
    return pairingSchema.parse(response.data);
  },

  async verifyPin(payload: VerifyPinRequest): Promise<PairingResponse> {
    const response = await apiClient.post<PairingResponse>(
      "/api/v1/pairing/verify-pin",
      {
        pin: payload.pin.trim(),
        deviceId: payload.deviceId,
      },
    );
    return pairingSchema.parse(response.data);
  },
};
