import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { alertService, AlertFilters } from "@/services/alert.service";

export const ALERTS_QUERY_KEY = ["alerts"];

export function useAlertsQuery(filters?: AlertFilters) {
  return useQuery({
    queryKey: [...ALERTS_QUERY_KEY, filters],
    queryFn: () => alertService.getAlerts(filters),
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 20000,
  });
}

export function useAlertDetailQuery(alertId?: string) {
  return useQuery({
    queryKey: ["alert", alertId],
    queryFn: () => (alertId ? alertService.getAlertById(alertId) : null),
    enabled: !!alertId,
  });
}

export function useAcknowledgeAlertMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ alertId, note }: { alertId: string; note?: string }) =>
      alertService.acknowledgeAlert(alertId, note),
    onSuccess: (updatedAlert) => {
      queryClient.invalidateQueries({ queryKey: ALERTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["alert", updatedAlert.id] });
    },
  });
}

export function useResolveAlertMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ alertId, note }: { alertId: string; note?: string }) =>
      alertService.resolveAlert(alertId, note),
    onSuccess: (updatedAlert) => {
      queryClient.invalidateQueries({ queryKey: ALERTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["alert", updatedAlert.id] });
    },
  });
}
