import { apiClient } from './api';
import { ComfortContent } from '../types/comfort';

export const comfortService = {
  async getComfortContent(patientId: string): Promise<ComfortContent[]> {
    const response = await apiClient.get<ComfortContent[]>(`/api/v1/patients/${patientId}/comfort`);
    return response.data;
  },
};
