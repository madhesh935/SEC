"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { usePatientQuery, usePatientLiveStatusQuery } from "@/hooks/usePatients";
import { useLiveCompanion } from "@/hooks/useRealtime";
import { PageHeader } from "@/components/layout/PageHeader";
import { PatientAvatar } from "@/components/patient/PatientAvatar";
import { LoadingState } from "@/components/states/LoadingState";
import { ErrorState } from "@/components/states/ErrorState";
import { Button } from "@/components/ui/button";
import {
  Radio,
  Sparkles,
  HeartPulse,
  Repeat,
  ShieldCheck,
  Volume2,
  BookOpen,
  MessageSquare,
  Activity,
  Wifi,
} from "lucide-react";
import { getStageBadgeInfo } from "@/utils/formatters";
import Link from "next/link";
import { cn } from "@/utils/cn";

export default function PatientLiveCompanionPage() {
  const params = useParams();
  const patientId = params.patientId as string;

  const {
    data: patient,
    isLoading: isPatientLoading,
    isError: isPatientError,
  } = usePatientQuery(patientId);

  // Polling query fallback for live status
  const {
    data: polledLiveStatus,
    isLoading: isStatusLoading,
    isError: isStatusError,
    refetch,
  } = usePatientLiveStatusQuery(patientId);

  // Real-time WebSocket/Firestore listener hook
  const { liveStatus: socketLiveStatus, isConnected } = useLiveCompanion(patientId);

  // Merge: prefer real-time socket payload if available, else polled status
  const liveStatus = socketLiveStatus || polledLiveStatus;

  if (isPatientLoading) {
    return <LoadingState message="Connecting to live companion stream..." />;
  }

  if (isPatientError) {
    return (
      <ErrorState
        title="Unable to load this patient's live companion stream."
        onRetry={() => window.location.reload()}
      />
    );
  }

  const displayName =
    patient?.preferredName || patient?.firstName || "Patient";
  const stageInfo = getStageBadgeInfo(liveStatus?.currentStage || patient?.stage);

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title={`${displayName}'s Live Companion Monitor`}
        subtitle="Real-time interpretation of conversational speech, emotional signals, distress levels, and memory redirection."
        badge={
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                liveStatus?.isActive
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              )}
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  liveStatus?.isActive
                    ? "bg-emerald-500 animate-ping"
                    : "bg-slate-400"
                )}
              />
              {liveStatus?.isActive ? "Live Session Active" : "Companion Idle"}
            </span>
          </div>
        }
        action={
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/patients/${patientId}`}>
              <Button variant="outline" size="sm">
                Patient Profile
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="text-xs"
            >
              Refresh Stream
            </Button>
          </div>
        }
      />

      {/* Fetch failed - distinct from a genuinely idle session */}
      {isStatusError && !socketLiveStatus ? (
        <ErrorState
          title="Unable to reach the live companion stream right now."
          message="Check your connection or try again - this does not necessarily mean the companion session ended."
          onRetry={() => refetch()}
        />
      ) : !liveStatus || !liveStatus.isActive ? (
        /* When no live interaction is active */
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 shadow-xs">
            <Radio className="h-8 w-8 stroke-[1.7]" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">
            No active conversation right now.
          </h3>
          <p className="mt-1.5 text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Waiting for activity... When {displayName} begins interacting with the bedside or tablet companion, live speech transcripts, emotion signals, and AI response strategies will display here in real time.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
            <Wifi className="h-4 w-4 text-teal-600" />
            <span>Companion hardware stream listener active</span>
          </div>
        </div>
      ) : (
        /* Active Live Companion Dashboard */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main 2 cols: Speech transcript & AI Response */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Patient Speech */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-teal-700" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                    Current Patient Speech
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">Live Speech to Text</span>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/60 min-h-[90px] flex items-center">
                <p className="text-base text-slate-800 font-medium italic">
                  {liveStatus.currentSpeech ? (
                    `"${liveStatus.currentSpeech}"`
                  ) : (
                    <span className="text-slate-400 not-italic text-sm">
                      Listening for speech...
                    </span>
                  )}
                </p>
              </div>

              {/* Signals bar under speech */}
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                {liveStatus.intent && (
                  <span className="rounded-md bg-sky-50 px-2.5 py-1 text-sky-800 border border-sky-200 font-medium">
                    Intent: {liveStatus.intent}
                  </span>
                )}
                {liveStatus.detectedEmotion && (
                  <span className="rounded-md bg-purple-50 px-2.5 py-1 text-purple-800 border border-purple-200 font-medium">
                    Emotion: {liveStatus.detectedEmotion}
                  </span>
                )}
                {liveStatus.repetitionCount !== undefined && liveStatus.repetitionCount > 1 && (
                  <span className="rounded-md bg-amber-50 px-2.5 py-1 text-amber-800 border border-amber-200 font-semibold">
                    Repetition Count: #{liveStatus.repetitionCount}
                  </span>
                )}
              </div>
            </div>

            {/* AI Companion Response */}
            <div className="rounded-2xl border border-teal-200/80 bg-teal-50/20 p-6 shadow-soft">
              <div className="flex items-center justify-between mb-3 border-b border-teal-100 pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-teal-700" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-teal-900">
                    AI Companion Response & Calming Speech
                  </h3>
                </div>
                <span className="text-[11px] text-teal-700 font-medium">ElevenLabs Voice Output</span>
              </div>

              <div className="rounded-xl bg-white p-4 border border-teal-200 shadow-2xs min-h-[90px] flex items-center">
                <p className="text-base text-slate-900 font-medium leading-relaxed">
                  {liveStatus.aiResponse || (
                    <span className="text-slate-400 text-sm">
                      Processing response strategy...
                    </span>
                  )}
                </p>
              </div>

              {liveStatus.selectedStrategy && (
                <div className="mt-3 flex items-center gap-2 text-xs text-teal-900">
                  <Sparkles className="h-3.5 w-3.5 text-teal-700" />
                  <span>
                    Selected Strategy:{" "}
                    <strong className="font-semibold">{liveStatus.selectedStrategy}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right 1 col: Live Cognitive & Safety Telemetry */}
          <div className="space-y-5">
            {/* Distress Meter */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Distress Score
                </span>
                <HeartPulse className="h-4 w-4 text-amber-500" />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">
                  {liveStatus.distressScore !== undefined
                    ? liveStatus.distressScore
                    : "—"}
                </span>
                <span className="text-xs text-slate-400">/ 100</span>
              </div>

              {liveStatus.distressScore !== undefined && (
                <div className="mt-3 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      liveStatus.distressScore > 70
                        ? "bg-red-500"
                        : liveStatus.distressScore > 40
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    )}
                    style={{ width: `${Math.min(liveStatus.distressScore, 100)}%` }}
                  />
                </div>
              )}
              <p className="text-[11px] text-slate-400 mt-2">
                Real-time vocal tension & acoustic distress analysis.
              </p>
            </div>

            {/* Retrieved Memory for Redirection */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4 text-teal-700" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Retrieved Memory
                </span>
              </div>

              {liveStatus.retrievedMemory ? (
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/60 text-xs text-slate-700">
                  {liveStatus.retrievedMemory}
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  No specific memory retrieved for this utterance.
                </p>
              )}
            </div>

            {/* Safety & Guardrail Status */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Safety Guardrails
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Guardrail Status:</span>
                <span className="font-semibold text-emerald-700">
                  {liveStatus.safetyStatus || "Active & Monitoring"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1.5">
                <span className="text-slate-600">Configured Stage:</span>
                <span className="font-semibold text-slate-800">
                  {stageInfo.label}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
