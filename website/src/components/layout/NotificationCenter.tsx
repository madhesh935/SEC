"use client";

import * as React from "react";
import { useAlertsQuery, useAcknowledgeAlertMutation } from "@/hooks/useAlerts";
import { useUiStore } from "@/store/ui.store";
import { Bell, X, AlertTriangle, AlertCircle, Info, Check } from "lucide-react";
import { formatRelativeTime, getSeverityBadgeInfo } from "@/utils/formatters";
import Link from "next/link";
import { cn } from "@/utils/cn";

export function NotificationCenter() {
  const { isNotificationCenterOpen, setNotificationCenterOpen } = useUiStore();
  const { data: alerts, isLoading, isError } = useAlertsQuery({ status: "ACTIVE" });
  const acknowledgeMutation = useAcknowledgeAlertMutation();

  if (!isNotificationCenterOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-xs animate-in fade-in duration-200"
      aria-modal="true"
      role="dialog"
    >
      <div
        className="fixed inset-0"
        onClick={() => setNotificationCenterOpen(false)}
        aria-hidden="true"
      />
      <div className="relative z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl border-l border-slate-200 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Care Notifications
              </h3>
              <p className="text-xs text-slate-400">
                {alerts?.length ? `${alerts.length} active notifications` : "Active alerts & events"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setNotificationCenterOpen(false)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Close notification center"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Checking notification stream...
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
              Failed to load live notifications.
            </div>
          ) : !alerts || alerts.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Bell className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-slate-700">
                No active notifications
              </p>
              <p className="mt-1 text-xs text-slate-400 max-w-xs mx-auto">
                All patient events and alerts are acknowledged. Real-time updates will appear here.
              </p>
            </div>
          ) : (
            alerts.map((alert) => {
              const badgeInfo = getSeverityBadgeInfo(alert.severity);

              return (
                <div
                  key={alert.id}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 transition-all hover:bg-slate-50 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span
                      className={cn(
                        "rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                        badgeInfo.className
                      )}
                    >
                      {alert.severity}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {formatRelativeTime(alert.createdAt)}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-slate-800">
                    {alert.reason}
                  </p>

                  {alert.patientName && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      Patient: <span className="font-semibold">{alert.patientName}</span>
                    </p>
                  )}

                  <div className="mt-3 flex items-center justify-between border-t border-slate-200/60 pt-2.5">
                    <Link
                      href={`/dashboard/alerts/${alert.id}`}
                      onClick={() => setNotificationCenterOpen(false)}
                      className="text-xs font-semibold text-teal-700 hover:underline"
                    >
                      View Details
                    </Link>

                    <button
                      type="button"
                      onClick={() =>
                        acknowledgeMutation.mutate({ alertId: alert.id })
                      }
                      disabled={acknowledgeMutation.isPending}
                      className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <Check className="h-3 w-3 text-emerald-600" />
                      <span>Acknowledge</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 p-4 text-center">
          <Link
            href="/dashboard/alerts"
            onClick={() => setNotificationCenterOpen(false)}
            className="text-xs font-medium text-slate-600 hover:text-teal-700 transition-colors"
          >
            View All Patient Alerts & Log →
          </Link>
        </div>
      </div>
    </div>
  );
}
