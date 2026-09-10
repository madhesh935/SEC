"use client";

import * as React from "react";
import { RepeatedTopicItem } from "@/types";
import { EmptyState } from "@/components/states/EmptyState";
import { LoadingState } from "@/components/states/LoadingState";
import { Repeat, Clock } from "lucide-react";
import { formatRelativeTime } from "@/utils/formatters";

export interface FrequentlyRepeatedTopicsListProps {
  topics?: RepeatedTopicItem[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export function FrequentlyRepeatedTopicsList({
  topics,
  isLoading,
  isError,
}: FrequentlyRepeatedTopicsListProps) {
  if (isLoading) {
    return <LoadingState message="Loading repeated topics..." />;
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 text-xs text-red-700">
        Failed to load repeated topics.
      </div>
    );
  }

  if (!topics || topics.length === 0) {
    return (
      <EmptyState
        icon={Repeat}
        title="No repeated topics identified"
        description="When repetitive inquiries (e.g. asking for relatives, time, or location) are detected in conversations, they will be cataloged here."
      />
    );
  }

  return (
    <div className="space-y-2.5">
      {topics.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-white p-3.5 shadow-2xs hover:border-slate-300 transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700 shrink-0 mt-0.5">
              <Repeat className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                "{item.topic}"
              </p>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                <Clock className="h-3 w-3" />
                <span>Last asked {formatRelativeTime(item.lastOccurred)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700 border border-slate-200">
              {item.count} times
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
