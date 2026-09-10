import apiClient from "./api";
import { ConversationEvent, LiveCompanionStatus } from "@/types";

export const conversationService = {
  /**
   * Fetch recent conversation and behaviour events for a patient.
   */
  async getRecentEvents(
    patientId: string,
    limit = 10
  ): Promise<ConversationEvent[]> {
    const response = await apiClient.get<ConversationEvent[]>(
      `/api/v1/patients/${patientId}/events`,
      { params: { limit } }
    );
    return response.data;
  },

  /**
   * Fetch real-time live companion state.
   */
  async getLiveStatus(patientId: string): Promise<LiveCompanionStatus> {
    const response = await apiClient.get<LiveCompanionStatus>(
      `/api/v1/patients/${patientId}/live-status`
    );
    return response.data;
  },
};
