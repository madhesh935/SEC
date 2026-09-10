"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { portalService, Permission, Grant } from "@/services/portal.service";
import { consentService } from "@/services/consent.service";
import { PairDeviceCard } from "@/components/patient/PairDeviceCard";
import { ConsentFormData } from "@/schemas/consent.schema";
import {
  SectionCard,
  StatusBadge,
  LoadingSkeleton,
  EmptyState,
  ErrorState,
} from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatRelativeTime } from "@/utils/formatters";
import {
  Smartphone,
  Shield,
  Heart,
  Brain,
  Users,
  Copy,
  Check,
  AlertCircle,
  UserPlus,
} from "lucide-react";

// ─── DEVICE PANEL ─────────────────────────────────────────────────────────────

export function DevicePanel({ id }: { id: string }) {
  const cache = useQueryClient();
  const query = useQuery({
    queryKey: ["devices", id],
    queryFn: () => portalService.devices(id),
    refetchInterval: 15000,
  });

  const revoke = useMutation({
    mutationFn: (device: string) => portalService.revokeDevice(id, device),
    onSuccess: () => cache.invalidateQueries({ queryKey: ["devices", id] }),
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <SectionCard
        title="Paired Patient Devices"
        subtitle="Physical tablets and smartphones paired to run the patient companion application."
      >
        {query.isLoading ? (
          <LoadingSkeleton />
        ) : query.isError ? (
          <ErrorState
            message="Could not load paired devices. Check network connectivity or backend status."
            onRetry={() => query.refetch()}
          />
        ) : !query.data || query.data.length === 0 ? (
          <EmptyState
            icon={<Smartphone className="h-6 w-6" />}
            title="No devices currently paired"
            description="Use the pairing card to generate a QR code or PIN and link the patient tablet."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {query.data.map((d) => (
              <div
                key={d.deviceId}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600 shrink-0">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 font-mono">
                        {d.deviceId.slice(0, 16)}...
                      </span>
                      <StatusBadge
                        status={
                          !d.active
                            ? "Revoked"
                            : d.connected
                            ? "Connected"
                            : "Offline"
                        }
                        variant={
                          !d.active
                            ? "slate"
                            : d.connected
                            ? "mint"
                            : "amber"
                        }
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Last seen: {formatRelativeTime(d.lastSeenAt || undefined)}
                    </p>
                  </div>
                </div>

                {d.active && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                    disabled={revoke.isPending}
                    onClick={() => {
                      if (
                        window.confirm(
                          "Are you sure you want to revoke access for this device? The patient app will be disconnected immediately."
                        )
                      ) {
                        revoke.mutate(d.deviceId);
                      }
                    }}
                  >
                    Revoke Access
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {revoke.isError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Device access could not be revoked. Please try again.</span>
          </div>
        )}
      </SectionCard>

      <div>
        <PairDeviceCard key={id} patientId={id} />
      </div>
    </div>
  );
}

// ─── PRIVACY PANEL ────────────────────────────────────────────────────────────

export function PrivacyPanel({ id }: { id: string }) {
  return (
    <div className="space-y-8">
      <ConsentEditor id={id} />
      <AccessPanel id={id} />
    </div>
  );
}

function ConsentEditor({ id }: { id: string }) {
  const cache = useQueryClient();
  const q = useQuery({
    queryKey: ["consent", id],
    queryFn: () => consentService.getConsent(id),
  });

  const [draft, setDraft] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (q.data) setDraft({ ...q.data });
  }, [q.data]);

  const save = useMutation({
    mutationFn: () =>
      consentService.updateConsent(id, {
        personalDataCollection: draft.personalDataCollection === true,
        biographyUsage: draft.biographyUsage === true,
        memoriesUsage: draft.memoriesUsage === true,
        photosUsage: draft.photosUsage === true,
        voiceRecordingsUsage: draft.voiceRecordingsUsage === true,
        aiConversationUsage: draft.aiConversationUsage === true,
        aiMayMentionMemoryDirectly: draft.aiMayMentionMemoryDirectly === true,
        patientMaySeeMemory: draft.patientMaySeeMemory === true,
        emergencyEscalationEnabled: draft.emergencyEscalationEnabled === true,
        familyAccessLevel:
          (draft.familyAccessLevel as "APPROVED_ONLY" | "NONE") ||
          "APPROVED_ONLY",
      } as ConsentFormData),
    onSuccess: () => cache.invalidateQueries({ queryKey: ["consent", id] }),
  });

  return (
    <SectionCard
      title="Privacy, Data Governance & AI Consent"
      subtitle="Caregivers configure strict data boundaries governing what the patient companion may access, display, and share."
    >
      {q.isLoading ? (
        <LoadingSkeleton />
      ) : q.isError ? (
        <ErrorState
          message="Could not load consent settings. Please verify backend connectivity."
          onRetry={() => q.refetch()}
        />
      ) : (
        <div className="space-y-6">
          {/* 1. Personal Data & Identity */}
          <div className="rounded-xl border border-slate-200/80 p-4 bg-slate-50/50 space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
              <Shield className="h-4 w-4 text-teal-600" />
              <h4>1. Personal Data & Identity</h4>
            </div>
            <div className="space-y-2 text-sm text-slate-700 pl-6">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
                  checked={draft.personalDataCollection === true}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      personalDataCollection: e.target.checked,
                    })
                  }
                />
                <div>
                  <span className="font-medium text-slate-900">
                    Personal Data Collection
                  </span>
                  <p className="text-xs text-slate-500">
                    Store identity, stage, demographic attributes, and daily care
                    routines.
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
                  checked={draft.biographyUsage === true}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      biographyUsage: e.target.checked,
                    })
                  }
                />
                <div>
                  <span className="font-medium text-slate-900">
                    Biography Usage
                  </span>
                  <p className="text-xs text-slate-500">
                    Allow companion to ground conversations in hometown,
                    profession, and life moments.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* 2. Memories & Media */}
          <div className="rounded-xl border border-slate-200/80 p-4 bg-slate-50/50 space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
              <Heart className="h-4 w-4 text-teal-600" />
              <h4>2. Memories & Familiar Media</h4>
            </div>
            <div className="space-y-2 text-sm text-slate-700 pl-6">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
                  checked={draft.memoriesUsage === true}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      memoriesUsage: e.target.checked,
                    })
                  }
                />
                <div>
                  <span className="font-medium text-slate-900">
                    Memory Retrieval
                  </span>
                  <p className="text-xs text-slate-500">
                    Permit AI companion to retrieve personal stories for gentle
                    reminiscence.
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
                  checked={draft.photosUsage === true}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      photosUsage: e.target.checked,
                    })
                  }
                />
                <div>
                  <span className="font-medium text-slate-900">Photo Display</span>
                  <p className="text-xs text-slate-500">
                    Display family and memory photographs on the patient screen
                    during conversations.
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
                  checked={draft.voiceRecordingsUsage === true}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      voiceRecordingsUsage: e.target.checked,
                    })
                  }
                />
                <div>
                  <span className="font-medium text-slate-900">
                    Voice Recordings
                  </span>
                  <p className="text-xs text-slate-500">
                    Play familiar family voice messages for reassurance and
                    de-escalation.
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
                  checked={draft.aiMayMentionMemoryDirectly === true}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      aiMayMentionMemoryDirectly: e.target.checked,
                    })
                  }
                />
                <div>
                  <span className="font-medium text-slate-900">
                    Proactive Memory Mentions
                  </span>
                  <p className="text-xs text-slate-500">
                    Allow companion to naturally initiate conversation about
                    approved memories.
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
                  checked={draft.patientMaySeeMemory === true}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      patientMaySeeMemory: e.target.checked,
                    })
                  }
                />
                <div>
                  <span className="font-medium text-slate-900">
                    Patient Memory Browsing
                  </span>
                  <p className="text-xs text-slate-500">
                    Allow patient to self-browse their memory album on the
                    tablet interface.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* 3. AI Safety & Conversations */}
          <div className="rounded-xl border border-slate-200/80 p-4 bg-slate-50/50 space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
              <Brain className="h-4 w-4 text-teal-600" />
              <h4>3. AI Companion Processing & Guardrails</h4>
            </div>
            <div className="space-y-2 text-sm text-slate-700 pl-6">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
                  checked={draft.aiConversationUsage === true}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      aiConversationUsage: e.target.checked,
                    })
                  }
                />
                <div>
                  <span className="font-medium text-slate-900">
                    Live AI Conversation
                  </span>
                  <p className="text-xs text-slate-500">
                    Enable real-time speech and cognitive exercises with the
                    GeriCare companion.
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
                  checked={draft.emergencyEscalationEnabled === true}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      emergencyEscalationEnabled: e.target.checked,
                    })
                  }
                />
                <div>
                  <span className="font-medium text-slate-900">
                    Emergency & Distress Escalation
                  </span>
                  <p className="text-xs text-slate-500">
                    Automatically trigger urgent caregiver alerts if acute
                    disorientation or medical distress is detected.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* 4. Family Circle Access */}
          <div className="rounded-xl border border-slate-200/80 p-4 bg-slate-50/50 space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
              <Users className="h-4 w-4 text-teal-600" />
              <h4>4. Family Access Scope</h4>
            </div>
            <div className="pl-6 space-y-2">
              <label className="block text-xs font-medium text-slate-600">
                Authorized Family Content Access
              </label>
              <select
                className="w-full max-w-sm rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                value={String(draft.familyAccessLevel || "APPROVED_ONLY")}
                onChange={(e) =>
                  setDraft({ ...draft, familyAccessLevel: e.target.value })
                }
              >
                <option value="APPROVED_ONLY">
                  Selected, caregiver-approved content only
                </option>
                <option value="NONE">Turn off family access completely</option>
              </select>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-2 flex items-center gap-3">
            <Button
              variant="teal"
              disabled={save.isPending}
              isLoading={save.isPending}
              onClick={() => save.mutate()}
            >
              Save Consent Settings
            </Button>

            {save.isSuccess && (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                <Check className="h-4 w-4" /> Consent preferences updated
                successfully.
              </span>
            )}
            {save.isError && (
              <span className="text-xs font-semibold text-rose-600 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" /> Failed to save consent.
                Please try again.
              </span>
            )}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

// ─── ACCESS PANEL (FAMILY GRANTS) ─────────────────────────────────────────────

const permissionLabels: Record<Permission, string> = {
  viewProfile: "View approved profile",
  viewMemories: "View shared memories",
  contributeMemory: "Contribute memories",
  uploadPhoto: "Upload photos",
  uploadVoice: "Upload voice recordings",
  viewUpdates: "Receive approved updates",
};

export function AccessPanel({ id }: { id: string }) {
  const cache = useQueryClient();
  const query = useQuery({
    queryKey: ["family-access", id],
    queryFn: () => portalService.grants(id),
  });

  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState("");
  const [permissions, setPermissions] = useState<Permission[]>([
    "viewProfile",
    "viewMemories",
  ]);
  const [copied, setCopied] = useState(false);

  const invite = useMutation({
    mutationFn: () =>
      portalService.invite(id, email, relationship, permissions),
  });

  const update = useMutation({
    mutationFn: (grant: Grant) => portalService.updateGrant(id, grant),
    onSuccess: () =>
      cache.invalidateQueries({ queryKey: ["family-access", id] }),
  });

  const link = invite.data
    ? (typeof window !== "undefined" ? window.location.origin : "") +
      "/family/signup?invitation=" +
      encodeURIComponent(invite.data.token)
    : "";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* Invite Family Member */}
      <SectionCard
        title="Invite Family Member"
        subtitle="Provide access for relatives to contribute memories, voice greetings, and photos."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            invite.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Family Member Email
            </label>
            <Input
              type="email"
              required
              placeholder="e.g. daughter@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Relationship to Patient
            </label>
            <Input
              required
              maxLength={60}
              placeholder="e.g. Daughter, Brother, Grandson"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
            />
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="block text-xs font-medium text-slate-700">
              Granted Permissions
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {(Object.entries(permissionLabels) as [Permission, string][]).map(
                ([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center gap-2 cursor-pointer text-slate-700 select-none"
                  >
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-3.5 w-3.5"
                      checked={permissions.includes(key)}
                      disabled={key === "viewProfile" || key === "viewMemories"}
                      onChange={(e) =>
                        setPermissions(
                          e.target.checked
                            ? [...permissions, key]
                            : permissions.filter((p) => p !== key)
                        )
                      }
                    />
                    <span>{label}</span>
                  </label>
                )
              )}
            </div>
          </div>

          <Button
            type="submit"
            variant="teal"
            size="sm"
            disabled={invite.isPending || !email || !relationship}
            isLoading={invite.isPending}
            className="w-full gap-2"
          >
            <UserPlus className="h-4 w-4" />
            <span>Generate Family Invitation</span>
          </Button>
        </form>

        {invite.isError && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
            Could not generate invitation. Please check the email and try again.
          </div>
        )}

        {invite.data && (
          <div className="mt-4 p-4 rounded-xl bg-teal-50/50 border border-teal-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-900">
                Invitation Generated (Expires in 72h)
              </span>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(link);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  } catch {
                    // Clipboard API unavailable
                  }
                }}
                className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied ? "Copied" : "Copy Link"}
              </button>
            </div>
            <Input
              readOnly
              value={link}
              className="text-xs font-mono bg-white select-all"
              onFocus={(e) => e.target.select()}
            />
          </div>
        )}
      </SectionCard>

      {/* Active Grants List */}
      <SectionCard
        title="Active Family Accounts"
        subtitle="Relatives currently authorized to interact with this profile."
      >
        {query.isLoading ? (
          <LoadingSkeleton />
        ) : query.isError ? (
          <ErrorState
            message="Could not load family accounts. Check backend connectivity."
            onRetry={() => query.refetch()}
          />
        ) : !query.data || query.data.length === 0 ? (
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="No family accounts linked yet"
            description="Invite family members above so they can share memories and record reassuring voice greetings."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {query.data.map((g) => (
              <div key={g.userId} className="py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-bold text-slate-900">
                      {g.email || g.relationship}
                    </h5>
                    <p className="text-xs text-slate-500">{g.relationship}</p>
                  </div>
                  <StatusBadge
                    status={g.status === "active" ? "Active" : "Revoked"}
                    variant={g.status === "active" ? "mint" : "slate"}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {(Object.entries(permissionLabels) as [
                    Permission,
                    string,
                  ][]).map(([key, label]) => (
                    <label
                      key={key}
                      className="flex items-center gap-1.5 cursor-pointer text-slate-600"
                    >
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-3.5 w-3.5"
                        checked={g.permissions.includes(key)}
                        disabled={
                          update.isPending ||
                          key === "viewProfile" ||
                          key === "viewMemories"
                        }
                        onChange={(e) =>
                          update.mutate({
                            ...g,
                            permissions: e.target.checked
                              ? [...g.permissions, key]
                              : g.permissions.filter((p) => p !== key),
                          })
                        }
                      />
                      <span className="truncate">{label}</span>
                    </label>
                  ))}
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className={
                      g.status === "active"
                        ? "text-rose-600 hover:bg-rose-50 border-rose-200 text-xs"
                        : "text-teal-700 hover:bg-teal-50 border-teal-200 text-xs"
                    }
                    disabled={update.isPending}
                    onClick={() =>
                      update.mutate({
                        ...g,
                        status: g.status === "active" ? "revoked" : "active",
                      })
                    }
                  >
                    {g.status === "active" ? "Revoke Access" : "Restore Access"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
