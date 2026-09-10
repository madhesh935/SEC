"use client";

import * as React from "react";
import { ConversationEvent } from "@/types";
import { formatRelativeTime } from "@/utils/formatters";
import { MessageSquare, HeartPulse, Sparkles, AlertCircle } from "lucide-react";
import { EmptyState } from "@/components/states/EmptyState";
import { LoadingState } from "@/components/states/LoadingState";

export interface RecentEventsListProps {
  events?: ConversationEvent[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export function RecentEventsList({
  events,
  isLoading,
  isError,
  onRetry,
}: RecentEventsListProps) {
  if (isLoading) {
    return <LoadingState message="Loading recent conversation events..." />;
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 text-xs text-red-700">
        Failed to load recent conversation events.
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No recent conversation events"
        description="When the patient speaks with GeriCare Live Companion, interaction signals and response strategies will be logged here."
      />
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div
          key={event.id}
          className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft transition-all hover:border-slate-300"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                <MessageSquare className="h-3.5 w-3.5" />
              </span>
              <span className="text-xs font-semibold text-slate-800">
                {event.intent || "Patient Speech"}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              {formatRelativeTime(event.createdAt)}
            </span>
          </div>

          {event.transcript && (
            <p className="text-xs text-slate-700 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              "{event.transcript}"
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
            {event.emotion && (
              <span className="rounded-md bg-sky-50 px-2 py-0.5 font-medium text-sky-800 border border-sky-200">
                Emotion: {event.emotion}
              </span>
            )}
            {event.distressScore !== undefined && (
              <span className="rounded-md bg-amber-50 px-2 py-0.5 font-medium text-amber-800 border border-amber-200">
                Distress Score: {event.distressScore}
              </span>
            )}
            {event.repetitionCount !== undefined && event.repetitionCount > 1 && (
              <span className="rounded-md bg-purple-50 px-2 py-0.5 font-medium text-purple-800 border border-purple-200">
                Repetition: #{event.repetitionCount}
              </span>
            )}
          </div>

          {event.strategy && event.strategy.length > 0 && (
            <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-500">
              <Sparkles className="h-3 w-3 text-teal-600" />
              <span>Calming Strategy: {event.strategy.join(", ")}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
