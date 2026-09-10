import { apiClient } from './api';
import { VoiceConversationPayload, VoiceConversationResponse } from '../types/conversation';

export const conversationService = {
  async sendVoiceConversation(payload: VoiceConversationPayload): Promise<VoiceConversationResponse> {
    const formData = new FormData();

    // Prepare audio file from local URI
    const uri = payload.audioUri;
    const filename = uri.split('/').pop() || 'recording.m4a';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `audio/${match[1]}` : 'audio/m4a';

    // React Native FormData expects an object with uri, name, type
    // @ts-expect-error React Native multipart format
    formData.append('audio', {
      uri,
      name: filename,
      type,
    });

    formData.append('patientId', payload.patientId);
    if (payload.conversationId) {
      formData.append('conversationId', payload.conversationId);
    }

    const response = await apiClient.post<VoiceConversationResponse>(
      '/api/v1/conversations/voice',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  },
};
