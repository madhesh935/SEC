import * as React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
  variant?: "card" | "inline" | "banner";
}

export function ErrorState({
  title = "We couldn't load this information right now.",
  message = "Please check your network connection or verify that the GeriCare service is active.",
  onRetry,
  className,
  variant = "card",
}: ErrorStateProps) {
  if (variant === "inline") {
    return (
      <div
        role="alert"
        className={cn(
          "flex items-center justify-between rounded-xl border border-red-200 bg-red-50/70 p-3 text-sm text-red-800",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          <span>{title}</span>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1 font-medium text-red-700 hover:text-red-900 underline ml-3"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/30 p-8 text-center",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 mb-3 border border-red-200/60">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h4 className="text-base font-semibold text-slate-800">{title}</h4>
      {message && (
        <p className="mt-1.5 max-w-md text-sm text-slate-600 leading-relaxed">
          {message}
        </p>
      )}
      {onRetry && (
        <div className="mt-5">
          <Button variant="outline" size="sm" onClick={onRetry} className="border-red-200 hover:bg-red-50 text-red-800">
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}

export function RetryCard({
  title = "Connection Interrupted",
  message = "We couldn't load this information right now.",
  onRetry,
  className,
}: {
  title?: string;
  message?: string;
  onRetry: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft flex items-center justify-between gap-4",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200 shrink-0">
          <AlertCircle className="h-5 w-5" />
        </div>
        <div>
          <h5 className="text-sm font-semibold text-slate-900">{title}</h5>
          <p className="text-xs text-slate-500 mt-0.5">{message}</p>
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
        Try Again
      </Button>
    </div>
  );
}
