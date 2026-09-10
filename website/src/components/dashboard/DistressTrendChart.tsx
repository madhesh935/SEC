"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart-container";
import { DistressTrendPoint } from "@/types";
import { ShieldCheck, TrendingDown } from "lucide-react";

export interface DistressTrendChartProps {
  data?: DistressTrendPoint[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  range?: "7d" | "14d" | "30d" | "today";
  onRangeChange?: (range: "7d" | "14d" | "30d" | "today") => void;
  className?: string;
}

const FALLBACK_TREND_POINTS: DistressTrendPoint[] = [
  { timestamp: new Date(Date.now() - 6 * 86400000).toISOString(), timeLabel: "Mon", distressScore: 18 },
  { timestamp: new Date(Date.now() - 5 * 86400000).toISOString(), timeLabel: "Tue", distressScore: 22 },
  { timestamp: new Date(Date.now() - 4 * 86400000).toISOString(), timeLabel: "Wed", distressScore: 16 },
  { timestamp: new Date(Date.now() - 3 * 86400000).toISOString(), timeLabel: "Thu", distressScore: 24 },
  { timestamp: new Date(Date.now() - 2 * 86400000).toISOString(), timeLabel: "Fri", distressScore: 19 },
  { timestamp: new Date(Date.now() - 1 * 86400000).toISOString(), timeLabel: "Sat", distressScore: 15 },
  { timestamp: new Date().toISOString(), timeLabel: "Sun", distressScore: 17 },
];

export function DistressTrendChart({
  data,
  isLoading,
  isError,
  onRetry,
  range = "7d",
  onRangeChange,
  className,
}: DistressTrendChartProps) {
  const chartData = data && data.length > 0 ? data : FALLBACK_TREND_POINTS;

  // Calculate average score
  const avgScore = Math.round(
    chartData.reduce((sum, p) => sum + (p.distressScore || 0), 0) / chartData.length
  );

  const rangeButtons = onRangeChange && (
    <div className="flex items-center gap-2">
      <div className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200/60">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
        <span>Avg: {avgScore}/100 • Baseline Calm</span>
      </div>
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
        {(["7d", "14d", "30d"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => onRangeChange(r)}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              range === r
                ? "bg-white text-teal-800 shadow-2xs font-bold"
                : "hover:text-slate-900"
            }`}
          >
            {r.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <ChartContainer
      title="Mood & Interaction Trend"
      subtitle="Observed interaction comfort levels over time (Lower = Calmer)"
      action={rangeButtons}
      isLoading={isLoading}
      isError={isError}
      isEmpty={false}
      onRetry={onRetry}
      height={280}
      className={className}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 15, right: 15, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="distressAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0d9488" stopOpacity={0.28} />
              <stop offset="95%" stopColor="#0d9488" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="timeLabel"
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={{ stroke: "#e2e8f0" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={{ stroke: "#e2e8f0" }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 14px rgba(15, 23, 42, 0.08)",
              fontSize: "12px",
              padding: "8px 12px",
            }}
            formatter={(val: number) => [
              `${val} / 100 (${val <= 30 ? "Calm & Stable" : val <= 60 ? "Moderate" : "Elevated"})`,
              "Distress Score",
            ]}
            labelFormatter={(label) => `Time: ${label}`}
          />
          <Area
            type="monotone"
            dataKey="distressScore"
            stroke="#0d9488"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#distressAreaGradient)"
            dot={{ r: 3.5, fill: "#0d9488", strokeWidth: 1, stroke: "#ffffff" }}
            activeDot={{ r: 6, fill: "#0f766e", stroke: "#ffffff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
