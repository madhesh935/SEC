import { z } from "zod";
import { conversationSchema, contextMediaSchema } from "../services/contracts";
export type CompanionState =
  | "idle"
  | "recording"
  | "uploading"
  | "processing"
  | "speaking"
  | "comfort"
  | "error"
  | "offline";
export type CompanionUiMode = "normal" | "comfort" | "caregiver_notified";
export type ContextMedia = z.infer<typeof contextMediaSchema>;
export type VoiceConversationResponse = z.infer<typeof conversationSchema>;
export interface VoiceConversationPayload {
  audioUri: string;
  patientId: string;
  conversationId?: string;
  signal?: AbortSignal;
  onUploaded?: () => void;
}
