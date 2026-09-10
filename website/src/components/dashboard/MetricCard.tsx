import * as React from "react";
import { LucideIcon, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/utils/cn";
import { TrendIndicator } from "@/components/states/StatusBadge";

export interface MetricCardProps {
  label: string;
  value?: string | number | null;
  unit?: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  trendLabel?: string;
  isDesirable?: "up" | "down";
  description?: string;
  isLoading?: boolean;
  isError?: boolean;
  variant?: "teal" | "blue" | "mint" | "lavender" | "amber";
  className?: string;
}

export function MetricCard({
  label,
  value,
  unit,
  icon: Icon,
  trend,
  trendValue,
  trendLabel,
  isDesirable,
  description,
  isLoading = false,
  isError = false,
  variant = "teal",
  className,
}: MetricCardProps) {
  const iconTheme = {
    teal: "bg-teal-50 text-teal-700 border-teal-200",
    blue: "bg-sky-50 text-sky-700 border-sky-200",
    mint: "bg-emerald-50 text-emerald-700 border-emerald-200",
    lavender: "bg-purple-50 text-purple-700 border-purple-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
  }[variant];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft transition-all hover:shadow-card",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
          {label}
        </span>
        {Icon && (
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl border",
              iconTheme
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="mt-3">
        {isLoading ? (
          <div className="flex items-center gap-2 py-1">
            <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
            <span className="text-xs text-slate-400">Loading...</span>
          </div>
        ) : isError ? (
          <div className="flex items-center gap-1.5 py-1 text-slate-400">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <span className="text-xs">Unavailable</span>
          </div>
        ) : value === undefined || value === null || value === "" ? (
          <div className="py-1">
            <span className="text-xl font-medium text-slate-300">—</span>
            <span className="ml-2 text-xs text-slate-400">No data</span>
          </div>
        ) : (
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {value}
            </span>
            {unit && <span className="text-xs text-slate-500">{unit}</span>}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        {trend && trendValue ? (
          <TrendIndicator
            trend={trend}
            changeValue={trendValue}
            label={trendLabel}
            isDesirable={isDesirable}
          />
        ) : description ? (
          <span className="text-xs text-slate-500">{description}</span>
        ) : (
          <div className="h-4" />
        )}
      </div>
    </div>
  );
}
