import * as React from "react";
import { cn } from "@/utils/cn";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface StatusBadgeProps {
  status?: string;
  variant?: "teal" | "mint" | "amber" | "red" | "slate" | "lavender";
  className?: string;
  dot?: boolean;
}

export function StatusBadge({
  status,
  variant = "teal",
  className,
  dot = true,
}: StatusBadgeProps) {
  if (!status) return <span className="text-slate-400 text-xs">—</span>;

  const variantStyles = {
    teal: {
      container: "bg-teal-50 text-teal-800 border-teal-200",
      dot: "bg-teal-600",
    },
    mint: {
      container: "bg-emerald-50 text-emerald-800 border-emerald-200",
      dot: "bg-emerald-500",
    },
    amber: {
      container: "bg-amber-50 text-amber-800 border-amber-200",
      dot: "bg-amber-500",
    },
    red: {
      container: "bg-red-50 text-red-800 border-red-200 font-semibold",
      dot: "bg-red-600",
    },
    slate: {
      container: "bg-slate-100 text-slate-700 border-slate-200",
      dot: "bg-slate-400",
    },
    lavender: {
      container: "bg-purple-50 text-purple-800 border-purple-200",
      dot: "bg-purple-500",
    },
  }[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variantStyles.container,
        className
      )}
    >
      {dot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full shrink-0", variantStyles.dot)}
          aria-hidden="true"
        />
      )}
      <span>{status}</span>
    </span>
  );
}

export interface TrendIndicatorProps {
  trend?: "up" | "down" | "neutral";
  changeValue?: string | number;
  label?: string;
  isDesirable?: "up" | "down"; // e.g. down is desirable for distress score
  className?: string;
}

export function TrendIndicator({
  trend,
  changeValue,
  label,
  isDesirable = "down",
  className,
}: TrendIndicatorProps) {
  if (!trend || changeValue === undefined || changeValue === null) {
    return null;
  }

  const isPositive =
    trend === isDesirable
      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
      : trend === "neutral"
      ? "text-slate-600 bg-slate-100 border-slate-200"
      : "text-amber-700 bg-amber-50 border-amber-200";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium",
        isPositive,
        className
      )}
    >
      {trend === "up" && <TrendingUp className="h-3 w-3" />}
      {trend === "down" && <TrendingDown className="h-3 w-3" />}
      {trend === "neutral" && <Minus className="h-3 w-3" />}
      <span>{changeValue}</span>
      {label && <span className="text-[10px] opacity-75">{label}</span>}
    </div>
  );
}
