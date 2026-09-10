import { useEffect, useState } from "react";
import { LiveCompanionStatus, Alert } from "@/types";
import { realtimeService } from "@/services/realtime.service";

export function useLiveCompanion(patientId?: string) {
  const [liveStatus, setLiveStatus] = useState<LiveCompanionStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!patientId) return;

    setIsConnected(true);
    const unsubscribe = realtimeService.subscribeToLiveStatus(
      patientId,
      (updatedStatus) => {
        setLiveStatus(updatedStatus);
      }
    );

    return () => {
      unsubscribe();
      setIsConnected(false);
    };
  }, [patientId]);

  return { liveStatus, isConnected };
}

export function useRealtimeAlerts(onAlertReceived?: (alert: Alert) => void) {
  useEffect(() => {
    const unsubscribe = realtimeService.subscribeToAlerts((alert) => {
      if (onAlertReceived) {
        onAlertReceived(alert);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [onAlertReceived]);
}
