"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Radio,
  Clock,
  ShieldCheck,
  Brain,
  Heart,
  Compass,
  MessageSquare,
  Bot,
  Zap,
} from "lucide-react";
import { usePatientStore } from "@/store/patient.store";
import { usePatientQuery, usePatientLiveStatusQuery } from "@/hooks/usePatients";
import { conversationService } from "@/services/conversation.service";
import { RecentEventsList } from "@/components/dashboard/RecentEventsList";
import {
  PageContainer,
  PageHeader,
  SectionCard,
  StatusBadge,
  ConnectionBadge,
  ProfileAvatar,
  EmptyState,
  LoadingSkeleton,
  ErrorState,
} from "@/components/design-system";
import { formatRelativeTime, formatDateTime } from "@/utils/formatters";

export default function CompanionPage() {
  const selectedPatientId = usePatientStore((s) => s.selectedPatientId);

  return (
    <PageContainer>
      <PageHeader
        title="Live Companion"
        subtitle="Real-time conversational monitoring and contextual observations for your patient's device."
      />

      {selectedPatientId ? (
        <CompanionData key={selectedPatientId} patientId={selectedPatientId} />
      ) : (
        <EmptyState
          title="No patient selected"
          description="Select a patient from the top bar to view live companion interactions and contextual signals."
        />
      )}
    </PageContainer>
  );
}

function CompanionData({ patientId }: { patientId: string }) {
  const patientQuery = usePatientQuery(patientId);
  const liveStatusQuery = usePatientLiveStatusQuery(patientId);
  const eventsQuery = useQuery({
    queryKey: ["events", patientId],
    queryFn: () => conversationService.getRecentEvents(patientId, 15),
    refetchInterval: 15000,
  });

  const patient = patientQuery.data;
  const status = liveStatusQuery.data;

  if (patientQuery.isLoading) {
    return <LoadingSkeleton />;
  }

  if (patientQuery.isError || !patient) {
    return (
      <ErrorState
        message="Unable to load patient profile for live companion."
        onRetry={() => void patientQuery.refetch()}
      />
    );
  }

  const patientName = patient.preferredName || patient.firstName || "Patient";
  const isActive = status?.isActive ?? false;

  return (
    <div className="space-y-6">
      {/* Active Conversation vs Idle State (Steps 21 & 22) */}
      {isActive ? (
        /* STEP 22: ACTIVE 2-COLUMN STATE */
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 bg-emerald-50/80 border border-emerald-200/80 px-4 py-2.5 rounded-2xl">
            <div className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-bold text-emerald-900 tracking-wide uppercase">
                Live Conversation in Progress
              </span>
            </div>
            <span className="text-xs font-medium text-emerald-700">
              Session started {formatRelativeTime(status?.sessionStartedAt)}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Conversation Transcript (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <SectionCard
                title="Conversation Transcript"
                subtitle="Live voice interaction between patient and GeriCare"
                headerIcon={<Radio className="h-4 w-4" />}
              >
                <div className="space-y-4 py-1">
                  {/* Patient Speech Bubble */}
                  <div className="flex items-start gap-3">
                    <ProfileAvatar
                      src={patient.profilePhotoUrl}
                      name={patientName}
                      size="sm"
                      className="mt-0.5"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">
                          {patientName}
                        </span>
                        <span className="text-[10.5px] text-slate-400">
                          Patient Speech
                        </span>
                      </div>
                      <div className="p-4 rounded-2xl rounded-tl-sm bg-slate-100/80 border border-slate-200/70 text-slate-900 text-sm leading-relaxed">
                        {status?.currentSpeech ? (
                          <p className="font-normal italic">
                            &ldquo;{status.currentSpeech}&rdquo;
                          </p>
                        ) : (
                          <p className="text-slate-400 italic">
                            Listening for patient speech…
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* GeriCare Companion Bubble */}
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-teal-900">
                          GeriCare Companion
                        </span>
                        <span className="text-[10.5px] text-teal-700">
                          Assistant Response
                        </span>
                      </div>
                      <div className="p-4 rounded-2xl rounded-tl-sm bg-teal-50/70 border border-teal-200/70 text-slate-900 text-sm leading-relaxed">
                        {status?.aiResponse ? (
                          <p className="font-normal">{status.aiResponse}</p>
                        ) : (
                          <p className="text-teal-700/60 italic">
                            Formulating comforting response…
                          </p>
                        )}
                      </div>

                      {status?.selectedStrategy && (
                        <div className="flex items-center gap-1.5 pt-1 text-[11px] text-teal-800">
                          <Zap className="h-3 w-3 text-teal-600" />
                          <span>
                            Applied strategy: <strong>{status.selectedStrategy}</strong>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Right Column: Structured Interaction Context (5 cols) */}
            <div className="lg:col-span-5">
              <SectionCard
                title="Structured Interaction Context"
                subtitle="Real-time behavioral and interaction observations"
                headerIcon={<Brain className="h-4 w-4" />}
              >
                <div className="divide-y divide-slate-100 text-xs">
                  {/* Intent */}
                  <div className="py-3 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Intent</span>
                    <span className="font-bold text-slate-900">
                      {status?.intent || "General inquiry"}
                    </span>
                  </div>

                  {/* Emotion Signal */}
                  <div className="py-3 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Emotion Signal</span>
                    <StatusBadge
                      status={status?.detectedEmotion || "Neutral / Calm"}
                      variant="blue"
                    />
                  </div>

                  {/* Semantic Repetition */}
                  <div className="py-3 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Semantic Repetition</span>
                    {status?.repetitionCount && status.repetitionCount > 1 ? (
                      <StatusBadge
                        status={`Repeated ${status.repetitionCount} times`}
                        variant="amber"
                      />
                    ) : (
                      <span className="text-slate-600 font-medium">None detected</span>
                    )}
                  </div>

                  {/* Relevant Memory */}
                  <div className="py-3 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Relevant Memory</span>
                    <span className="font-medium text-slate-800 truncate max-w-[180px] text-right">
                      {status?.retrievedMemory || "None accessed"}
                    </span>
                  </div>

                  {/* Configured Stage */}
                  <div className="py-3 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Configured Stage</span>
                    <StatusBadge
                      status={`${(status?.currentStage || patient.stage || "EARLY").replace("_", " ")} Stage`}
                      variant="teal"
                    />
                  </div>

                  {/* Interaction Risk */}
                  <div className="py-3 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Interaction Risk</span>
                    {status?.distressScore != null ? (
                      <StatusBadge
                        status={`Score: ${status.distressScore}/100`}
                        variant={
                          status.distressScore > 65
                            ? "red"
                            : status.distressScore > 35
                            ? "amber"
                            : "mint"
                        }
                      />
                    ) : (
                      <StatusBadge status="Low risk" variant="mint" />
                    )}
                  </div>

                  {/* Selected Strategy */}
                  <div className="py-3 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Selected Strategy</span>
                    <span className="font-semibold text-teal-800">
                      {status?.selectedStrategy || "Reassurance"}
                    </span>
                  </div>

                  {/* Escalation Status */}
                  <div className="py-3 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Escalation Status</span>
                    <StatusBadge
                      status={status?.safetyStatus === "OK" || !status?.safetyStatus ? "Normal" : status.safetyStatus}
                      variant={status?.safetyStatus && status.safetyStatus !== "OK" ? "red" : "mint"}
                    />
                  </div>
                </div>
              </SectionCard>
            </div>
          </div>
        </div>
      ) : (
        /* STEP 21: POLISHED IDLE STATE */
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 sm:p-10 shadow-xs text-center space-y-5">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 shadow-2xs">
              <Radio className="h-8 w-8" />
            </div>
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <div className="flex justify-center items-center gap-2">
              <ConnectionBadge connected={true} label="Patient Device Connected" />
              <StatusBadge status={`${(patient.stage || "EARLY").replace("_", " ")} Stage`} variant="teal" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              Companion Standing By
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              No active conversation right now. The companion is online on {patientName}&apos;s device and ready for their next voice interaction.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-4 text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {status?.sessionStartedAt
                ? `Last session: ${formatDateTime(status.sessionStartedAt)}`
                : "No conversations recorded today"}
            </span>
          </div>

          {/* Context Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto pt-4 text-left border-t border-slate-100">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100/80">
              <div className="flex items-center gap-2 text-teal-700 mb-1">
                <Compass className="h-4 w-4" />
                <span className="text-xs font-bold">Natural Recall</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Connects patient speech to familiar memories and family names.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100/80">
              <div className="flex items-center gap-2 text-purple-700 mb-1">
                <Heart className="h-4 w-4" />
                <span className="text-xs font-bold">Gentle Reassurance</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                De-escalates anxiety and repetitive inquiries with patience.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100/80">
              <div className="flex items-center gap-2 text-emerald-700 mb-1">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-xs font-bold">Safety Guardrails</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Monitors distress signals and notifies caregivers if help is needed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Conversation Events History */}
      <SectionCard
        title="Recent Conversation History"
        subtitle="Chronological record of recent voice sessions, detected intents, and comforting strategies"
        headerIcon={<MessageSquare className="h-4 w-4" />}
      >
        <RecentEventsList
          events={eventsQuery.data}
          isLoading={eventsQuery.isLoading}
          isError={eventsQuery.isError}
          onRetry={() => void eventsQuery.refetch()}
        />
      </SectionCard>
    </div>
  );
}
