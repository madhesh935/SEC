"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  User,
  Phone,
  Shield,
  CheckCircle2,
} from "lucide-react";
import { patientService } from "@/services/patient.service";
import { Patient } from "@/types";
import {
  PageContainer,
  PageHeader,
  SectionCard,
  LoadingSkeleton,
  ErrorState,
} from "@/components/design-system";

export default function EditPatientPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const router = useRouter();
  const client = useQueryClient();

  const query = useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => patientService.getPatientById(patientId),
  });

  const [draft, setDraft] = useState<Patient | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (query.data) setDraft(query.data);
  }, [query.data]);

  const saveMutation = useMutation({
    mutationFn: () => patientService.updatePatient(patientId, draft!),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["patient", patientId] });
      await client.invalidateQueries({ queryKey: ["patients"] });
      setSaveSuccess(true);
      setTimeout(() => {
        router.push(`/caregiver/patients/${patientId}`);
      }, 800);
    },
  });

  if (query.isLoading) {
    return (
      <PageContainer>
        <LoadingSkeleton />
      </PageContainer>
    );
  }

  if (query.isError || !draft) {
    return (
      <PageContainer>
        <ErrorState
          message="Could not load patient profile for editing."
          onRetry={() => void query.refetch()}
        />
      </PageContainer>
    );
  }

  const patientName = draft.preferredName || draft.firstName || "Patient";

  return (
    <PageContainer>
      <PageHeader
        title={`Edit Profile: ${patientName}`}
        subtitle="Update biographical details, communication preferences, and configured care stage."
        actions={
          <div className="flex items-center gap-2.5">
            <Link
              href={`/caregiver/patients/${patientId}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Cancel</span>
            </Link>
            <button
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white transition-colors shadow-xs cursor-pointer"
            >
              {saveMutation.isPending ? (
                <span>Saving…</span>
              ) : saveSuccess ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        }
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveMutation.mutate();
        }}
        className="space-y-6"
      >
        {/* Identity & Core Info */}
        <SectionCard
          title="Identity & Core Information"
          subtitle="Basic profile details referenced in daily greetings"
          headerIcon={<User className="h-4 w-4" />}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Preferred Name *</label>
              <input
                type="text"
                required
                value={draft.preferredName || ""}
                onChange={(e) => setDraft({ ...draft, preferredName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Legal First Name *</label>
              <input
                type="text"
                required
                value={draft.firstName || ""}
                onChange={(e) => setDraft({ ...draft, firstName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Age</label>
              <input
                type="number"
                value={draft.age || ""}
                onChange={(e) => setDraft({ ...draft, age: parseInt(e.target.value) || undefined })}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Preferred Language *</label>
              <input
                type="text"
                required
                value={draft.preferredLanguage || ""}
                onChange={(e) => setDraft({ ...draft, preferredLanguage: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Hometown</label>
              <input
                type="text"
                value={draft.hometown || ""}
                onChange={(e) => setDraft({ ...draft, hometown: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Profession / Background</label>
              <input
                type="text"
                value={draft.profession || ""}
                onChange={(e) => setDraft({ ...draft, profession: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
          </div>
        </SectionCard>

        {/* Configured Stage & Care Framing */}
        <SectionCard
          title="Configured Care Stage & Style"
          subtitle="Calibrates the companion's complexity, speed, and soothing strategies"
          headerIcon={<Shield className="h-4 w-4" />}
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Caregiver / Clinician Configured Stage
              </label>
              <select
                value={draft.stage || "EARLY"}
                onChange={(e) => setDraft({ ...draft, stage: e.target.value as Patient["stage"] })}
                className="w-full px-3 py-2.5 rounded-xl text-sm border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              >
                <option value="EARLY">Early Stage — Rich dialogue, memory prompts, cognitive exercises</option>
                <option value="MID">Mid Stage — Simple choices, reassurance, gentle repetition redirection</option>
                <option value="LATE">Late Stage — Short soothing phrases, music, loved-one voice presence</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Communication Preferences</label>
                <textarea
                  rows={2}
                  value={draft.communicationPreferences || ""}
                  onChange={(e) => setDraft({ ...draft, communicationPreferences: e.target.value })}
                  placeholder="e.g. Speaks softly, likes short sentences, enjoys morning chats"
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Comfort & Soothing Preferences</label>
                <textarea
                  rows={2}
                  value={draft.comfortPreferences || ""}
                  onChange={(e) => setDraft({ ...draft, comfortPreferences: e.target.value })}
                  placeholder="e.g. Loves listening to 1960s acoustic songs, calmed by tea discussion"
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Safety & Emergency Contact */}
        <SectionCard
          title="Safety & Emergency Contact"
          subtitle="Referenced when acute distress or emergency triggers occur"
          headerIcon={<Phone className="h-4 w-4" />}
        >
          <div className="space-y-1.5 max-w-md">
            <label className="text-xs font-semibold text-slate-700">
              Local Emergency Services Phone Number
            </label>
            <input
              type="text"
              value={draft.emergencyServicesPhone || ""}
              onChange={(e) => setDraft({ ...draft, emergencyServicesPhone: e.target.value })}
              placeholder="e.g. 911 or local emergency dispatcher"
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
        </SectionCard>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href={`/caregiver/patients/${patientId}`}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white transition-colors shadow-xs cursor-pointer"
          >
            {saveMutation.isPending ? "Saving changes…" : "Save Changes"}
          </button>
        </div>
      </form>
    </PageContainer>
  );
}
