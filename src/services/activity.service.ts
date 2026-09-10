import { apiClient } from './api';
import { ActivityItem } from '../types/activity';

export const activityService = {
  async getRecommendedActivities(patientId: string): Promise<ActivityItem[]> {
    const response = await apiClient.get<ActivityItem[]>(
      `/api/v1/patients/${patientId}/activities/recommended`
    );
    return response.data;
  },
};
