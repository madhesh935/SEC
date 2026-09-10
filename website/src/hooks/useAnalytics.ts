import { useQuery } from "@tanstack/react-query";
import { analyticsService } from "@/services/analytics.service";

export function useRepetitionAnalyticsQuery(patientId?: string) {
  return useQuery({
    queryKey: ["analytics-repetition", patientId],
    queryFn: () =>
      patientId ? analyticsService.getRepetitionAnalytics(patientId) : null,
    enabled: !!patientId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useDistressAnalyticsQuery(patientId?: string) {
  return useQuery({
    queryKey: ["analytics-distress", patientId],
    queryFn: () =>
      patientId ? analyticsService.getDistressAnalytics(patientId) : null,
    enabled: !!patientId,
    staleTime: 1000 * 60 * 5,
  });
}

export function usePatternAnalyticsQuery(patientId?: string) {
  return useQuery({
    queryKey: ["analytics-patterns", patientId],
    queryFn: () =>
      patientId ? analyticsService.getPatternAnalytics(patientId) : null,
    enabled: !!patientId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useStrategyEffectivenessQuery(patientId?: string) {
  return useQuery({
    queryKey: ["analytics-strategies", patientId],
    queryFn: () =>
      patientId ? analyticsService.getStrategyEffectiveness(patientId) : [],
    enabled: !!patientId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useDistressTrendQuery(patientId?: string, range: "today" | "7d" | "14d" | "30d" = "today") {
  return useQuery({
    queryKey: ["distress-trend", patientId, range],
    queryFn: () =>
      patientId ? analyticsService.getDistressTrend(patientId, range) : [],
    enabled: !!patientId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useFrequentlyRepeatedTopicsQuery(patientId?: string) {
  return useQuery({
    queryKey: ["frequent-topics", patientId],
    queryFn: () =>
      patientId ? analyticsService.getFrequentlyRepeatedTopics(patientId) : [],
    enabled: !!patientId,
    staleTime: 1000 * 60 * 2,
  });
}
