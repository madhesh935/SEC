"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { usePatientStore } from "@/store/patient.store";
import { useRepetitionAnalyticsQuery } from "@/hooks/useAnalytics";
import { usePatientQuery } from "@/hooks/usePatients";
import { PageHeader } from "@/components/layout/PageHeader";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ChartContainer } from "@/components/ui/chart-container";
import { DataTable, Column } from "@/components/ui/data-table";
import { RepeatedTopicItem } from "@/types";
import { LoadingState } from "@/components/states/LoadingState";
import { ErrorState } from "@/components/states/ErrorState";
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
} from "recharts";
import { Repeat, Clock, Sparkles, HelpCircle } from "lucide-react";
import { formatRelativeTime } from "@/utils/formatters";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RepetitionAnalyticsPage() {
  const params = useParams();
  const selectedId = usePatientStore(s => s.selectedPatientId);
  const patientId = (params.patientId as string) || selectedId || "";

  const { data: patient } = usePatientQuery(patientId);
  const {
    data: repetitionData,
    isLoading,
    isError,
    refetch,
  } = useRepetitionAnalyticsQuery(patientId);

  const patientName = patient
    ? patient.preferredName || patient.firstName
    : "Patient";

  if (isLoading) {
    return <LoadingState message="Loading repetition analytics..." />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Unable to load repetition analytics"
        message="Could not retrieve question frequency telemetry."
        onRetry={() => refetch()}
      />
    );
  }

  const hasTrend = repetitionData?.trend && repetitionData.trend.length > 0;
  const hasTimeBreakdown =
    repetitionData?.timeOfDayBreakdown &&
    repetitionData.timeOfDayBreakdown.length > 0;

  const topicColumns: Column<RepeatedTopicItem>[] = [
    {
      key: "topic",
      header: "Repeated Inquiry Topic",
      render: (item: RepeatedTopicItem) => (
        <span className="font-semibold text-slate-900">"{item.topic}"</span>
      ),
    },
    {
      key: "count",
      header: "Total Occurrences",
      render: (item: RepeatedTopicItem) => (
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-800">
          {item.count}
        </span>
      ),
    },
    {
      key: "lastOccurred",
      header: "Last Asked",
      render: (item: RepeatedTopicItem) => (
        <span className="text-xs text-slate-500">
          {formatRelativeTime(item.lastOccurred)}
        </span>
      ),
    },
    {
      key: "associatedStrategies",
      header: "Calming Strategies Deployed",
      render: (item: RepeatedTopicItem) => (
        <div className="flex flex-wrap gap-1">
          {item.associatedStrategies?.map((s) => (
            <span
              key={s}
              className="rounded bg-teal-50 px-2 py-0.5 text-[11px] text-teal-800 border border-teal-200"
            >
              {s}
            </span>
          )) || <span className="text-slate-400 text-xs">—</span>}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title={`${patientName}'s Repetition Analytics`}
        subtitle="Track recurring questions, time-of-day inquiry spikes, and strategies associated with lower distress."
        action={
          <Link href={`/dashboard/patients/${patientId}`}>
            <Button variant="outline" size="sm">
              Patient Profile
            </Button>
          </Link>
        }
      />

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Total Repetitive Events"
          value={repetitionData?.totalEvents}
          icon={Repeat}
          variant="teal"
          description="Inquiry repetitions flagged"
        />
        <MetricCard
          label="Avg Repetitions / Topic"
          value={
            repetitionData?.averagePerTopic !== undefined
              ? repetitionData.averagePerTopic.toFixed(1)
              : undefined
          }
          icon={Clock}
          variant="blue"
          description="Repetitions before resolution"
        />
        <MetricCard
          label="Cataloged Topics"
          value={repetitionData?.topics?.length}
          icon={HelpCircle}
          variant="lavender"
          description="Distinct questions recorded"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Repetition Trend Over Time (Line Chart) */}
        <ChartContainer
          title="Repetition Frequency Trend"
          subtitle="Observed repetition counts across recent intervals"
          isEmpty={!hasTrend}
          emptyMessage="No historical repetition trend points returned for this patient."
          height={260}
        >
          {hasTrend && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={repetitionData?.trend}
                margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#0d9488"
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: "#0d9488" }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>

        {/* Repetitions by Time of Day (Bar Chart) */}
        <ChartContainer
          title="Inquiries by Time of Day"
          subtitle="Identifies hourly windows when questions repeat most often"
          isEmpty={!hasTimeBreakdown}
          emptyMessage="No time-of-day inquiry logs returned yet."
          height={260}
        >
          {hasTimeBreakdown && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={repetitionData?.timeOfDayBreakdown}
                margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <Tooltip />
                <Bar dataKey="count" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>
      </div>

      {/* Strategies Associated with Lower Distress Afterward */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft">
        <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
          <Sparkles className="h-4 w-4 text-teal-700" />
          <h3 className="text-sm font-bold text-slate-900">
            Strategies Associated with Reduced Repetition & Distress
          </h3>
        </div>

        {repetitionData?.strategiesWithReducedDistress &&
        repetitionData.strategiesWithReducedDistress.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {repetitionData.strategiesWithReducedDistress.map((st) => (
              <span
                key={st}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 border border-emerald-200"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {st}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400">
            No calming strategy associations calculated yet. Data will accumulate as companion conversations take place.
          </p>
        )}
      </div>

      {/* Topic Breakdown Table */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-slate-900">
          Inquiry Catalog
        </h3>
        <DataTable
          columns={topicColumns}
          data={repetitionData?.topics}
          emptyTitle="No repeated questions logged"
          emptyDescription="Inquiries repeated across conversations will appear in this catalog."
        />
      </div>
    </div>
  );
}

