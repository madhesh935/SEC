import * as React from "react";
import { cn } from "@/utils/cn";
import { Loader2, AlertCircle, BarChart3 } from "lucide-react";

export interface ChartContainerProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  errorMessage?: string;
  onRetry?: () => void;
  height?: number | string;
  children: React.ReactNode;
  className?: string;
}

export function ChartContainer({
  title,
  subtitle,
  action,
  isLoading = false,
  isError = false,
  isEmpty = false,
  emptyMessage = "No chart data points returned from backend.",
  errorMessage = "Unable to render chart data.",
  onRetry,
  height = 260,
  children,
  className,
}: ChartContainerProps) {
  const heightStyle = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft",
        className
      )}
    >
      {(title || subtitle || action) && (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            {title && (
              <h4 className="text-base font-semibold text-slate-900">{title}</h4>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}

      <div style={{ height: heightStyle }} className="relative w-full">
        {isLoading ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl bg-slate-50/50">
            <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
            <span className="text-xs text-slate-500">Loading chart data...</span>
          </div>
        ) : isError ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl bg-red-50/40 p-4 text-center">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <span className="text-xs font-medium text-slate-700">
              {errorMessage}
            </span>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="text-xs font-semibold text-teal-700 hover:underline mt-1"
              >
                Retry
              </button>
            )}
          </div>
        ) : isEmpty ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/30 p-4 text-center">
            <BarChart3 className="h-7 w-7 text-slate-300" />
            <span className="text-xs text-slate-500 max-w-xs leading-relaxed">
              {emptyMessage}
            </span>
          </div>
        ) : (
          <div className="h-full w-full">{children}</div>
        )}
      </div>
    </div>
  );
}
