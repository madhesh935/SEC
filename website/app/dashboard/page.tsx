"use client";

import * as React from "react";
import { usePatientStore } from "@/store/patient.store";
import {
  usePatientQuery,
  usePatientStatusQuery,
  usePatientsQuery,
} from "@/hooks/usePatients";
import {
  useDistressTrendQuery,
  useFrequentlyRepeatedTopicsQuery,
} from "@/hooks/useAnalytics";
import { useAlertsQuery, useAcknowledgeAlertMutation } from "@/hooks/useAlerts";
import { useQuery } from "@tanstack/react-query";
import { conversationService } from "@/services/conversation.service";
import { PageHeader } from "@/components/layout/PageHeader";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { DistressTrendChart } from "@/components/dashboard/DistressTrendChart";
import { RecentEventsList } from "@/components/dashboard/RecentEventsList";
import { ActiveAlertsList } from "@/components/dashboard/ActiveAlertsList";
import { FrequentlyRepeatedTopicsList } from "@/components/dashboard/FrequentlyRepeatedTopicsList";
import { EmptyState } from "@/components/states/EmptyState";
import { Button } from "@/components/ui/button";
import {
  Activity,
  HeartPulse,
  MessageCircle,
  Repeat,
  Moon,
  Plus,
  Users,
  Radio,
} from "lucide-react";
import Link from "next/link";
import { getStageBadgeInfo } from "@/utils/formatters";

export default function DashboardOverviewPage() {
  const { selectedPatientId, setSelectedPatientId } = usePatientStore();
  const { data: allPatients, isLoading: isPatientsLoading } = usePatientsQuery();

  // If no patient is explicitly selected, pick first available
  React.useEffect(() => {
    if (allPatients && allPatients.length > 0 && !selectedPatientId) {
      setSelectedPatientId(allPatients[0].id);
    }
  }, [allPatients, selectedPatientId, setSelectedPatientId]);

  const { data: patient, isLoading: isPatientLoading } = usePatientQuery(
    selectedPatientId || undefined
  );

  const {
    data: status,
    isLoading: isStatusLoading,
    isError: isStatusError,
  } = usePatientStatusQuery(selectedPatientId || undefined);

  const {
    data: distressTrend,
    isLoading: isTrendLoading,
    isError: isTrendError,
    refetch: refetchTrend,
  } = useDistressTrendQuery(selectedPatientId || undefined);

  const {
    data: repeatedTopics,
    isLoading: isTopicsLoading,
    isError: isTopicsError,
  } = useFrequentlyRepeatedTopicsQuery(selectedPatientId || undefined);

  const {
    data: alerts,
    isLoading: isAlertsLoading,
    isError: isAlertsError,
  } = useAlertsQuery({
    patientId: selectedPatientId || undefined,
    status: "ACTIVE",
  });

  const acknowledgeMutation = useAcknowledgeAlertMutation();

  const { data: recentEvents, isLoading: isEventsLoading } = useQuery({
    queryKey: ["recent-events", selectedPatientId],
    queryFn: () =>
      selectedPatientId
        ? conversationService.getRecentEvents(selectedPatientId, 5)
        : [],
    enabled: !!selectedPatientId,
  });

  // Zero-patient empty state
  if (!isPatientsLoading && (!allPatients || allPatients.length === 0)) {
    return (
      <div className="py-12">
        <EmptyState
          icon={Users}
          title="No patient profiles have been created yet."
          description="Create your first patient profile to begin monitoring companion interactions, memories, and behavioural trends."
          actionLabel="Create Patient"
          onAction={() => window.location.assign("/dashboard/patients/new")}
        />
      </div>
    );
  }

  const stageInfo = getStageBadgeInfo(patient?.stage);

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <PageHeader
        title={
          patient
            ? `${patient.preferredName || patient.firstName}'s Overview`
            : "Caregiver Dashboard"
        }
        subtitle={
          patient
            ? `Real-time monitoring and behavioural insights for ${patient.preferredName || patient.firstName}.`
            : "Select a patient to inspect live companion state, distress risk, and recent activity."
        }
        badge={
          patient?.stage ? (
            <span
              className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${stageInfo.className}`}
            >
              {stageInfo.label}
            </span>
          ) : undefined
        }
        action={
          <div className="flex items-center gap-3">
            {selectedPatientId && (
              <Link href={`/dashboard/patients/${selectedPatientId}/live`}>
                <Button variant="teal" size="sm" className="gap-2">
                  <Radio className="h-4 w-4" />
                  <span>Live Companion</span>
                </Button>
              </Link>
            )}
            <Link href="/dashboard/patients/new">
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                <span>New Patient</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* 5 Primary Status Cards (Step 7) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Current State */}
        <MetricCard
          label="Current State"
          value={status?.currentState}
          icon={Activity}
          variant="teal"
          description="Observable interaction state"
          isLoading={isStatusLoading}
          isError={isStatusError}
        />

        {/* 2. Distress Level */}
        <MetricCard
          label="Distress Level"
          value={status?.distressScore !== undefined ? `${status.distressScore} / 100` : undefined}
          icon={HeartPulse}
          variant="amber"
          description="AI interaction tension score"
          isLoading={isStatusLoading}
          isError={isStatusError}
        />

        {/* 3. Interactions Today */}
        <MetricCard
          label="Interactions Today"
          value={status?.interactionsToday}
          unit="sessions"
          icon={MessageCircle}
          variant="blue"
          description="Completed companion chats"
          isLoading={isStatusLoading}
          isError={isStatusError}
        />

        {/* 4. Repeated Questions */}
        <MetricCard
          label="Repeated Inquiries"
          value={status?.repeatedQuestions}
          unit="topics"
          icon={Repeat}
          variant="lavender"
          description="Repetitions flagged today"
          isLoading={isStatusLoading}
          isError={isStatusError}
        />

        {/* 5. Evening Pattern */}
        <MetricCard
          label="Evening Pattern"
          value={status?.eveningRisk}
          icon={Moon}
          variant="mint"
          description="Recurring dusk risk signal"
          isLoading={isStatusLoading}
          isError={isStatusError}
        />
      </div>

      {/* Main Grid: Distress Trend & Active Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols: Distress Trend Chart */}
        <div className="lg:col-span-2">
          <DistressTrendChart
            data={distressTrend}
            isLoading={isTrendLoading}
            isError={isTrendError}
            onRetry={() => refetchTrend()}
          />
        </div>

        {/* Right 1 col: Active Alerts */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
            <h3 className="text-base font-semibold text-slate-900">
              Active Alerts
            </h3>
            <Link
              href="/dashboard/alerts"
              className="text-xs font-semibold text-teal-700 hover:underline"
            >
              View All
            </Link>
          </div>
          <ActiveAlertsList
            alerts={alerts}
            isLoading={isAlertsLoading}
            isError={isAlertsError}
            onAcknowledge={(id) => acknowledgeMutation.mutate({ alertId: id })}
          />
        </div>
      </div>

      {/* Bottom Grid: Recent Events & Frequently Repeated Topics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Events */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
            <h3 className="text-base font-semibold text-slate-900">
              Recent Companion Events
            </h3>
            {selectedPatientId && (
              <Link
                href={`/dashboard/patients/${selectedPatientId}/live`}
                className="text-xs font-semibold text-teal-700 hover:underline"
              >
                Open Live View
              </Link>
            )}
          </div>
          <RecentEventsList
            events={recentEvents}
            isLoading={isEventsLoading}
          />
        </div>

        {/* Frequently Repeated Topics */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
            <h3 className="text-base font-semibold text-slate-900">
              Frequently Repeated Inquiries
            </h3>
            {selectedPatientId && (
              <Link
                href={`/dashboard/patients/${selectedPatientId}/repetition`}
                className="text-xs font-semibold text-teal-700 hover:underline"
              >
                Analytics Deep Dive
              </Link>
            )}
          </div>
          <FrequentlyRepeatedTopicsList
            topics={repeatedTopics}
            isLoading={isTopicsLoading}
            isError={isTopicsError}
          />
        </div>
      </div>
    </div>
  );
}
