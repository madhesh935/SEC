"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { consentService } from "@/services/consent.service";
import { usePatientQuery } from "@/hooks/usePatients";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingState } from "@/components/states/LoadingState";
import { ErrorState } from "@/components/states/ErrorState";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  ShieldCheck,
  Lock,
  FileText,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import { ConsentFormData } from "@/schemas/consent.schema";

export default function PatientConsentPage() {
  const params = useParams();
  const patientId = params.patientId as string;
  const queryClient = useQueryClient();

  const { data: patient } = usePatientQuery(patientId);

  const {
    data: consent,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["consent", patientId],
    queryFn: () => consentService.getConsent(patientId),
    enabled: !!patientId,
  });

  const [formState, setFormState] = React.useState<ConsentFormData>({
    personalDataCollection: true,
    memoriesUsage: true,
    photosUsage: true,
    voiceRecordingsUsage: true,
    aiConversationUsage: true,
    caregiverAccessLevel: "FULL",
    familyAccessLevel: "APPROVED_ONLY",
    emergencyEscalationEnabled: true,
    dataRetentionDays: 365,
  });

  const [hasChanges, setHasChanges] = React.useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  React.useEffect(() => {
    if (consent) {
      setFormState({
        personalDataCollection: consent.personalDataCollection ?? true,
        memoriesUsage: consent.memoriesUsage ?? true,
        photosUsage: consent.photosUsage ?? true,
        voiceRecordingsUsage: consent.voiceRecordingsUsage ?? true,
        aiConversationUsage: consent.aiConversationUsage ?? true,
        caregiverAccessLevel: consent.caregiverAccessLevel || "FULL",
        familyAccessLevel: consent.familyAccessLevel || "APPROVED_ONLY",
        emergencyEscalationEnabled: consent.emergencyEscalationEnabled ?? true,
        dataRetentionDays: consent.dataRetentionDays || 365,
      });
      setHasChanges(false);
    }
  }, [consent]);

  const updateMutation = useMutation({
    mutationFn: (data: ConsentFormData) =>
      consentService.updateConsent(patientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consent", patientId] });
      setHasChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const handleToggle = (key: keyof ConsentFormData, val: boolean | string | number) => {
    setFormState((prev) => ({ ...prev, [key]: val }));
    setHasChanges(true);
  };

  const patientName = patient
    ? patient.preferredName || patient.firstName
    : "Patient";

  if (isLoading) {
    return <LoadingState message="Loading privacy and consent settings..." />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Unable to load consent record"
        message="Could not connect to the privacy configuration service."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      <PageHeader
        title={`${patientName}'s Consent & Privacy Controls`}
        subtitle="Granular permissions governing memory ingestion, biometric speech analysis, family visibility, and emergency escalation."
        action={
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/patients/${patientId}`}>
              <Button variant="outline" size="sm">
                Patient Profile
              </Button>
            </Link>
            <Button
              variant="teal"
              size="sm"
              disabled={!hasChanges}
              onClick={() => setIsConfirmOpen(true)}
            >
              Save Privacy Settings
            </Button>
          </div>
        }
      />

      {saveSuccess && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-900 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Consent preferences updated and synchronized across all companion nodes.</span>
        </div>
      )}

      {/* Security Architecture Notice (Step 25) */}
      <div className="rounded-2xl border border-teal-200 bg-teal-50/60 p-4 text-xs text-teal-950 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-teal-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Backend & Firestore Enforced Security:</span>
          <p className="mt-0.5 text-teal-900 leading-relaxed">
            All consent changes configured here are strictly verified and enforced by backend API middleware and Cloud Firestore security rules. Unauthorized clients cannot bypass these settings.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft space-y-6">
        {/* Section 1: Data & Media Usage */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            1. Personal Data & Media Ingestion
          </h3>

          <Switch
            id="personalDataCollection"
            label="Personal Data Collection"
            description="Authorize ingestion of biographical details (profession, hometown, hobbies) for conversational grounding."
            checked={formState.personalDataCollection}
            onCheckedChange={(val) => handleToggle("personalDataCollection", val)}
          />

          <Switch
            id="memoriesUsage"
            label="Personal Memories Ingestion"
            description="Allow the Personal Memory Engine to index verified family stories to calm repetitive questions."
            checked={formState.memoriesUsage}
            onCheckedChange={(val) => handleToggle("memoriesUsage", val)}
          />

          <Switch
            id="photosUsage"
            label="Photographs on Companion Screen"
            description="Display approved family photographs on the bedside companion during memory prompts."
            checked={formState.photosUsage}
            onCheckedChange={(val) => handleToggle("photosUsage", val)}
          />

          <Switch
            id="voiceRecordingsUsage"
            label="Family Voice Recordings Playback"
            description="Permit playback of recorded audio clips from loved ones during moments of disorientation."
            checked={formState.voiceRecordingsUsage}
            onCheckedChange={(val) => handleToggle("voiceRecordingsUsage", val)}
          />
        </div>

        {/* Section 2: AI Companion Real-time Analysis */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            2. AI Conversational Processing
          </h3>

          <Switch
            id="aiConversationUsage"
            label="Real-Time Speech & Distress Signal Analysis"
            description="Analyze vocal pitch, tension, and repetition frequency in real time to adapt response strategies."
            checked={formState.aiConversationUsage}
            onCheckedChange={(val) => handleToggle("aiConversationUsage", val)}
          />
        </div>

        {/* Section 3: Access Levels */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            3. Caregiver & Family Access Tiers
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                Caregiver Access Level
              </label>
              <Select
                value={formState.caregiverAccessLevel}
                onChange={(e) =>
                  handleToggle("caregiverAccessLevel", e.target.value)
                }
              >
                <option value="FULL">Full Access (All telemetry & alerts)</option>
                <option value="RESTRICTED">Restricted (Sensitive memories hidden)</option>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                Family Member Access Level
              </label>
              <Select
                value={formState.familyAccessLevel}
                onChange={(e) =>
                  handleToggle("familyAccessLevel", e.target.value)
                }
              >
                <option value="APPROVED_ONLY">Approved Stories & Prompts Only</option>
                <option value="CUSTOM">Custom Caregiver Configuration</option>
                <option value="NONE">No Direct Family Access</option>
              </Select>
            </div>
          </div>
        </div>

        {/* Section 4: Emergency Escalation & Retention */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            4. Emergency Escalation & Data Retention
          </h3>

          <Switch
            id="emergencyEscalationEnabled"
            label="Automated Emergency Alert Escalation"
            description="Notify designated emergency contacts via SMS / phone if high-risk distress thresholds persist."
            checked={formState.emergencyEscalationEnabled}
            onCheckedChange={(val) =>
              handleToggle("emergencyEscalationEnabled", val)
            }
          />

          <div className="max-w-xs">
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
              Data Retention Period
            </label>
            <Select
              value={String(formState.dataRetentionDays)}
              onChange={(e) =>
                handleToggle("dataRetentionDays", Number(e.target.value))
              }
            >
              <option value="90">90 Days (Minimum recommended)</option>
              <option value="180">180 Days (6 Months)</option>
              <option value="365">365 Days (1 Year)</option>
              <option value="730">730 Days (2 Years)</option>
            </Select>
            <p className="text-[11px] text-slate-400 mt-1">
              Audio transcripts older than this window are permanently purged from server disks.
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog before changing settings */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          setIsConfirmOpen(false);
          updateMutation.mutate(formState);
        }}
        title="Confirm Consent Updates"
        description="Are you sure you want to update these legal consent and privacy rules? These guardrails immediately apply to all live AI interactions."
        variant="teal"
        confirmLabel="Confirm & Apply"
        isLoading={updateMutation.isPending}
      />
    </div>
  );
}
