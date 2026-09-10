"use client";

import * as React from "react";
import { Alert, AlertSeverity } from "@/types";
import { formatRelativeTime, getSeverityBadgeInfo } from "@/utils/formatters";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  Check,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/utils/cn";

export interface AlertCardProps {
  alert: Alert;
  onAcknowledge?: (alertId: string) => void;
  onResolve?: (alertId: string) => void;
}

export function AlertCard({ alert, onAcknowledge, onResolve }: AlertCardProps) {
  const badgeInfo = getSeverityBadgeInfo(alert.severity);

  const getSeverityIcon = (severity: AlertSeverity) => {
    switch (severity) {
      case "URGENT":
        return <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />;
      case "HIGH":
        return <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0" />;
      case "MODERATE":
        return <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />;
      case "LOW":
        return <Info className="h-5 w-5 text-slate-500 shrink-0" />;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft transition-all hover:border-slate-300">
      <div className="flex items-start gap-3.5">
        <div className="mt-0.5">{getSeverityIcon(alert.severity)}</div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-md border px-2 py-0.5 text-xs font-semibold uppercase tracking-wider",
                badgeInfo.className
              )}
            >
              {alert.severity}
            </span>

            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-xs font-medium",
                alert.status === "ACTIVE"
                  ? "bg-red-50 text-red-700"
                  : alert.status === "ACKNOWLEDGED"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-emerald-50 text-emerald-700"
              )}
            >
              {alert.status}
            </span>

            <span className="text-xs text-slate-400">
              {formatRelativeTime(alert.createdAt)}
            </span>

            {alert.patientName && (
              <span className="text-xs font-semibold text-slate-700">
                • {alert.patientName}
              </span>
            )}
          </div>

          <h4 className="text-sm font-bold text-slate-900 leading-snug">
            {alert.reason}
          </h4>

          {alert.context && (
            <p className="text-xs text-slate-600 line-clamp-2">
              Context: {alert.context}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        {onAcknowledge && alert.status === "ACTIVE" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAcknowledge(alert.id)}
            className="text-xs gap-1"
          >
            <Check className="h-3.5 w-3.5 text-emerald-600" />
            <span>Acknowledge</span>
          </Button>
        )}

        <Link href={`/dashboard/alerts/${alert.id}`}>
          <Button variant="outline" size="sm" className="text-xs gap-1">
            <span>Details</span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
