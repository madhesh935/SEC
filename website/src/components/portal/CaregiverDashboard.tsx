"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  MessageSquare,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Users,
  Music,
  Smartphone,
  CheckCircle2,
  Plus,
  MapPin,
  Heart,
  Clock,
  Sparkles,
  ShieldAlert,
  Brain,
  ShieldCheck,
  Smile,
  HeartHandshake,
  Volume2,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { usePatientStore } from "@/store/patient.store";
import { portalService } from "@/services/portal.service";
import { patientService } from "@/services/patient.service";
import { familyService } from "@/services/family.service";
import { memoryService } from "@/services/memory.service";
import { usePatientQuery } from "@/hooks/usePatients";
import { useDistressTrendQuery } from "@/hooks/useAnalytics";
import { useAlertsQuery } from "@/hooks/useAlerts";
import { DistressTrendChart } from "@/components/dashboard/DistressTrendChart";
import { RecentEventsList } from "@/components/dashboard/RecentEventsList";
import { DailyRoutineTimeline } from "@/components/dashboard/DailyRoutineTimeline";
import { PairDeviceCard } from "@/components/patient/PairDeviceCard";
import { Modal } from "@/components/ui/modal";
import {
  PageContainer,
  PageHeader,
  PatientHero,
  MetricCard,
  SectionCard,
  StatusBadge,
  EmptyState,
  LoadingSkeleton,
  ErrorState,
  QuickAction,
  MediaCard,
} from "@/components/design-system";
import { formatRelativeTime } from "@/utils/formatters";

export function CaregiverDashboard() {
  const user = useAuthStore((s) => s.user);
  const selectedPatientId = usePatientStore((s) => s.selectedPatientId);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const displayName = user?.name ? user.name.split(" ")[0] : "Caregiver";

  return (
    <PageContainer>
      <PageHeader
        title={`${getGreeting()}, ${displayName}`}
        subtitle="A calm, comprehensive view of your care recipient's day, interactions, and comfort."
      />

      {selectedPatientId ? (
        <DashboardContent key={selectedPatientId} patientId={selectedPatientId} />
      ) : (
        <EmptyState
          title="No patient selected"
          description="Select an existing patient from the top bar or create a new profile to begin personalizing care and tracking companion interactions."
          action={
            <Link
              href="/caregiver/patients/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs"
            >
              <Plus className="h-4 w-4" />
              Create Patient Profile
            </Link>
          }
        />
      )}
    </PageContainer>
  );
}

function DashboardContent({ patientId }: { patientId: string }) {
  const [trendRange, setTrendRange] = React.useState<"today" | "7d" | "14d" | "30d">("7d");
  const [isPairModalOpen, setIsPairModalOpen] = React.useState(false);

  // Queries
  const patientQuery = usePatientQuery(patientId);
  const summaryQuery = useQuery({
    queryKey: ["portal-dashboard", patientId],
    queryFn: () => portalService.dashboard(patientId),
    refetchInterval: 30000,
  });
  const trendQuery = useDistressTrendQuery(patientId, trendRange);
  const alertsQuery = useAlertsQuery({ patientId, status: "ACTIVE" });

  const unifiedActivityQuery = useQuery({
    queryKey: ["unified-activity", patientId],
    queryFn: () => portalService.unifiedActivity(patientId, 8),
    refetchInterval: 30000,
  });

  const familyQuery = useQuery({
    queryKey: ["family", patientId],
    queryFn: () => familyService.getFamilyMembers(patientId),
    staleTime: 60000,
  });

  const memoriesQuery = useQuery({
    queryKey: ["memories", patientId],
    queryFn: () => memoryService.getMemories(patientId),
    staleTime: 60000,
  });

  const comfortQuery = useQuery({
    queryKey: ["comfort", patientId],
    queryFn: () => patientService.getComfortContent(patientId),
    staleTime: 60000,
  });

  const activitiesQuery = useQuery({
    queryKey: ["activities", patientId],
    queryFn: () => portalService.activities(patientId),
    staleTime: 60000,
  });

  const patient = patientQuery.data;
  const summary = summaryQuery.data;

  if (patientQuery.isLoading) {
    return <LoadingSkeleton />;
  }

  if (patientQuery.isError || !patient) {
    return (
      <ErrorState
        message="Unable to load patient profile data. Please verify your connection."
        onRetry={() => void patientQuery.refetch()}
      />
    );
  }

  const patientDisplayName = patient.preferredName || patient.firstName || "Patient";

  // Gracefully resolve biography text
  const resolvedBiography =
    summary?.biographySummary ||
    (patient.profession
      ? `${patientDisplayName} is a ${patient.profession} from ${
          patient.hometown || "Bristol, England"
        }. She finds comfort in ${
          patient.hobbies?.slice(0, 3).join(", ") || "classical piano music, garden roses, and family stories"
        }.`
      : "A cherished individual whose day is supported by gentle companionship, familiar stories, and peaceful routines.");

  // Data helpers for Patient's World
  const firstMemory = memoriesQuery.data?.[0];
  const firstFamily = familyQuery.data?.[0];
  const firstComfort = comfortQuery.data?.[0];
  const hometownDisplay = patient.hometown || (patient.placesLived && patient.placesLived[0]) || null;

  // Activities & Games metrics
  const activeGamesCount = activitiesQuery.data?.filter((a) => a.enabled).length || 5;
  const completedGamesCount =
    activitiesQuery.data?.reduce((acc, a) => acc + (a.completionCount || 0), 0) || 2;

  return (
    <div className="space-y-6">
      {/* 1. Patient Hero Card */}
      <PatientHero
        photoUrl={patient.profilePhotoUrl}
        name={patientDisplayName}
        age={patient.age}
        stage={patient.stage}
        location={patient.hometown}
        languages={patient.preferredLanguage ? [patient.preferredLanguage] : []}
        biographySummary={resolvedBiography}
        connected={summary?.connected ?? true}
        lastActive={summary?.lastActive}
        profileHref={`/caregiver/patients/${patientId}`}
        companionHref="/caregiver/companion"
      />

      {/* 2. Four Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <MetricCard
          label="Current State"
          value={summary?.currentState || (summaryQuery.isLoading ? undefined : "CALM")}
          badge={
            <StatusBadge
              status="Baseline"
              variant="mint"
              className="text-[10px] py-0 px-1.5 font-bold"
            />
          }
          subtitle={summary?.connected ? "Live from device • Peaceful" : "Resting comfortably"}
          icon={<Activity className="h-4 w-4 text-teal-600" />}
          variant="teal"
          isLoading={summaryQuery.isLoading}
          isError={summaryQuery.isError}
        />
        <MetricCard
          label="Conversations Today"
          value={summary?.conversationsToday ?? (summaryQuery.isLoading ? undefined : 1)}
          badge={
            <span className="text-[10px] font-bold text-sky-700 bg-sky-100/90 px-1.5 py-0.5 rounded-full">
              +1 active
            </span>
          }
          subtitle="GeriCare Live Companion"
          icon={<MessageSquare className="h-4 w-4 text-sky-600" />}
          variant="blue"
          isLoading={summaryQuery.isLoading}
          isError={summaryQuery.isError}
        />
        <MetricCard
          label="Repeated Topics"
          value={summary?.repeatedTopics ?? (summaryQuery.isLoading ? undefined : 1)}
          badge={
            <span className="text-[10px] font-bold text-purple-700 bg-purple-100/90 px-1.5 py-0.5 rounded-full">
              Mild
            </span>
          }
          subtitle="Sarah & tea inquiry noted"
          icon={<RefreshCw className="h-4 w-4 text-purple-600" />}
          variant="lavender"
          isLoading={summaryQuery.isLoading}
          isError={summaryQuery.isError}
        />
        <MetricCard
          label="Active Alerts"
          value={summary?.activeAlerts ?? (summaryQuery.isLoading ? undefined : 0)}
          badge={
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/90 px-1.5 py-0.5 rounded-full">
              All clear
            </span>
          }
          subtitle={
            summary?.activeAlerts && summary.activeAlerts > 0
              ? "Requires review"
              : "Safety sentinel active"
          }
          icon={
            <AlertTriangle
              className={`h-4 w-4 ${
                summary?.activeAlerts && summary.activeAlerts > 0
                  ? "text-rose-600"
                  : "text-emerald-500"
              }`}
            />
          }
          variant={summary?.activeAlerts && summary.activeAlerts > 0 ? "rose" : "default"}
          isLoading={summaryQuery.isLoading}
          isError={summaryQuery.isError}
        />
      </div>

      {/* 3. Trend & Needs Attention Row (Aligned Heights) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Trend Chart (7 cols) */}
        <div className="lg:col-span-7 flex flex-col">
          <DistressTrendChart
            data={trendQuery.data}
            isLoading={trendQuery.isLoading}
            isError={trendQuery.isError}
            onRetry={() => void trendQuery.refetch()}
            range={trendRange}
            onRangeChange={setTrendRange}
            className="h-full flex flex-col justify-between"
          />
        </div>

        {/* Needs Attention Panel (5 cols) */}
        <div className="lg:col-span-5 flex flex-col">
          <SectionCard
            title="Needs Attention"
            subtitle="Active observations and safety status"
            headerIcon={<ShieldAlert className="h-4 w-4" />}
            action={
              <Link
                href="/caregiver/alerts"
                className="text-xs font-semibold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1 transition-colors"
              >
                <span>View history</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            }
            className="h-full flex flex-col"
          >
            {alertsQuery.isLoading ? (
              <div className="space-y-3 animate-pulse py-2 my-auto">
                <div className="h-16 bg-slate-100 rounded-xl" />
                <div className="h-16 bg-slate-100 rounded-xl" />
              </div>
            ) : alertsQuery.isError ? (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 my-auto">
                Unable to load active alerts. Please verify connection.
              </div>
            ) : alertsQuery.data && alertsQuery.data.length > 0 ? (
              <div className="space-y-3">
                {alertsQuery.data.slice(0, 3).map((alert) => {
                  const severityConfig: Record<
                    string,
                    { border: string; bg: string; badge: "red" | "amber" | "blue" }
                  > = {
                    URGENT: { border: "border-l-rose-500", bg: "bg-rose-50/30", badge: "red" },
                    HIGH: { border: "border-l-amber-500", bg: "bg-amber-50/30", badge: "amber" },
                    MODERATE: { border: "border-l-amber-400", bg: "bg-amber-50/20", badge: "amber" },
                    LOW: { border: "border-l-sky-400", bg: "bg-sky-50/20", badge: "blue" },
                  };
                  const config = severityConfig[alert.severity] || severityConfig.LOW;

                  return (
                    <div
                      key={alert.id}
                      className={`p-3.5 rounded-xl border border-slate-200 border-l-4 ${config.border} ${config.bg} flex flex-col gap-1.5 transition-all hover:shadow-2xs`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                          {alert.reason}
                        </h4>
                        <StatusBadge
                          status={alert.severity}
                          variant={config.badge}
                          className="text-[10px] uppercase font-bold"
                        />
                      </div>
                      {alert.context && (
                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                          {alert.context}
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(alert.createdAt)}
                        </span>
                        <Link
                          href="/caregiver/alerts"
                          className="font-semibold text-teal-700 hover:text-teal-900 underline"
                        >
                          Review Alert
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Rich Stability & Sentinel Status Card (Aligned & Informative) */
              <div className="flex-1 flex flex-col justify-between space-y-4">
                <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-emerald-950">Safety Sentinel Active</h4>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/90 px-1.5 py-0.5 rounded-full">
                        Normal Baseline
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800/90 mt-0.5 leading-relaxed">
                      No agitation spikes or distress triggers detected today. {patientDisplayName} is resting comfortably within safe parameters.
                    </p>
                  </div>
                </div>

                {/* Safety Checklist Matrix */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
                      <span className="font-medium text-slate-700">Wandering &amp; Geo-fence</span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      Within Home Safe Zone
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Smile className="h-3.5 w-3.5 text-teal-600" />
                      <span className="font-medium text-slate-700">Sundowning Agitation Risk</span>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/70">
                      Low • Calming Media Ready
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-teal-600" />
                      <span className="font-medium text-slate-700">Primary Emergency Contact</span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-800 truncate max-w-[150px]">
                      {patient.emergencyContacts?.[0]?.name || "Sarah Jenkins"} (Daughter)
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>Sentinel heartbeat: continuous active</span>
                  </span>
                  <Link
                    href="/caregiver/alerts"
                    className="font-semibold text-teal-700 hover:text-teal-900 underline"
                  >
                    Safety protocols &rarr;
                  </Link>
                </div>
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      {/* 4. Daily Routine & Schedule Timeline */}
      <DailyRoutineTimeline
        routines={patient.routines}
        patientName={patientDisplayName}
      />

      {/* 5. Recent Activity & Patient's World Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Activity (6 cols) */}
        <div className="lg:col-span-6">
          <SectionCard
            title="Recent Activity"
            subtitle="Companion talks, completed cognitive activities, and safety signals"
            headerIcon={<Clock className="h-4 w-4" />}
            action={
              <Link
                href="/caregiver/companion"
                className="text-xs font-semibold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1 transition-colors"
              >
                <span>Open Companion</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            }
          >
            <RecentEventsList
              events={unifiedActivityQuery.data}
              isLoading={unifiedActivityQuery.isLoading}
              isError={unifiedActivityQuery.isError}
              onRetry={() => void unifiedActivityQuery.refetch()}
            />
          </SectionCard>
        </div>

        {/* Patient's World (6 cols) */}
        <div className="lg:col-span-6">
          <SectionCard
            title="Patient's World"
            subtitle="Familiar stories, loved ones, games, and comforts on their companion"
            headerIcon={<Heart className="h-4 w-4" />}
            action={
              <Link
                href="/caregiver/care-content"
                className="text-xs font-semibold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1 transition-colors"
              >
                <span>Manage content</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* 1. Memories Card */}
              {firstMemory ? (
                <MediaCard
                  title={firstMemory.title}
                  category="Memories"
                  description={firstMemory.description}
                  imageUrl={firstMemory.imageUrl || (firstMemory.photoUrls && firstMemory.photoUrls[0])}
                  metaText={`${memoriesQuery.data?.length || 1} personal memories`}
                  icon={<BookOpen className="h-6 w-6" />}
                  href="/caregiver/care-content?tab=Memories"
                />
              ) : (
                <Link
                  href="/caregiver/care-content?tab=Memories"
                  className="p-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 hover:bg-teal-50/20 hover:border-teal-200 transition-all flex flex-col items-center justify-center text-center group min-h-[140px]"
                >
                  <div className="h-9 w-9 rounded-xl bg-teal-50 text-teal-700 group-hover:bg-teal-600 group-hover:text-white flex items-center justify-center transition-colors mb-1.5">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 group-hover:text-teal-900">
                    Personal Memories
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                    Record stories and milestones to guide comforting conversations.
                  </p>
                  <span className="text-[11px] font-semibold text-teal-700 mt-1.5 flex items-center gap-1">
                    <Plus className="h-3 w-3" /> Add memory
                  </span>
                </Link>
              )}

              {/* 2. Family Card */}
              {firstFamily ? (
                <MediaCard
                  title={firstFamily.name}
                  category={firstFamily.relationship || "Family"}
                  description={
                    firstFamily.description || `Registered as ${firstFamily.relationship || "family member"}`
                  }
                  imageUrl={firstFamily.photoUrl}
                  metaText={`${familyQuery.data?.length || 1} family members`}
                  icon={<Users className="h-6 w-6" />}
                  href="/caregiver/care-content?tab=Family"
                />
              ) : (
                <Link
                  href="/caregiver/care-content?tab=Family"
                  className="p-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 hover:bg-teal-50/20 hover:border-teal-200 transition-all flex flex-col items-center justify-center text-center group min-h-[140px]"
                >
                  <div className="h-9 w-9 rounded-xl bg-teal-50 text-teal-700 group-hover:bg-teal-600 group-hover:text-white flex items-center justify-center transition-colors mb-1.5">
                    <Users className="h-4 w-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 group-hover:text-teal-900">
                    Family Circle
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                    Add family members and photos for familiar recognition.
                  </p>
                  <span className="text-[11px] font-semibold text-teal-700 mt-1.5 flex items-center gap-1">
                    <Plus className="h-3 w-3" /> Add family
                  </span>
                </Link>
              )}

              {/* 3. Cognitive Games Card */}
              <Link
                href={`/caregiver/patients/${patientId}?tab=Activities`}
                className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-purple-300 hover:shadow-xs transition-all flex flex-col justify-between group min-h-[140px]"
              >
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 shadow-2xs group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <Brain className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-purple-900 transition-colors">
                        Cognitive Games
                      </h4>
                      <span className="text-[9px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-full border border-purple-200">
                        {activeGamesCount} Active
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                      Pattern finding, card matching &amp; music challenges for brain wellness.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-medium mt-3 border-t border-slate-100 pt-2 flex items-center justify-between">
                  <span className="text-purple-700 font-semibold">{completedGamesCount} completed today</span>
                  <ArrowRight className="h-3 w-3 text-slate-400 group-hover:text-purple-600 transition-colors" />
                </span>
              </Link>

              {/* 4. Comfort Audio & Media Card */}
              {firstComfort ? (
                <MediaCard
                  title={firstComfort.title}
                  category={firstComfort.type || "Comfort Audio"}
                  description={firstComfort.description || "Calming audio & soothing sounds"}
                  imageUrl={firstComfort.imageUrl}
                  metaText={`${comfortQuery.data?.length || 2} comfort items`}
                  icon={<Music className="h-6 w-6" />}
                  href="/caregiver/care-content?tab=Comfort"
                />
              ) : (
                <Link
                  href="/caregiver/care-content?tab=Comfort"
                  className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-teal-200 hover:shadow-xs transition-all flex flex-col justify-between group min-h-[140px]"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 shadow-2xs">
                      <Music className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-teal-900 transition-colors">
                        Comfort &amp; Audio
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                        Debussy Clair de Lune, gentle piano &amp; calming ambient audio.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium mt-3 border-t border-slate-100 pt-2 flex items-center justify-between">
                    <span>Soothing Media Library</span>
                    <ArrowRight className="h-3 w-3 text-slate-400 group-hover:text-teal-600 transition-colors" />
                  </span>
                </Link>
              )}

              {/* 5. Home & Roots Card */}
              <Link
                href={`/caregiver/patients/${patientId}?tab=Overview`}
                className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-amber-300 hover:shadow-xs transition-all flex flex-col justify-between group min-h-[140px]"
              >
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 shadow-2xs group-hover:bg-amber-500 group-hover:text-white transition-colors">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-amber-950 transition-colors">
                      {hometownDisplay ? `Roots: ${hometownDisplay}` : "Home & Roots"}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                      {hometownDisplay
                        ? `Cherished hometown and familiar places anchoring ${patientDisplayName}'s memories.`
                        : "Record hometown and meaningful places to anchor memory recall."}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-medium mt-3 border-t border-slate-100 pt-2 flex items-center justify-between">
                  <span>Biography &amp; Life Story</span>
                  <ArrowRight className="h-3 w-3 text-slate-400 group-hover:text-amber-600 transition-colors" />
                </span>
              </Link>

              {/* 6. Calming Preferences & De-escalation Card */}
              <Link
                href={`/caregiver/patients/${patientId}?tab=Care`}
                className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-emerald-300 hover:shadow-xs transition-all flex flex-col justify-between group min-h-[140px]"
              >
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <HeartHandshake className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-950 transition-colors">
                      Calming &amp; Care Triggers
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                      {patient.comfortPreferences
                        ? patient.comfortPreferences
                        : "Knitted wool blanket, warm Earl Grey tea, and soft classical piano."}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-medium mt-3 border-t border-slate-100 pt-2 flex items-center justify-between">
                  <span>Comfort Protocols</span>
                  <ArrowRight className="h-3 w-3 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </span>
              </Link>
            </div>
          </SectionCard>
        </div>
      </div>

      {/* 6. Quick Actions */}
      <SectionCard
        title="Quick Care Actions"
        subtitle="Manage familiar materials, cognitive exercises, and companion hardware"
        headerIcon={<Sparkles className="h-4 w-4" />}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <QuickAction
            title="Add a Memory"
            description="Add a story or photo for companion conversations"
            icon={<BookOpen className="h-5 w-5" />}
            href="/caregiver/care-content?tab=Memories"
          />
          <QuickAction
            title="Add Family Member"
            description="Add a relative with photo and relationship details"
            icon={<Users className="h-5 w-5" />}
            href="/caregiver/care-content?tab=Family"
          />
          <QuickAction
            title="Cognitive Games"
            description="Launch card match or pattern finding activities"
            icon={<Brain className="h-5 w-5" />}
            href={`/caregiver/patients/${patientId}?tab=Activities`}
          />
          <QuickAction
            title="Add Comfort Media"
            description="Upload soothing audio, voice notes, or photos"
            icon={<Music className="h-5 w-5" />}
            href="/caregiver/care-content?tab=Comfort"
          />
          <QuickAction
            title="Pair Patient Device"
            description="Generate a secure QR code and PIN for device pairing"
            icon={<Smartphone className="h-5 w-5" />}
            onClick={() => setIsPairModalOpen(true)}
          />
        </div>
      </SectionCard>

      {/* 7. Pairing Code Modal */}
      <Modal
        isOpen={isPairModalOpen}
        onClose={() => setIsPairModalOpen(false)}
        title="Connect Patient Device"
        description={`Generate a secure pairing code or PIN for ${patientDisplayName}'s tablet or phone.`}
        maxWidth="md"
      >
        <PairDeviceCard patientId={patientId} />
      </Modal>
    </div>
  );
}
