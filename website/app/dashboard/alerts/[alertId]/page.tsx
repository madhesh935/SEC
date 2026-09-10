"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import {
  useAlertDetailQuery,
  useAcknowledgeAlertMutation,
  useResolveAlertMutation,
} from "@/hooks/useAlerts";
import { usePatientQuery } from "@/hooks/usePatients";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingState } from "@/components/states/LoadingState";
import { ErrorState } from "@/components/states/ErrorState";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import {
  formatDateTime,
  formatRelativeTime,
  getSeverityBadgeInfo,
} from "@/utils/formatters";
import {
  CheckCircle2,
  MessageSquare,
  Clock,
  User,
  HeartHandshake,
  Check,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/utils/cn";

export default function AlertDetailPage() {
  const params = useParams();
  const alertId = params.alertId as string;

  const {
    data: alert,
    isLoading,
    isError,
    refetch,
  } = useAlertDetailQuery(alertId);

  const { data: patient } = usePatientQuery(alert?.patientId);

  const acknowledgeMutation = useAcknowledgeAlertMutation();
  const resolveMutation = useResolveAlertMutation();

  const [isResolveModalOpen, setIsResolveModalOpen] = React.useState(false);
  const [resolutionNote, setResolutionNote] = React.useState("");

  if (isLoading) {
    return <LoadingState message="Loading alert record..." />;
  }

  if (isError || !alert) {
    return (
      <ErrorState
        title="Alert not found"
        message="Unable to find this alert record. It may have been archived or removed."
        onRetry={() => refetch()}
      />
    );
  }

  const badgeInfo = getSeverityBadgeInfo(alert.severity);

  const handleAcknowledge = () => {
    acknowledgeMutation.mutate({ alertId: alert.id });
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    await resolveMutation.mutateAsync({
      alertId: alert.id,
      note: resolutionNote,
    });
    setIsResolveModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      <PageHeader
        title="Alert Details"
        subtitle={`Incident report filed ${formatRelativeTime(alert.createdAt)}`}
        action={
          <Link href="/dashboard/alerts">
            <Button variant="outline" size="sm">
              ← Back to Alerts
            </Button>
          </Link>
        }
      />

      {/* Header Summary Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "rounded-md border px-3 py-1 text-xs font-semibold uppercase tracking-wider",
                badgeInfo.className
              )}
            >
              {alert.severity} Severity
            </span>
            <span
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium",
                alert.status === "ACTIVE"
                  ? "bg-red-50 text-red-700"
                  : alert.status === "ACKNOWLEDGED"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-emerald-50 text-emerald-700"
              )}
            >
              Status: {alert.status}
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Clock className="h-4 w-4" />
            <span>{formatDateTime(alert.createdAt)}</span>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900 leading-snug">
            {alert.reason}
          </h2>
          {alert.context && (
            <div className="mt-3 rounded-xl bg-slate-50 p-4 text-xs text-slate-700 border border-slate-200/60 leading-relaxed">
              <strong className="block font-semibold text-slate-900 mb-1">
                Contextual Telemetry:
              </strong>
              {alert.context}
            </div>
          )}
        </div>

        {/* Patient Link */}
        {patient && (
          <div className="flex items-center justify-between rounded-xl bg-teal-50/50 p-3.5 border border-teal-100 text-xs">
            <div className="flex items-center gap-2.5">
              <User className="h-4 w-4 text-teal-700" />
              <span>
                Associated Patient:{" "}
                <strong className="font-semibold text-slate-900">
                  {patient.preferredName || patient.firstName}
                </strong>
              </span>
            </div>
            <Link
              href={`/dashboard/patients/${patient.id}`}
              className="font-semibold text-teal-800 hover:underline"
            >
              View Profile →
            </Link>
          </div>
        )}
      </div>

      {/* Action Buttons Toolbar (Step 21) */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft">
        <h3 className="text-sm font-bold text-slate-900 mb-3">
          Caregiver Interventions
        </h3>
        <div className="flex flex-wrap gap-3">
          {alert.status === "ACTIVE" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAcknowledge}
              isLoading={acknowledgeMutation.isPending}
              className="gap-1.5 text-xs"
            >
              <Check className="h-4 w-4 text-emerald-600" />
              <span>Acknowledge Alert</span>
            </Button>
          )}

          {alert.status !== "RESOLVED" && (
            <Button
              variant="teal"
              size="sm"
              onClick={() => setIsResolveModalOpen(true)}
              className="gap-1.5 text-xs"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Mark as Resolved</span>
            </Button>
          )}

          {patient?.id && (
            <>
              <Link href={`/dashboard/patients/${patient.id}/live`}>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <MessageSquare className="h-4 w-4 text-teal-600" />
                  <span>Contact Patient (Live Companion)</span>
                </Button>
              </Link>
              <Link href={`/dashboard/patients/${patient.id}/family`}>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <HeartHandshake className="h-4 w-4 text-sky-600" />
                  <span>Contact Family Network</span>
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Action History Log */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft space-y-4">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
          Intervention History
        </h3>
        {!alert.actionHistory || alert.actionHistory.length === 0 ? (
          <p className="text-xs text-slate-400">
            No action entries logged for this alert yet.
          </p>
        ) : (
          <div className="space-y-3">
            {alert.actionHistory.map((act) => (
              <div
                key={act.id}
                className="flex items-start justify-between rounded-xl bg-slate-50 p-3.5 text-xs border border-slate-100"
              >
                <div>
                  <span className="font-semibold text-slate-800 uppercase block">
                    {act.actionType} by {act.performedBy}
                  </span>
                  {act.note && (
                    <p className="mt-1 text-slate-600 italic">"{act.note}"</p>
                  )}
                </div>
                <span className="text-slate-400 text-[11px]">
                  {formatDateTime(act.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resolve Modal */}
      <Modal
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        title="Resolve Alert"
        description="Provide resolution notes before closing this care alert."
        maxWidth="md"
      >
        <form onSubmit={handleResolve} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Resolution Note (Optional)
            </label>
            <Textarea
              placeholder="e.g. Caregiver visited room; played garden memory song; patient calmed down and rested."
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsResolveModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="teal"
              size="sm"
              isLoading={resolveMutation.isPending}
            >
              Confirm Resolution
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
