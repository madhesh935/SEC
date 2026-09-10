"use client";

import * as React from "react";
import { Alert } from "@/types";
import { AlertBanner } from "@/components/alerts/AlertBanner";
import { EmptyState } from "@/components/states/EmptyState";
import { LoadingState } from "@/components/states/LoadingState";
import { BellRing } from "lucide-react";

export interface ActiveAlertsListProps {
  alerts?: Alert[];
  isLoading?: boolean;
  isError?: boolean;
  onAcknowledge?: (alertId: string) => void;
  onRetry?: () => void;
}

export function ActiveAlertsList({
  alerts,
  isLoading,
  isError,
  onAcknowledge,
  onRetry,
}: ActiveAlertsListProps) {
  if (isLoading) {
    return <LoadingState message="Loading active alerts..." />;
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 text-xs text-red-700">
        Failed to load active alerts.
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <EmptyState
        icon={BellRing}
        title="No active alerts"
        description="All patient safety checks and behaviour thresholds are currently within nominal limits."
      />
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <AlertBanner
          key={alert.id}
          alert={alert}
          onAcknowledge={onAcknowledge}
        />
      ))}
    </div>
  );
}
