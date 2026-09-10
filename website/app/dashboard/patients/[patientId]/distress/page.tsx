"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useDistressAnalyticsQuery } from "@/hooks/useAnalytics";
import { usePatientQuery } from "@/hooks/usePatients";
import { PageHeader } from "@/components/layout/PageHeader";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ChartContainer } from "@/components/ui/chart-container";
import { LoadingState } from "@/components/states/LoadingState";
import { ErrorState } from "@/components/states/ErrorState";
import { EmptyState } from "@/components/states/EmptyState";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  HeartPulse,
  AlertTriangle,
  Smile,
  ShieldCheck,
  Sparkles,
  Info,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/utils/formatters";

const EMOTION_COLORS = ["#14b8a6", "#38bdf8", "#a855f7", "#f59e0b", "#94a3b8"];

export default function DistressAnalyticsPage() {
  const params = useParams();
  const patientId = params.patientId as string;

  const { data: patient } = usePatientQuery(patientId);
  const {
    data: distressData,
    isLoading,
    isError,
    refetch,
  } = useDistressAnalyticsQuery(patientId);

  const patientName = patient
    ? patient.preferredName || patient.firstName
    : "Patient";

  if (isLoading) {
    return <LoadingState message="Loading emotion and distress analytics..." />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Unable to load distress analytics"
        message="Could not retrieve interaction tension signals."
        onRetry={() => refetch()}
      />
    );
  }

  const hasTrend = distressData?.trend && distressData.trend.length > 0;
  const hasEmotions =
    distressData?.emotionDistribution &&
    distressData.emotionDistribution.length > 0;
  const hasTriggers =
    distressData?.commonTriggers && distressData.commonTriggers.length > 0;

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title={`${patientName}'s Emotion & Distress Analytics`}
        subtitle="Telemetry measuring observable interaction tension, detected emotions, and calming strategy effectiveness."
        action={
          <Link href={`/dashboard/patients/${patientId}`}>
            <Button variant="outline" size="sm">
              Patient Profile
            </Button>
          </Link>
        }
      />

      {/* Crucial Non-diagnostic Healthcare Notice */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-teal-200 bg-teal-50/60 p-4 text-xs text-teal-950">
        <Info className="h-4 w-4 text-teal-700 shrink-0 mt-0.5" />
        <p>
          <strong>AI-Detected Interaction Signals Notice:</strong> Metrics on this page reflect acoustic and conversational tension indicators detected during live companion chats. They provide observational context for caregivers and do not constitute clinical or medical diagnosis.
        </p>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Current Distress Score"
          value={distressData?.currentDistressScore !== undefined ? `${distressData.currentDistressScore} / 100` : undefined}
          icon={HeartPulse}
          variant="amber"
          description="Interaction tension metric"
        />
        <MetricCard
          label="Estimated Distress Risk"
          value={distressData?.riskLevel}
          icon={AlertTriangle}
          variant={distressData?.riskLevel === "HIGH" ? "amber" : "teal"}
          description="Acoustic tension tier"
        />
        <MetricCard
          label="Identified Triggers"
          value={distressData?.commonTriggers?.length}
          icon={Sparkles}
          variant="blue"
          description="Conversational agitation factors"
        />
      </div>

      {/* Charts: Distress Trend & Emotion Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols: Distress Trend */}
        <div className="lg:col-span-2">
          <ChartContainer
            title="Distress Signal Trajectory"
            subtitle="Tension scores mapped across conversational intervals"
            isEmpty={!hasTrend}
            emptyMessage="No distress observation points recorded yet."
            height={280}
          >
            {hasTrend && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={distressData?.trend}
                  margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="timeLabel"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={{ stroke: "#e2e8f0" }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={{ stroke: "#e2e8f0" }}
                  />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="distressScore"
                    stroke="#ea580c"
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: "#ea580c" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartContainer>
        </div>

        {/* Right 1 col: Emotion Distribution Donut */}
        <div>
          <ChartContainer
            title="Emotion Distribution"
            subtitle="Detected emotional tone percentages"
            isEmpty={!hasEmotions}
            emptyMessage="No emotion classifications logged yet."
            height={280}
          >
            {hasEmotions && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distressData?.emotionDistribution}
                    dataKey="percentage"
                    nameKey="emotion"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {distressData?.emotionDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={EMOTION_COLORS[index % EMOTION_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartContainer>
        </div>
      </div>

      {/* Triggers and Strategies Used */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Common Triggers */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft space-y-3">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Common Conversational Triggers
          </h3>
          {!hasTriggers ? (
            <p className="text-xs text-slate-400">
              No recurrent agitation triggers detected.
            </p>
          ) : (
            <div className="space-y-2">
              {distressData?.commonTriggers.map((t, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs"
                >
                  <span className="font-semibold text-slate-800">
                    {t.trigger}
                  </span>
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                    {t.frequency} instances
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Response Strategies Used */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft space-y-3">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Response Strategies Deployed
          </h3>
          {!distressData?.strategiesUsed ||
          distressData.strategiesUsed.length === 0 ? (
            <p className="text-xs text-slate-400">
              No response strategy logs recorded yet.
            </p>
          ) : (
            <div className="space-y-2">
              {distressData.strategiesUsed.map((s, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl bg-teal-50/50 border border-teal-100 p-3 text-xs"
                >
                  <span className="font-semibold text-teal-900">
                    {s.strategy}
                  </span>
                  <span className="text-teal-700 font-medium">
                    Used {s.count} times
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
