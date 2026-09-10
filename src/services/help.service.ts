import { apiClient } from './api';
import { HelpContacts, RequestHelpResponse } from '../types/help';

export const helpService = {
  async getHelpContacts(patientId: string): Promise<HelpContacts> {
    const response = await apiClient.get<HelpContacts>(`/api/v1/patients/${patientId}/help/contacts`);
    return response.data;
  },

  async requestHelp(patientId: string, reason?: string): Promise<RequestHelpResponse> {
    const response = await apiClient.post<RequestHelpResponse>(
      `/api/v1/patients/${patientId}/help`,
      { reason: reason || 'Patient requested assistance from device' }
    );
    return response.data;
  },
};
