"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { usePatientQuery } from "@/hooks/usePatients";
import { useMemoriesQuery } from "@/hooks/useMemories";
import { useQuery } from "@tanstack/react-query";
import { familyService } from "@/services/family.service";
import { consentService } from "@/services/consent.service";
import { PageHeader } from "@/components/layout/PageHeader";
import { PatientAvatar } from "@/components/patient/PatientAvatar";
import { PairDeviceCard } from "@/components/patient/PairDeviceCard";
import { LoadingState } from "@/components/states/LoadingState";
import { ErrorState } from "@/components/states/ErrorState";
import { EmptyState } from "@/components/states/EmptyState";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  getStageBadgeInfo,
  formatRelativeTime,
  formatDateOnly,
} from "@/utils/formatters";
import {
  User,
  Heart,
  BookOpen,
  Users,
  ShieldCheck,
  Radio,
  Plus,
  Edit,
  Phone,
  Sparkles,
  MapPin,
  Briefcase,
  GraduationCap,
} from "lucide-react";
import Link from "next/link";

export default function PatientProfilePage() {
  const params = useParams();
  const patientId = params.patientId as string;

  const { data: patient, isLoading, isError, refetch } = usePatientQuery(patientId);

  const { data: memories } = useMemoriesQuery(patientId);

  const { data: familyMembers } = useQuery({
    queryKey: ["family-members", patientId],
    queryFn: () => familyService.getFamilyMembers(patientId),
    enabled: !!patientId,
  });

  const { data: consentSettings } = useQuery({
    queryKey: ["patient-consent", patientId],
    queryFn: () => consentService.getConsent(patientId),
    enabled: !!patientId,
  });

  if (isLoading) {
    return <LoadingState message="Loading patient profile..." />;
  }

  if (isError || !patient) {
    return (
      <ErrorState
        title="Patient profile not found"
        message="Unable to load this patient profile. It may have been archived or removed."
        onRetry={() => refetch()}
      />
    );
  }

  const stageInfo = getStageBadgeInfo(patient.stage);
  const displayName =
    patient.preferredName || patient.firstName || "Unnamed Patient";

  return (
    <div className="space-y-6 pb-12">
      {/* Profile Header Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <PatientAvatar
              name={displayName}
              photoUrl={patient.profilePhotoUrl}
              size="xl"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                  {displayName}
                </h1>
                <span
                  className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${stageInfo.className}`}
                >
                  {stageInfo.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Legal Name: <span className="font-medium text-slate-700">{patient.firstName}</span> •{" "}
                {patient.age ? `${patient.age} years old` : "Age not recorded"} •{" "}
                Language: <span className="font-medium text-slate-700">{patient.preferredLanguage || "English"}</span>
              </p>
            </div>
          </div>

          {/* Quick Action CTAs */}
          <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-center">
            <Link href={`/dashboard/patients/${patientId}/live`}>
              <Button variant="teal" size="sm" className="gap-1.5">
                <Radio className="h-4 w-4" />
                <span>Live Companion</span>
              </Button>
            </Link>
            <Link href={`/dashboard/patients/${patientId}/memories`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <BookOpen className="h-4 w-4" />
                <span>Memories ({memories?.length ?? 0})</span>
              </Button>
            </Link>
            <Link href={`/dashboard/patients/${patientId}/family`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Users className="h-4 w-4" />
                <span>Family ({familyMembers?.length ?? 0})</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview & Biography</TabsTrigger>
          <TabsTrigger value="care">Care & Comfort</TabsTrigger>
          <TabsTrigger value="family">Family Circle ({familyMembers?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="memories">Personal Memories ({memories?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="consent">Consent & Privacy</TabsTrigger>
        </TabsList>

        {/* TAB 1: Overview & Biography */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Biography & Life Story */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Sparkles className="h-4 w-4 text-teal-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Biographical Context
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-semibold text-slate-500 uppercase block">
                    Profession & Career
                  </span>
                  <p className="text-slate-800 text-sm mt-0.5">
                    {patient.profession || "—"}
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-slate-500 uppercase block">
                    Hometown & Roots
                  </span>
                  <p className="text-slate-800 text-sm mt-0.5">
                    {patient.hometown || "—"}
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-slate-500 uppercase block">
                    Education
                  </span>
                  <p className="text-slate-800 text-sm mt-0.5">
                    {patient.education || "—"}
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-slate-500 uppercase block mb-1">
                    Interests & Hobbies
                  </span>
                  {patient.hobbies && patient.hobbies.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {patient.hobbies.map((h) => (
                        <span
                          key={h}
                          className="rounded bg-teal-50 px-2 py-0.5 text-teal-800 border border-teal-200"
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400">None specified</span>
                  )}
                </div>

                <div>
                  <span className="font-semibold text-slate-500 uppercase block mb-1">
                    Favourite Conversation Topics
                  </span>
                  {patient.favouriteTopics && patient.favouriteTopics.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {patient.favouriteTopics.map((t) => (
                        <span
                          key={t}
                          className="rounded bg-sky-50 px-2 py-0.5 text-sky-800 border border-sky-200"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400">None specified</span>
                  )}
                </div>
              </div>
            </div>

            {/* Emergency Contacts Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Phone className="h-4 w-4 text-teal-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Emergency Escalation Contacts
                </h3>
              </div>

              {patient.emergencyContacts && patient.emergencyContacts.length > 0 ? (
                <div className="space-y-3">
                  {patient.emergencyContacts.map((contact, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-slate-200 p-3 bg-slate-50/50 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold text-sm text-slate-800 block">
                          {contact.name}
                        </span>
                        <span className="text-xs text-slate-500">
                          {contact.relationship}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-teal-700">
                        {contact.phone}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-4 text-center">
                  No emergency contacts configured yet.
                </p>
              )}
            </div>

            {/* Patient Device Pairing */}
            <div className="md:col-span-2">
              <PairDeviceCard patientId={patientId} />
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: Care & Comfort */}
        <TabsContent value="care">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Communication Guidelines
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed">
                {patient.communicationPreferences ||
                  "No specific communication guidelines recorded. AI will follow stage-default pacing."}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Comfort Preferences & Daily Routines
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed">
                {patient.comfortPreferences ||
                  "No custom daily comfort routines recorded."}
              </p>
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: Family */}
        <TabsContent value="family">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Registered Family Circle
              </h3>
              <Link href={`/dashboard/patients/${patientId}/family`}>
                <Button variant="outline" size="sm">
                  Manage Family Circle
                </Button>
              </Link>
            </div>

            {!familyMembers || familyMembers.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No family members added"
                description="Connect relatives to enable calming voice messages and photo contributions."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {familyMembers.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 bg-white"
                  >
                    <PatientAvatar name={m.name} photoUrl={m.photoUrl} size="md" />
                    <div>
                      <span className="font-bold text-sm text-slate-900 block">
                        {m.name}
                      </span>
                      <span className="text-xs text-teal-700">
                        {m.relationship}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB 4: Memories */}
        <TabsContent value="memories">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Personal Memory Library
              </h3>
              <Link href={`/dashboard/patients/${patientId}/memories`}>
                <Button variant="outline" size="sm">
                  Manage Memories
                </Button>
              </Link>
            </div>

            {!memories || memories.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No personal memories added"
                description="Add memories so the AI can ground the patient during moments of disorientation."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {memories.slice(0, 6).map((m) => (
                  <div
                    key={m.id}
                    className="rounded-2xl border border-slate-200 p-4 bg-white space-y-2"
                  >
                    <span className="rounded bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-800 border border-teal-200">
                      {m.category || "Memory"}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900">{m.title}</h4>
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {m.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB 5: Consent & Privacy */}
        <TabsContent value="consent">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Active Consent Status
              </h3>
              <Link href={`/dashboard/patients/${patientId}/consent`}>
                <Button variant="outline" size="sm">
                  Edit Consent Settings
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                <span className="text-slate-500 block font-semibold">
                  Personal Data
                </span>
                <span
                  className={`font-bold text-sm mt-1 block ${
                    consentSettings?.personalDataCollection ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  {consentSettings?.personalDataCollection ? "Authorized" : "Restricted"}
                </span>
              </div>
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                <span className="text-slate-500 block font-semibold">
                  AI Real-time Analysis
                </span>
                <span
                  className={`font-bold text-sm mt-1 block ${
                    consentSettings?.aiConversationUsage ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  {consentSettings?.aiConversationUsage ? "Active" : "Disabled"}
                </span>
              </div>
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                <span className="text-slate-500 block font-semibold">
                  Emergency Escalation
                </span>
                <span
                  className={`font-bold text-sm mt-1 block ${
                    consentSettings?.emergencyEscalationEnabled ? "text-emerald-700" : "text-red-700"
                  }`}
                >
                  {consentSettings?.emergencyEscalationEnabled ? "Enabled" : "Off"}
                </span>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
