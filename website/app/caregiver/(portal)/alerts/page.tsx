"use client";

import * as React from "react";
import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Bell,
  Check,
  ShieldAlert,
} from "lucide-react";
import {
  useAlertsQuery,
  useAcknowledgeAlertMutation,
  useResolveAlertMutation,
} from "@/hooks/useAlerts";
import { usePatientStore } from "@/store/patient.store";
import { Alert, AlertSeverity } from "@/types";
import {
  PageContainer,
  PageHeader,
  StatusBadge,
  EmptyState,
  LoadingSkeleton,
  ErrorState,
  TabNavigation,
} from "@/components/design-system";
import { Modal } from "@/components/ui/modal";
import { formatRelativeTime, formatDateTime } from "@/utils/formatters";

type FilterStatus = "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED" | "ALL";

export default function AlertsPage() {
  const selectedPatientId = usePatientStore((s) => s.selectedPatientId);
  const [tab, setTab] = useState<FilterStatus>("ACTIVE");
  const [filterPatientOnly, setFilterPatientOnly] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [resolvingAlert, setResolvingAlert] = useState<Alert | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");

  const tabs = ["Active", "Acknowledged", "Resolved", "All Alerts"];
  const tabToStatus: Record<string, FilterStatus> = {
    Active: "ACTIVE",
    Acknowledged: "ACKNOWLEDGED",
    Resolved: "RESOLVED",
    "All Alerts": "ALL",
  };

  const statusToTab: Record<FilterStatus, string> = {
    ACTIVE: "Active",
    ACKNOWLEDGED: "Acknowledged",
    RESOLVED: "Resolved",
    ALL: "All Alerts",
  };

  const activePatientId = filterPatientOnly ? (selectedPatientId || undefined) : undefined;
  const activeStatus = tab === "ALL" ? undefined : tab;

  const query = useAlertsQuery({
    status: activeStatus,
    patientId: activePatientId,
    severity: severityFilter === "ALL" ? undefined : (severityFilter as AlertSeverity),
  });

  const acknowledgeMutation = useAcknowledgeAlertMutation();
  const resolveMutation = useResolveAlertMutation();

  const handleAcknowledge = (alertId: string) => {
    acknowledgeMutation.mutate({ alertId });
  };

  const handleOpenResolve = (alert: Alert) => {
    setResolvingAlert(alert);
    setResolutionNote("");
  };

  const handleConfirmResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingAlert) return;
    resolveMutation.mutate(
      { alertId: resolvingAlert.id, note: resolutionNote || undefined },
      {
        onSuccess: () => setResolvingAlert(null),
      }
    );
  };

  const alerts = query.data || [];

  return (
    <PageContainer>
      <PageHeader
        title="Safety & Distress Alerts"
        subtitle="Real-time notifications of elevated distress, repetitive inquiries, or urgent help requests from patient devices."
      />

      {/* Tabs */}
      <TabNavigation
        tabs={tabs}
        activeTab={statusToTab[tab]}
        onChange={(t) => setTab(tabToStatus[t])}
      />

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
        <div className="flex items-center gap-3">
          {selectedPatientId && (
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={filterPatientOnly}
                onChange={(e) => setFilterPatientOnly(e.target.checked)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
              />
              <span>Filter to currently selected patient</span>
            </label>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold">Severity:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-medium"
          >
            <option value="ALL">All Severities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MODERATE">Moderate</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Alerts List */}
      {query.isLoading ? (
        <LoadingSkeleton />
      ) : query.isError ? (
        <ErrorState
          message="Unable to load alerts. Please check your network connection."
          onRetry={() => void query.refetch()}
        />
      ) : alerts.length === 0 ? (
        <EmptyState
          title={
            tab === "ACTIVE"
              ? "All clear"
              : `No ${tab.toLowerCase()} alerts`
          }
          description={
            tab === "ACTIVE"
              ? "There are currently no active safety alerts or urgent notices requiring attention."
              : "No alert records match the selected status and filters."
          }
          icon={<ShieldAlert className="h-6 w-6 text-emerald-600" />}
        />
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => {
            const severityConfig: Record<
              string,
              {
                border: string;
                bg: string;
                badge: "red" | "amber" | "blue";
                icon: React.ReactNode;
              }
            > = {
              URGENT: {
                border: "border-l-rose-500",
                bg: "bg-rose-50/20",
                badge: "red",
                icon: <AlertTriangle className="h-5 w-5 text-rose-600" />,
              },
              HIGH: {
                border: "border-l-amber-500",
                bg: "bg-amber-50/20",
                badge: "amber",
                icon: <AlertTriangle className="h-5 w-5 text-amber-600" />,
              },
              MODERATE: {
                border: "border-l-amber-400",
                bg: "bg-amber-50/10",
                badge: "amber",
                icon: <Bell className="h-5 w-5 text-amber-500" />,
              },
              LOW: {
                border: "border-l-sky-400",
                bg: "bg-sky-50/10",
                badge: "blue",
                icon: <Bell className="h-5 w-5 text-sky-500" />,
              },
            };

            const config = severityConfig[alert.severity] || severityConfig.LOW;

            return (
              <div
                key={alert.id}
                className={`rounded-2xl border border-slate-200/90 border-l-4 ${config.border} ${config.bg} p-5 shadow-2xs hover:shadow-xs transition-all space-y-3`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div className="mt-0.5 shrink-0">{config.icon}</div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-900">
                          {alert.reason}
                        </h3>
                        <StatusBadge
                          status={alert.severity}
                          variant={config.badge}
                          className="text-[10px] uppercase font-bold"
                        />
                        <StatusBadge
                          status={alert.status}
                          variant={
                            alert.status === "RESOLVED"
                              ? "mint"
                              : alert.status === "ACKNOWLEDGED"
                              ? "blue"
                              : "amber"
                          }
                          className="text-[10px]"
                        />
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 font-medium pt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatRelativeTime(alert.createdAt)}
                        </span>
                        <span>•</span>
                        <span>{formatDateTime(alert.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                    {alert.status === "ACTIVE" && (
                      <button
                        type="button"
                        disabled={acknowledgeMutation.isPending}
                        onClick={() => handleAcknowledge(alert.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs cursor-pointer"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Acknowledge
                      </button>
                    )}

                    {alert.status !== "RESOLVED" && (
                      <button
                        type="button"
                        onClick={() => handleOpenResolve(alert)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs cursor-pointer"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Resolve
                      </button>
                    )}
                  </div>
                </div>

                {alert.context && (
                  <div className="p-3 rounded-xl bg-white border border-slate-100 text-xs text-slate-700 leading-relaxed font-normal">
                    {alert.context}
                  </div>
                )}

                {/* History notes if acknowledged or resolved */}
                {(alert.acknowledgedAt || alert.resolvedAt) && (
                  <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                    {alert.acknowledgedAt && (
                      <span>
                        Acknowledged: {formatDateTime(alert.acknowledgedAt)}
                      </span>
                    )}
                    {alert.resolvedAt && (
                      <span>Resolved: {formatDateTime(alert.resolvedAt)}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Resolve Note Modal */}
      <Modal
        isOpen={!!resolvingAlert}
        onClose={() => setResolvingAlert(null)}
        title="Resolve Alert"
        description="Mark this alert as resolved and record any soothing steps taken."
        maxWidth="md"
      >
        <form onSubmit={handleConfirmResolve} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Resolution Note (Optional)
            </label>
            <textarea
              rows={3}
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="e.g. Spoke with patient on the phone; distress subsided after listening to favorite classical music."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setResolvingAlert(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={resolveMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs"
            >
              {resolveMutation.isPending ? "Resolving…" : "Confirm Resolution"}
            </button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}
