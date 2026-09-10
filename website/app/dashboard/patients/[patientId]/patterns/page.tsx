"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import {
  usePatternAnalyticsQuery,
  useStrategyEffectivenessQuery,
} from "@/hooks/useAnalytics";
import { usePatientQuery } from "@/hooks/usePatients";
import { PageHeader } from "@/components/layout/PageHeader";
import { ChartContainer } from "@/components/ui/chart-container";
import { LoadingState } from "@/components/states/LoadingState";
import { ErrorState } from "@/components/states/ErrorState";
import { EmptyState } from "@/components/states/EmptyState";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Clock,
  Moon,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  Info,
  Music,
  Heart,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/utils/cn";

export default function EveningPatternPage() {
  const params = useParams();
  const patientId = params.patientId as string;

  const { data: patient } = usePatientQuery(patientId);

  const {
    data: patternData,
    isLoading: isPatternLoading,
    isError: isPatternError,
    refetch: refetchPattern,
  } = usePatternAnalyticsQuery(patientId);

  const {
    data: strategies,
    isLoading: isStrategiesLoading,
    isError: isStrategiesError,
  } = useStrategyEffectivenessQuery(patientId);

  const patientName = patient
    ? patient.preferredName || patient.firstName
    : "Patient";

  if (isPatternLoading || isStrategiesLoading) {
    return <LoadingState message="Loading behavioural pattern telemetry..." />;
  }

  if (isPatternError) {
    return (
      <ErrorState
        title="Unable to load pattern analytics"
        message="Could not retrieve 24-hour behavioural pattern data."
        onRetry={() => refetchPattern()}
      />
    );
  }

  const hasHourly =
    patternData?.hourlyPatterns && patternData.hourlyPatterns.length > 0;
  const hasStrategies = strategies && strategies.length > 0;

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title={`${patientName}'s Behaviour & Evening Patterns`}
        subtitle="Identifies recurring time windows with elevated distress signals and evaluates calming strategy response."
        action={
          <Link href={`/dashboard/patients/${patientId}`}>
            <Button variant="outline" size="sm">
              Patient Profile
            </Button>
          </Link>
        }
      />

      {/* Mandatory Clinical Vocabulary Guardrail Banner (Step 18) */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-950">
        <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">
            Possible Recurring Evening Distress Pattern:
          </span>
          <p className="mt-0.5 text-amber-800">
            Observation of increased evening questions or agitation is categorized as a <em>possible recurring evening distress pattern</em> to guide caregiver support. GeriCare AI does not diagnose clinical sundowning or neuropsychiatric conditions.
          </p>
        </div>
      </div>

      {/* 24-Hour Behaviour Chart */}
      <ChartContainer
        title="24-Hour Distress & Repetition Distribution"
        subtitle="Compares acoustic distress scores and repetition counts across each hour of the day"
        isEmpty={!hasHourly}
        emptyMessage="No 24-hour observation telemetry recorded yet."
        height={300}
      >
        {hasHourly && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={patternData?.hourlyPatterns}
              margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "#64748b" }}
                axisLine={{ stroke: "#e2e8f0" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#64748b" }}
                axisLine={{ stroke: "#e2e8f0" }}
              />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
              <Bar
                name="Distress Score (0-100)"
                dataKey="distressScore"
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                name="Repeated Questions"
                dataKey="repetitionCount"
                fill="#0d9488"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartContainer>

      {/* High Risk Windows & Common Triggers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recurring Windows */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Moon className="h-4 w-4 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900">
              High-Risk Recurring Windows
            </h3>
          </div>

          {!patternData?.recurringEveningWindows ||
          patternData.recurringEveningWindows.length === 0 ? (
            <p className="text-xs text-slate-400">
              No recurrent elevated risk windows identified yet.
            </p>
          ) : (
            <div className="space-y-2">
              {patternData.recurringEveningWindows.map((win, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 rounded-xl bg-purple-50 p-3 text-xs text-purple-900 border border-purple-100"
                >
                  <Clock className="h-4 w-4 text-purple-600 shrink-0" />
                  <span className="font-semibold">{win}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Common Evening Triggers */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Common Evening Triggers
            </h3>
          </div>

          {!patternData?.commonEveningTriggers ||
          patternData.commonEveningTriggers.length === 0 ? (
            <p className="text-xs text-slate-400">
              No evening triggers recorded yet.
            </p>
          ) : (
            <div className="space-y-2">
              {patternData.commonEveningTriggers.map((trig, idx) => (
                <div
                  key={idx}
                  className="rounded-xl bg-slate-50 p-3 text-xs text-slate-700 border border-slate-200/60 font-medium"
                >
                  {trig}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* STEP 19: Calming Strategy Effectiveness */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-teal-700" />
              <h3 className="text-base font-bold text-slate-900">
                Calming Strategy Effectiveness
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Observational analysis of distress changes following specific soothing interventions.
            </p>
          </div>
          <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-800 border border-teal-200">
            Differentiator Telemetry
          </span>
        </div>

        {!hasStrategies ? (
          <EmptyState
            icon={Sparkles}
            title="No strategy effectiveness records yet"
            description="As music, memory redirection, and family voice notes are triggered, observational reduction in tension will be ranked here."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {strategies.map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600 border border-slate-200">
                    {item.category}
                  </span>
                  <span className="text-xs text-slate-400">
                    Used {item.usageCount} times
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900">
                  {item.strategyName}
                </h4>

                {/* Calibrated wording: Associated with reduced distress signals */}
                <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 p-2 rounded-xl border border-emerald-200 font-medium">
                  <TrendingDown className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{item.observedChange}</span>
                </div>

                {item.confidenceScore !== undefined && (
                  <div className="text-[10px] text-slate-400">
                    Confidence data availability: {item.confidenceScore}%
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
