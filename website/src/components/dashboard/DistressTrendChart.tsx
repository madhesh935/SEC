"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart-container";
import { DistressTrendPoint } from "@/types";

export interface DistressTrendChartProps {
  data?: DistressTrendPoint[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  className?: string;
}

export function DistressTrendChart({
  data,
  isLoading,
  isError,
  onRetry,
  className,
}: DistressTrendChartProps) {
  const hasData = data && data.length > 0;

  return (
    <ChartContainer
      title="Distress Signal Trend"
      subtitle="AI-detected interaction tension signals across recent time windows"
      isLoading={isLoading}
      isError={isError}
      isEmpty={!hasData}
      emptyMessage="No distress observation points recorded for this patient session yet."
      onRetry={onRetry}
      height={280}
      className={className}
    >
      {hasData && (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="timeLabel"
              tick={{ fontSize: 11, fill: "#64748b" }}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: "#64748b" }}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
                fontSize: "12px",
              }}
              formatter={(val: number) => [`${val} / 100`, "Distress Score"]}
            />
            <Line
              type="monotone"
              dataKey="distressScore"
              stroke="#0d9488"
              strokeWidth={2.5}
              dot={{ r: 3.5, fill: "#0d9488" }}
              activeDot={{ r: 6, fill: "#0f766e" }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartContainer>
  );
}
