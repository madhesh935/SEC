import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";

export interface LoadingStateProps {
  message?: string;
  className?: string;
  variant?: "fullscreen" | "card" | "inline";
}

export function LoadingState({
  message = "Loading information...",
  className,
  variant = "card",
}: LoadingStateProps) {
  if (variant === "fullscreen") {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm",
          className
        )}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 shadow-sm mb-4 animate-pulse">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>
        <p className="text-sm font-medium text-slate-700">{message}</p>
        <span className="sr-only">Loading</span>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn("flex items-center gap-2 text-slate-500 py-2", className)}
      >
        <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
        <span className="text-sm">{message}</span>
        <span className="sr-only">Loading</span>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-600 mb-3 shadow-xs">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
      <p className="text-sm font-medium text-slate-700">{message}</p>
      <p className="mt-1 text-xs text-slate-400">Fetching latest healthcare records...</p>
      <span className="sr-only">Loading content</span>
    </div>
  );
}
