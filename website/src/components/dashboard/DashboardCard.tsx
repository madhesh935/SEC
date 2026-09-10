import * as React from "react";
import { cn } from "@/utils/cn";
import { Loader2, AlertCircle } from "lucide-react";

export interface DashboardCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  children: React.ReactNode;
}

export function DashboardCard({
  title,
  subtitle,
  action,
  isLoading = false,
  isError = false,
  errorMessage = "Unable to load data",
  onRetry,
  children,
  className,
  ...props
}: DashboardCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft transition-all",
        className
      )}
      {...props}
    >
      {(title || subtitle || action) && (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            {title && (
              <h3 className="text-base font-semibold text-slate-900 tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      {isLoading ? (
        <div className="flex h-36 items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
            <span className="text-xs">Loading data...</span>
          </div>
        </div>
      ) : isError ? (
        <div className="flex h-36 flex-col items-center justify-center rounded-xl bg-red-50/40 p-4 text-center">
          <AlertCircle className="h-5 w-5 text-red-500 mb-1.5" />
          <p className="text-xs font-medium text-slate-700">{errorMessage}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-xs font-medium text-teal-700 hover:underline"
            >
              Try again
            </button>
          )}
        </div>
      ) : (
        children
      )}
    </div>
  );
}
