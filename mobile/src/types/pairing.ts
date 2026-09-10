import { z } from "zod";
import { pairingSchema } from "../services/contracts";
export interface VerifyPairingRequest {
  pairingCode: string;
  deviceId: string;
}

export interface VerifyPinRequest {
  pin: string;
  deviceId: string;
}

export type PairingResponse = z.infer<typeof pairingSchema>;
