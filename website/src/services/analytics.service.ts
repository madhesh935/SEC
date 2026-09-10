import apiClient from "./api";
import {
  RepetitionAnalyticsData,
  DistressAnalyticsData,
  PatternAnalyticsData,
  StrategyEffectivenessItem,
  DistressTrendPoint,
  RepeatedTopicItem,
} from "@/types";

export const analyticsService = {
  /**
   * Fetch repetition analytics for a patient.
   */
  async getRepetitionAnalytics(
    patientId: string
  ): Promise<RepetitionAnalyticsData> {
    const response = await apiClient.get<RepetitionAnalyticsData>(
      `/api/v1/patients/${patientId}/analytics/repetition`
    );
    return response.data;
  },

  /**
   * Fetch emotion & distress analytics for a patient.
   */
  async getDistressAnalytics(
    patientId: string
  ): Promise<DistressAnalyticsData> {
    const response = await apiClient.get<DistressAnalyticsData>(
      `/api/v1/patients/${patientId}/analytics/distress`
    );
    return response.data;
  },

  /**
   * Fetch 24-hour behaviour and evening patterns.
   */
  async getPatternAnalytics(
    patientId: string
  ): Promise<PatternAnalyticsData> {
    const response = await apiClient.get<PatternAnalyticsData>(
      `/api/v1/patients/${patientId}/analytics/patterns`
    );
    return response.data;
  },

  /**
   * Fetch calming strategy effectiveness statistics.
   */
  async getStrategyEffectiveness(
    patientId: string
  ): Promise<StrategyEffectivenessItem[]> {
    const response = await apiClient.get<StrategyEffectivenessItem[]>(
      `/api/v1/patients/${patientId}/analytics/strategies`
    );
    return response.data;
  },

  /**
   * Fetch distress trend points for the overview dashboard chart.
   */
  async getDistressTrend(
    patientId: string,
    range: "today" | "7d" | "14d" | "30d" = "today"
  ): Promise<DistressTrendPoint[]> {
    const response = await apiClient.get<DistressTrendPoint[]>(
      `/api/v1/patients/${patientId}/analytics/distress-trend`,
      { params: { range } }
    );
    return response.data;
  },

  /**
   * Fetch frequently repeated topics for dashboard overview.
   */
  async getFrequentlyRepeatedTopics(
    patientId: string
  ): Promise<RepeatedTopicItem[]> {
    const response = await apiClient.get<RepeatedTopicItem[]>(
      `/api/v1/patients/${patientId}/analytics/frequent-topics`
    );
    return response.data;
  },
};
