export type CompanionState =
  | 'idle'
  | 'recording'
  | 'uploading'
  | 'processing'
  | 'speaking'
  | 'comfort'
  | 'error'
  | 'offline';

export type CompanionUiMode = 'normal' | 'comfort';

export interface VoiceConversationResponse {
  conversationId: string;
  transcript: string;
  responseText: string;
  responseAudioUrl: string;
  status: string;
  uiMode: CompanionUiMode;
}

export interface VoiceConversationPayload {
  audioUri: string;
  patientId: string;
  conversationId?: string;
}
