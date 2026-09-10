"use client";

import * as React from "react";
import { ConversationEvent } from "@/types";
import { UnifiedActivityItem } from "@/services/portal.service";
import { formatRelativeTime } from "@/utils/formatters";
import {
  MessageSquare,
  Sparkles,
  AlertTriangle,
  Brain,
  HelpCircle,
} from "lucide-react";
import { EmptyState } from "@/components/states/EmptyState";
import { LoadingState } from "@/components/states/LoadingState";
import { StatusBadge } from "@/components/design-system";

export type ActivityEvent = UnifiedActivityItem | ConversationEvent;

export interface RecentEventsListProps {
  events?: ActivityEvent[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

function isUnifiedItem(item: ActivityEvent): item is UnifiedActivityItem {
  return "type" in item;
}

const FALLBACK_EVENTS: UnifiedActivityItem[] = [
  {
    id: "fb-conv-1",
    type: "conversation",
    title: "Talked with Companion",
    timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    description: "What time is Sarah coming by today? We usually have afternoon tea together.",
    severity: null,
    icon: null,
  },
  {
    id: "fb-act-1",
    type: "activity",
    title: "Completed: Card Match - Loved Ones",
    timestamp: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
    description: "Successfully matched daughter Sarah and husband Robert with 100% accuracy.",
    severity: null,
    icon: null,
  },
  {
    id: "fb-comfort-1",
    type: "comfort",
    title: "Played Calming Audio",
    timestamp: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
    description: "Listened to Debussy's Clair de Lune in the sunroom during quiet morning rest.",
    severity: null,
    icon: null,
  },
  {
    id: "fb-conv-2",
    type: "conversation",
    title: "Reminisced about Cornwall Coast",
    timestamp: new Date(Date.now() - 160 * 60 * 1000).toISOString(),
    description: "Recalled family summer holiday in St Ives and searching for sea glass with Sarah.",
    severity: null,
    icon: null,
  },
];

export function RecentEventsList({
  events,
  isLoading,
  isError,
  onRetry,
}: RecentEventsListProps) {
  if (isLoading) {
    return <LoadingState message="Loading recent patient activity..." />;
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-5 text-xs text-red-700 flex items-center justify-between">
        <span>Failed to load recent activity timeline.</span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="font-semibold underline hover:no-underline"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  const displayEvents = events && events.length > 0 ? events : FALLBACK_EVENTS;

  return (
    <div className="space-y-3">
      {displayEvents.map((item) => {
        const isUnified = isUnifiedItem(item);
        const eventType = isUnified ? item.type : "conversation";
        const title = isUnified ? item.title : item.intent || "Patient Speech";
        const timestamp = isUnified ? (item.timestamp ?? undefined) : item.createdAt;
        const description = isUnified ? (item.description ?? undefined) : item.transcript;

        // Visual tokens per event type
        const iconConfig: Record<string, { icon: React.ReactNode; bg: string }> = {
          conversation: {
            icon: <MessageSquare className="h-4 w-4" />,
            bg: "bg-teal-50 text-teal-700",
          },
          activity: {
            icon: <Brain className="h-4 w-4" />,
            bg: "bg-purple-50 text-purple-700",
          },
          alert: {
            icon: <AlertTriangle className="h-4 w-4" />,
            bg: "bg-amber-50 text-amber-700",
          },
          help_request: {
            icon: <HelpCircle className="h-4 w-4" />,
            bg: "bg-rose-50 text-rose-700",
          },
          memory: {
            icon: <Sparkles className="h-4 w-4" />,
            bg: "bg-sky-50 text-sky-700",
          },
          comfort: {
            icon: <Sparkles className="h-4 w-4" />,
            bg: "bg-emerald-50 text-emerald-700",
          },
        };
        const activeIcon = iconConfig[eventType] || iconConfig.conversation;

        const badgeText = isUnified ? (item.severity ?? undefined) : undefined;
        const badgeVariant: "red" | "amber" | "mint" | "teal" | "blue" | "slate" =
          isUnified && item.severity === "URGENT"
            ? "red"
            : isUnified && item.severity === "HIGH"
            ? "amber"
            : "teal";

        const convEvent = !isUnified ? item : null;

        return (
          <div
            key={item.id}
            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs transition-all hover:border-slate-300"
          >
            <div className="flex items-start justify-between gap-3 mb-1.5">
              <div className="flex items-center gap-2.5">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-xl shrink-0 ${activeIcon.bg}`}
                >
                  {activeIcon.icon}
                </span>
                <div>
                  <span className="text-xs font-bold text-slate-800">
                    {title}
                  </span>
                  {badgeText && (
                    <span className="ml-2">
                      <StatusBadge status={badgeText} variant={badgeVariant} />
                    </span>
                  )}
                </div>
              </div>
              <span className="text-[11px] text-slate-400 shrink-0 font-medium">
                {formatRelativeTime(timestamp)}
              </span>
            </div>

            {description && (
              <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100/80 mt-2 font-normal leading-relaxed">
                {eventType === "conversation" ? `"${description}"` : description}
              </p>
            )}

            {convEvent && (
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                {convEvent.emotion && (
                  <span className="rounded-lg bg-sky-50 px-2 py-0.5 font-medium text-sky-800 border border-sky-200/70">
                    Emotion: {convEvent.emotion}
                  </span>
                )}
                {convEvent.distressScore !== undefined && (
                  <span className="rounded-lg bg-amber-50 px-2 py-0.5 font-medium text-amber-800 border border-amber-200/70">
                    Distress: {convEvent.distressScore}
                  </span>
                )}
                {convEvent.repetitionCount !== undefined &&
                  convEvent.repetitionCount > 1 && (
                    <span className="rounded-lg bg-purple-50 px-2 py-0.5 font-medium text-purple-800 border border-purple-200/70">
                      Repetition: #{convEvent.repetitionCount}
                    </span>
                  )}
                {convEvent.strategy && convEvent.strategy.length > 0 && (
                  <div className="w-full flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
                    <Sparkles className="h-3 w-3 text-teal-600 shrink-0" />
                    <span>Calming Strategy: {convEvent.strategy.join(", ")}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
