import apiClient from "./api";
import { Alert, AlertSeverity, AlertStatus } from "@/types";

export interface AlertFilters {
  status?: AlertStatus;
  severity?: AlertSeverity;
  patientId?: string;
}

export const alertService = {
  /**
   * Fetch all alerts with optional filtering.
   */
  async getAlerts(filters?: AlertFilters): Promise<Alert[]> {
    const response = await apiClient.get<Alert[]>("/api/v1/alerts", {
      params: filters,
    });
    return response.data;
  },

  /**
   * Fetch a single alert by ID.
   */
  async getAlertById(alertId: string): Promise<Alert> {
    const response = await apiClient.get<Alert>(`/api/v1/alerts/${alertId}`);
    return response.data;
  },

  /**
   * Mark an alert as acknowledged.
   */
  async acknowledgeAlert(alertId: string, note?: string): Promise<Alert> {
    const response = await apiClient.post<Alert>(
      `/api/v1/alerts/${alertId}/acknowledge`,
      { note }
    );
    return response.data;
  },

  /**
   * Mark an alert as resolved.
   */
  async resolveAlert(alertId: string, note?: string): Promise<Alert> {
    const response = await apiClient.post<Alert>(
      `/api/v1/alerts/${alertId}/resolve`,
      { note }
    );
    return response.data;
  },
};
