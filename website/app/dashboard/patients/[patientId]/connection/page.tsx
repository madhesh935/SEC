"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { familyService } from "@/services/family.service";
import { useMemoriesQuery } from "@/hooks/useMemories";
import { usePatientQuery } from "@/hooks/usePatients";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingState } from "@/components/states/LoadingState";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  Mic,
  Image as ImageIcon,
  Lightbulb,
} from "lucide-react";
import Link from "next/link";

export default function FamilyConnectionPage() {
  const params = useParams();
  const patientId = params.patientId as string;

  const { data: patient } = usePatientQuery(patientId);

  // Fetch suggested conversation prompts from backend
  const {
    data: prompts,
    isLoading: isPromptsLoading,
    isError: isPromptsError,
    refetch,
  } = useQuery({
    queryKey: ["family-prompts", patientId],
    queryFn: () => familyService.getFamilyPrompts(patientId),
    enabled: !!patientId,
  });

  // Fetch approved memories
  const { data: memories, isLoading: isMemoriesLoading } = useMemoriesQuery(
    patientId,
    { approved: true }
  );

  // Fetch registered family
  const { data: familyMembers } = useQuery({
    queryKey: ["family-members", patientId],
    queryFn: () => familyService.getFamilyMembers(patientId),
    enabled: !!patientId,
  });

  const patientName = patient
    ? patient.preferredName || patient.firstName
    : "Patient";

  if (isPromptsLoading || isMemoriesLoading) {
    return <LoadingState message="Loading family connection hub..." />;
  }

  const voiceRecordings = familyMembers?.filter((m) => !!m.voiceRecordingUrl) || [];
  const photoMemories = memories?.filter((m) => !!m.imageUrl) || [];

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title={`Family Connection Hub — ${patientName}`}
        subtitle="Bridge distance and memory changes with suggested discussion topics, comforting photos, and family voice notes."
        action={
          <Link href={`/dashboard/patients/${patientId}`}>
            <Button variant="outline" size="sm">
              Patient Profile
            </Button>
          </Link>
        }
      />

      {/* Suggested Conversation Topics */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <Lightbulb className="h-5 w-5 text-teal-700" />
          <h3 className="text-base font-bold text-slate-900">
            Suggested Conversation Topics
          </h3>
        </div>

        {isPromptsError ? (
          <ErrorState
            variant="inline"
            title="Unable to load conversation prompts right now."
            onRetry={() => refetch()}
          />
        ) : !prompts || prompts.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="No conversation prompts generated yet"
            description="When conversation analysis identifies comforting topics or upcoming milestones, personalized suggestions for relatives will appear here."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prompts.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-teal-100 bg-teal-50/40 p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-900">
                    {p.topic}
                  </span>
                  {p.recommendedTone && (
                    <span className="rounded bg-white px-2 py-0.5 text-[10px] font-semibold text-teal-800 border border-teal-200">
                      {p.recommendedTone}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {p.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Positive Memories & Photos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Photo Memories */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-teal-700" />
              <h3 className="text-sm font-bold text-slate-900">
                Shared Photo Memories
              </h3>
            </div>
            <Link
              href={`/dashboard/patients/${patientId}/memories`}
              className="text-xs font-semibold text-teal-700 hover:underline"
            >
              All Memories →
            </Link>
          </div>

          {photoMemories.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              No photo memories uploaded yet.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photoMemories.slice(0, 6).map((mem) => (
                <div
                  key={mem.id}
                  className="group relative h-28 overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                >
                  <img
                    src={mem.imageUrl}
                    alt={mem.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                    <span className="text-[10px] font-medium text-white truncate">
                      {mem.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Soothing Voice Messages */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <Mic className="h-4 w-4 text-teal-700" />
              <h3 className="text-sm font-bold text-slate-900">
                Family Voice Messages
              </h3>
            </div>
            <Link
              href={`/dashboard/patients/${patientId}/family`}
              className="text-xs font-semibold text-teal-700 hover:underline"
            >
              Manage Family →
            </Link>
          </div>

          {voiceRecordings.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              No family audio clips uploaded yet. Relatives can record 30-second soothing greetings in the family portal.
            </p>
          ) : (
            <div className="space-y-2.5">
              {voiceRecordings.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs border border-slate-200/60"
                >
                  <div>
                    <span className="font-bold text-slate-800 block">
                      {m.name} ({m.relationship})
                    </span>
                    <span className="text-[11px] text-emerald-700 font-medium">
                      Audio clip active for companion playback
                    </span>
                  </div>
                  <Button variant="soft" size="sm" className="h-7 text-xs">
                    Preview
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
