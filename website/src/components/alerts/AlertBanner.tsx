import * as React from "react";
import { Alert, AlertSeverity } from "@/types";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/utils/cn";
import { formatRelativeTime, getSeverityBadgeInfo } from "@/utils/formatters";
import Link from "next/link";

export interface AlertBannerProps {
  alert: Alert;
  onAcknowledge?: (alertId: string) => void;
  className?: string;
}

export function AlertBanner({
  alert,
  onAcknowledge,
  className,
}: AlertBannerProps) {
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

  const containerStyles = {
    URGENT: "bg-red-50/80 border-red-200 text-red-950",
    HIGH: "bg-orange-50/80 border-orange-200 text-orange-950",
    MODERATE: "bg-amber-50/80 border-amber-200 text-amber-950",
    LOW: "bg-slate-50 border-slate-200 text-slate-900",
  }[alert.severity];

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border p-4 shadow-soft",
        containerStyles,
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{getSeverityIcon(alert.severity)}</div>
        <div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "rounded-md border px-2 py-0.5 text-xs font-semibold uppercase tracking-wider",
                badgeInfo.className
              )}
            >
              {alert.severity}
            </span>
            <span className="text-xs text-slate-500">
              {formatRelativeTime(alert.createdAt)}
            </span>
            {alert.patientName && (
              <span className="text-xs font-medium text-slate-700">
                • {alert.patientName}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm font-medium text-slate-900">
            {alert.reason}
          </p>
          {alert.context && (
            <p className="mt-0.5 text-xs text-slate-600 line-clamp-1">
              Context: {alert.context}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        {onAcknowledge && alert.status === "ACTIVE" && (
          <button
            type="button"
            onClick={() => onAcknowledge(alert.id)}
            className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            Acknowledge
          </button>
        )}
        <Link
          href={`/dashboard/alerts/${alert.id}`}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition-colors"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
