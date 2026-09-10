"use client";

import * as React from "react";
import { useState } from "react";
import {
  Activity,
  RefreshCw,
  AlertTriangle,
  Heart,
  Clock,
  Zap,
  Info,
  ShieldAlert,
  Moon,
  Sparkles,
} from "lucide-react";
import { usePatientStore } from "@/store/patient.store";
import {
  useRepetitionAnalyticsQuery,
  useDistressAnalyticsQuery,
  usePatternAnalyticsQuery,
  useDistressTrendQuery,
  useFrequentlyRepeatedTopicsQuery,
} from "@/hooks/useAnalytics";
import { DistressTrendChart } from "@/components/dashboard/DistressTrendChart";
import { FrequentlyRepeatedTopicsList } from "@/components/dashboard/FrequentlyRepeatedTopicsList";
import {
  PageContainer,
  PageHeader,
  SectionCard,
  MetricCard,
  EmptyState,
  LoadingSkeleton,
  ErrorState,
  TabNavigation,
} from "@/components/design-system";
import { formatRelativeTime } from "@/utils/formatters";

export function Insights() {
  const selectedPatientId = usePatientStore((s) => s.selectedPatientId);
  const [activeTab, setActiveTab] = useState("Overview");
  const tabs = ["Overview", "Repetition", "Distress", "Patterns"];

  return (
    <PageContainer>
      <PageHeader
        title="Interaction Insights"
        subtitle="Objective patterns and behavioral observations derived from live companion interactions to support thoughtful care."
      />

      {/* Non-clinical disclaimer banner (Step 28 & 31) */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 text-teal-950 text-xs shadow-2xs">
        <Info className="h-4 w-4 text-teal-700 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-teal-900">
            Caregiver Advisory & Non-Clinical Notice
          </p>
          <p className="text-teal-800/90 leading-relaxed font-normal">
            These signals, emotion categories, and distress scores are AI-detected interaction patterns designed solely to assist caregivers in daily routine planning. They do not constitute a medical or clinical diagnosis.
          </p>
        </div>
      </div>

      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {!selectedPatientId ? (
        <EmptyState
          title="No patient selected"
          description="Select a patient from the top bar to inspect interaction signals, repetition trends, and calming patterns."
        />
      ) : (
        <div key={selectedPatientId} className="pt-2">
          {activeTab === "Overview" && <InsightsOverview patientId={selectedPatientId} />}
          {activeTab === "Repetition" && <RepetitionPanel patientId={selectedPatientId} />}
          {activeTab === "Distress" && <DistressPanel patientId={selectedPatientId} />}
          {activeTab === "Patterns" && <PatternsPanel patientId={selectedPatientId} />}
        </div>
      )}
    </PageContainer>
  );
}

// ─── OVERVIEW TAB (Step 29) ───────────────────────────────────────────────────

function InsightsOverview({ patientId }: { patientId: string }) {
  const [range, setRange] = useState<"today" | "7d" | "14d" | "30d">("7d");
  const distressQuery = useDistressAnalyticsQuery(patientId);
  const repetitionQuery = useRepetitionAnalyticsQuery(patientId);
  const trendQuery = useDistressTrendQuery(patientId, range);
  const topicsQuery = useFrequentlyRepeatedTopicsQuery(patientId);

  const d = distressQuery.data;
  const r = repetitionQuery.data;

  return (
    <div className="space-y-6">
      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <MetricCard
          label="Distress Score"
          value={d?.currentDistressScore != null ? `${d.currentDistressScore}/100` : (distressQuery.isLoading ? undefined : "Low")}
          subtitle="Latest observed tension"
          icon={<Activity className="h-4 w-4 text-teal-600" />}
          variant="teal"
          isLoading={distressQuery.isLoading}
          isError={distressQuery.isError}
        />
        <MetricCard
          label="Risk Level"
          value={d?.riskLevel || (distressQuery.isLoading ? undefined : "Low")}
          subtitle="Interaction stability"
          icon={<ShieldAlert className="h-4 w-4 text-emerald-600" />}
          variant={d?.riskLevel === "HIGH" ? "rose" : d?.riskLevel === "MODERATE" ? "amber" : "default"}
          isLoading={distressQuery.isLoading}
          isError={distressQuery.isError}
        />
        <MetricCard
          label="Repeated Topics"
          value={r?.totalEvents ?? (repetitionQuery.isLoading ? undefined : 0)}
          subtitle="Logged inquiries"
          icon={<RefreshCw className="h-4 w-4 text-purple-600" />}
          variant="lavender"
          isLoading={repetitionQuery.isLoading}
          isError={repetitionQuery.isError}
        />
        <MetricCard
          label="Primary Emotion"
          value={d?.emotionDistribution?.[0]?.emotion || (distressQuery.isLoading ? undefined : "Neutral")}
          subtitle="Dominant tone signal"
          icon={<Heart className="h-4 w-4 text-sky-600" />}
          variant="blue"
          isLoading={distressQuery.isLoading}
          isError={distressQuery.isError}
        />
      </div>

      {/* Trend & Topics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <DistressTrendChart
            data={trendQuery.data}
            isLoading={trendQuery.isLoading}
            isError={trendQuery.isError}
            onRetry={() => void trendQuery.refetch()}
            range={range}
            onRangeChange={setRange}
          />
        </div>

        <div className="lg:col-span-5">
          <SectionCard
            title="Top Repeated Inquiries"
            subtitle="Frequently asked questions and recurring topics"
            headerIcon={<RefreshCw className="h-4 w-4" />}
            className="h-full"
          >
            <FrequentlyRepeatedTopicsList
              topics={topicsQuery.data}
              isLoading={topicsQuery.isLoading}
              isError={topicsQuery.isError}
              onRetry={() => void topicsQuery.refetch()}
            />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

// ─── REPETITION TAB (Step 30) ─────────────────────────────────────────────────

function RepetitionPanel({ patientId }: { patientId: string }) {
  const query = useRepetitionAnalyticsQuery(patientId);
  const topicsQuery = useFrequentlyRepeatedTopicsQuery(patientId);
  const d = query.data;

  if (query.isLoading) {
    return <LoadingSkeleton />;
  }

  if (query.isError || !d) {
    return (
      <ErrorState
        message="Unable to load repetition analytics data."
        onRetry={() => void query.refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <MetricCard
          label="Total Repetitions"
          value={d.totalEvents ?? 0}
          subtitle="Recorded inquiries across sessions"
          icon={<RefreshCw className="h-4 w-4 text-purple-600" />}
          variant="lavender"
        />
        <MetricCard
          label="Average Per Topic"
          value={d.averagePerTopic != null ? d.averagePerTopic.toFixed(1) : "1.0"}
          subtitle="Mean repetitions per theme"
          icon={<Activity className="h-4 w-4 text-teal-600" />}
          variant="teal"
        />
        <MetricCard
          label="Effective Strategies"
          value={d.strategiesWithReducedDistress?.length ?? 0}
          subtitle="Observed to de-escalate anxiety"
          icon={<Zap className="h-4 w-4 text-emerald-600" />}
          variant="default"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Repeated Topics Table */}
        <div className="lg:col-span-7">
          <SectionCard
            title="Frequent Inquiry Topics"
            subtitle="Semantic clustering of recurring questions"
            headerIcon={<RefreshCw className="h-4 w-4" />}
          >
            {topicsQuery.isLoading ? (
              <div className="space-y-3 animate-pulse py-2">
                <div className="h-12 bg-slate-100 rounded-xl" />
                <div className="h-12 bg-slate-100 rounded-xl" />
              </div>
            ) : topicsQuery.data && topicsQuery.data.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {topicsQuery.data.map((t) => (
                  <div key={t.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {t.topic}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Last observed: {formatRelativeTime(t.lastOccurred)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-200/80 text-xs font-semibold">
                        {t.count} inquiries
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">
                No repeated topics recorded yet.
              </p>
            )}
          </SectionCard>
        </div>

        {/* Strategies that reduced distress */}
        <div className="lg:col-span-5">
          <SectionCard
            title="Calming Strategies Observed"
            subtitle="Techniques correlated with reduced repetition tension"
            headerIcon={<Sparkles className="h-4 w-4" />}
          >
            {d.strategiesWithReducedDistress && d.strategiesWithReducedDistress.length > 0 ? (
              <div className="space-y-3">
                {d.strategiesWithReducedDistress.map((strategy) => (
                  <div
                    key={strategy}
                    className="p-3.5 rounded-xl border border-teal-200/70 bg-teal-50/30 flex items-center gap-3"
                  >
                    <div className="h-8 w-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-900">
                        {strategy}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Observed to calm repeated inquiries
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">
                No strategy effectiveness data available yet.
              </p>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

// ─── DISTRESS TAB (Step 31) ───────────────────────────────────────────────────

function DistressPanel({ patientId }: { patientId: string }) {
  const [range, setRange] = useState<"today" | "7d" | "14d" | "30d">("7d");
  const query = useDistressAnalyticsQuery(patientId);
  const trendQuery = useDistressTrendQuery(patientId, range);
  const d = query.data;

  if (query.isLoading) {
    return <LoadingSkeleton />;
  }

  if (query.isError || !d) {
    return (
      <ErrorState
        message="Unable to load distress analytics data."
        onRetry={() => void query.refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* 4 Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <MetricCard
          label="Distress Score"
          value={d.currentDistressScore != null ? `${d.currentDistressScore}/100` : "Low"}
          subtitle="Interaction tension metric"
          icon={<Activity className="h-4 w-4 text-teal-600" />}
          variant="teal"
        />
        <MetricCard
          label="Risk Tier"
          value={d.riskLevel || "LOW"}
          subtitle="Non-clinical classification"
          icon={<ShieldAlert className="h-4 w-4 text-amber-600" />}
          variant={d.riskLevel === "HIGH" ? "rose" : d.riskLevel === "MODERATE" ? "amber" : "default"}
        />
        <MetricCard
          label="High-Distress Events"
          value={d.highDistressEvents?.length ?? 0}
          subtitle="Events requiring de-escalation"
          icon={<AlertTriangle className="h-4 w-4 text-rose-600" />}
          variant={d.highDistressEvents && d.highDistressEvents.length > 0 ? "rose" : "default"}
        />
        <MetricCard
          label="Dominant Emotion"
          value={d.emotionDistribution?.[0]?.emotion || "Neutral"}
          subtitle="Primary detected signal"
          icon={<Heart className="h-4 w-4 text-sky-600" />}
          variant="blue"
        />
      </div>

      {/* Trajectory Chart & Common Triggers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <DistressTrendChart
            data={trendQuery.data}
            isLoading={trendQuery.isLoading}
            isError={trendQuery.isError}
            onRetry={() => void trendQuery.refetch()}
            range={range}
            onRangeChange={setRange}
          />
        </div>

        <div className="lg:col-span-5">
          <SectionCard
            title="Identified Conversation Triggers"
            subtitle="Themes that frequently precede elevated distress"
            headerIcon={<AlertTriangle className="h-4 w-4" />}
            className="h-full"
          >
            {d.commonTriggers && d.commonTriggers.length > 0 ? (
              <div className="space-y-2.5">
                {d.commonTriggers.slice(0, 6).map((t) => (
                  <div
                    key={t.trigger}
                    className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between gap-3"
                  >
                    <span className="text-xs font-semibold text-slate-800 truncate">
                      {t.trigger}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold shrink-0">
                      {t.frequency}×
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">
                No recurring distress triggers observed yet.
              </p>
            )}
          </SectionCard>
        </div>
      </div>

      {/* Emotion Distribution */}
      {d.emotionDistribution && d.emotionDistribution.length > 0 && (
        <SectionCard
          title="Emotion Distribution"
          subtitle="Observed affective tone signals across recent conversations"
          headerIcon={<Heart className="h-4 w-4" />}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {d.emotionDistribution.map((e) => (
              <div key={e.emotion} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>{e.emotion}</span>
                  <span className="text-teal-700">{e.percentage?.toFixed(0)}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-teal-600 transition-all duration-500"
                    style={{ width: `${e.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

// ─── PATTERNS TAB (Step 32) ───────────────────────────────────────────────────

function PatternsPanel({ patientId }: { patientId: string }) {
  const query = usePatternAnalyticsQuery(patientId);
  const d = query.data;

  if (query.isLoading) {
    return <LoadingSkeleton />;
  }

  if (query.isError || !d) {
    return (
      <ErrorState
        message="Unable to load 24-hour pattern analytics data."
        onRetry={() => void query.refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Evening Distress Warning Banner */}
      {d.recurringEveningWindows && d.recurringEveningWindows.length > 0 ? (
        <div className="p-5 rounded-2xl border border-amber-300 bg-amber-50/60 shadow-2xs flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <Moon className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-950">
              Possible Recurring Evening Distress Pattern
            </h4>
            <p className="text-xs text-amber-900 leading-relaxed">
              Observed windows: <strong>{d.recurringEveningWindows.join(", ")}</strong>.
              {d.commonEveningTriggers && d.commonEveningTriggers.length > 0 && (
                <span> Common signals include: {d.commonEveningTriggers.join(", ")}.</span>
              )}
            </p>
            <p className="text-[11px] text-amber-800/80 pt-1">
              This observation represents conversational pacing and is not a clinical determination.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl border border-slate-200/80 bg-white flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <p className="text-xs text-slate-600">
            No recurring evening distress pattern detected across observed time windows.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 24-hour Hourly Heatmap */}
        <div className="lg:col-span-7">
          <SectionCard
            title="24-Hour Activity & Tension Distribution"
            subtitle="Hourly distribution of inquiries and tension signals"
            headerIcon={<Clock className="h-4 w-4" />}
          >
            {d.hourlyPatterns && d.hourlyPatterns.length > 0 ? (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 pt-2">
                {d.hourlyPatterns.map((h) => (
                  <div
                    key={h.hour}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      h.isHighRiskWindow
                        ? "bg-rose-50 border-rose-200 text-rose-900 font-bold"
                        : "bg-slate-50 border-slate-200/70 text-slate-700"
                    }`}
                  >
                    <span className="block text-xs font-semibold">{h.label}</span>
                    <span className="block text-[10px] text-slate-400 mt-1">
                      {h.repetitionCount > 0 ? `${h.repetitionCount}×` : "—"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">
                No hourly pattern data available yet.
              </p>
            )}
          </SectionCard>
        </div>

        {/* Comfort strategies observed */}
        <div className="lg:col-span-5">
          <SectionCard
            title="Comfort Strategies Observed"
            subtitle="Techniques applied during evening and elevated tension periods"
            headerIcon={<Zap className="h-4 w-4" />}
          >
            {d.comfortStrategiesUsed && d.comfortStrategiesUsed.length > 0 ? (
              <div className="space-y-3">
                {d.comfortStrategiesUsed.map((s) => (
                  <div
                    key={s.strategy}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 hover:border-slate-300 transition-all shadow-2xs"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        {s.strategy}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {s.observedChange}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold shrink-0">
                      {s.count}×
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">
                No strategy observations recorded yet.
              </p>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
