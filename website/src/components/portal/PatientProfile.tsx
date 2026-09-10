"use client";

import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePatientQuery } from "@/hooks/usePatients";
import { usePatientStore } from "@/store/patient.store";
import { familyService } from "@/services/family.service";
import { memoryService } from "@/services/memory.service";
import { mediaService } from "@/services/media.service";
import { FamilyMember, Memory, MemoryCategory, SensitivityLevel } from "@/types";
import { getStageBadgeInfo, formatRelativeTime } from "@/utils/formatters";
import {
  PageContainer,
  PageHeader,
  TabNavigation,
  SectionCard,
  ProfileAvatar,
  EmptyState,
  LoadingSkeleton,
  ErrorState,
} from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { DevicePanel, PrivacyPanel } from "./PatientManagement";
import {
  User,
  Heart,
  Calendar,
  MapPin,
  Phone,
  Volume2,
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Globe,
  Briefcase,
  GraduationCap,
  Music,
  Compass,
  ArrowLeft,
  Gamepad2,
  Brain,
  RotateCcw,
  CheckCircle,
  Trophy,
  Layers,
  Check,
} from "lucide-react";

const tabs = [
  "Overview",
  "Care & Routine",
  "Family",
  "Memories",
  "Activities & Games",
  "Privacy",
  "Device",
];

export function PatientProfile() {
  const params = useParams();
  const id = params.patientId as string;
  const search = useSearchParams();
  const [tab, setTab] = useState(
    tabs.includes(search.get("tab") || "") ? search.get("tab")! : "Overview"
  );

  const patient = usePatientQuery(id);
  const select = usePatientStore((s) => s.setSelectedPatientId);

  useEffect(() => {
    if (id) {
      select(id);
    }
  }, [id, select]);

  const p = patient.data;

  if (patient.isLoading) {
    return (
      <PageContainer>
        <LoadingSkeleton />
      </PageContainer>
    );
  }

  if (patient.isError || !p) {
    return (
      <PageContainer>
        <ErrorState
          message="We couldn't connect to the patient service. Please verify your connection."
          onRetry={() => patient.refetch()}
        />
      </PageContainer>
    );
  }

  const displayName = p.preferredName || p.firstName || "Patient Profile";
  const stageInfo = getStageBadgeInfo(p.stage);

  return (
    <PageContainer>
      {/* Top Breadcrumb & Page Header */}
      <div className="space-y-4">
        <Link
          href="/caregiver/patients"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-700 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to All Patients</span>
        </Link>

        <PageHeader
          title={displayName}
          subtitle="Manage biographical history, cognitive stage settings, family circle, personal memories, and device pairing."
          actions={
            <Link href={`/caregiver/patients/${id}/edit`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Edit2 className="h-4 w-4" />
                <span>Edit Profile</span>
              </Button>
            </Link>
          }
        />
      </div>

      {/* Tabs */}
      <TabNavigation tabs={tabs} activeTab={tab} onChange={setTab} />

      {/* Tab 1: Overview */}
      {tab === "Overview" && (
        <div className="space-y-6">
          {/* Hero Identity Section */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <ProfileAvatar
                  name={displayName}
                  src={p.profilePhotoUrl}
                  size="xl"
                />
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                      {displayName}
                    </h2>
                    <span
                      className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${stageInfo.className}`}
                    >
                      {stageInfo.label}
                    </span>
                  </div>

                  {p.preferredName && p.firstName && p.preferredName !== p.firstName && (
                    <p className="text-xs text-slate-400">
                      Legal Name: {p.firstName}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                    {p.age !== undefined && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {p.age} years old
                      </span>
                    )}
                    {p.gender && (
                      <span className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        {p.gender}
                      </span>
                    )}
                    {p.preferredLanguage && (
                      <span className="flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5 text-slate-400" />
                        Language: {p.preferredLanguage}
                      </span>
                    )}
                    {p.hometown && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {p.hometown}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 text-xs text-slate-500 space-y-1.5 shrink-0">
                <div>
                  <span className="font-semibold text-slate-700">Patient ID:</span>{" "}
                  <span className="font-mono text-[11px]">{p.id.slice(0, 16)}</span>
                </div>
                {p.lastInteraction && (
                  <div>
                    <span className="font-semibold text-slate-700">Last Active:</span>{" "}
                    {formatRelativeTime(p.lastInteraction)}
                  </div>
                )}
                <div>
                  <span className="font-semibold text-slate-700">Profile Created:</span>{" "}
                  {formatRelativeTime(p.createdAt)}
                </div>
              </div>
            </div>
          </div>

          {/* 2-Column Life & Familiar Roots */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Life & Identity */}
            <SectionCard
              title="Life & Identity"
              subtitle="Biographical background anchoring conversational grounding."
            >
              <div className="divide-y divide-slate-100 text-sm">
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-500 text-xs font-medium flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-slate-400" /> Profession
                  </span>
                  <span className="font-semibold text-slate-800">
                    {p.profession || "Not specified"}
                  </span>
                </div>

                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-500 text-xs font-medium flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5 text-slate-400" /> Education
                  </span>
                  <span className="font-semibold text-slate-800">
                    {p.education || "Not specified"}
                  </span>
                </div>

                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-500 text-xs font-medium flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" /> Hometown
                  </span>
                  <span className="font-semibold text-slate-800">
                    {p.hometown || "Not specified"}
                  </span>
                </div>

                {p.placesLived && p.placesLived.length > 0 && (
                  <div className="py-3 space-y-1.5">
                    <span className="text-slate-500 text-xs font-medium block">
                      Places Lived
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {p.placesLived.map((place, i) => (
                        <span
                          key={i}
                          className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                        >
                          {place}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {p.importantLifeEvents && p.importantLifeEvents.length > 0 && (
                  <div className="py-3 space-y-1.5">
                    <span className="text-slate-500 text-xs font-medium block">
                      Important Life Events
                    </span>
                    <ul className="space-y-1 text-xs text-slate-700 list-disc list-inside">
                      {p.importantLifeEvents.map((evt, i) => (
                        <li key={i}>{evt}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Familiar Interests */}
            <SectionCard
              title="Familiar Interests & Roots"
              subtitle="Topics, hobbies, and anchors to bring familiarity and calm."
            >
              <div className="space-y-4 text-sm">
                <div>
                  <span className="text-slate-500 text-xs font-medium flex items-center gap-1.5 mb-2">
                    <Sparkles className="h-3.5 w-3.5 text-teal-600" /> Hobbies & Passions
                  </span>
                  {p.hobbies && p.hobbies.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {p.hobbies.map((h, i) => (
                        <span
                          key={i}
                          className="rounded-lg bg-teal-50 border border-teal-200/60 px-2.5 py-1 text-xs font-medium text-teal-800"
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No hobbies recorded.</p>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <span className="text-slate-500 text-xs font-medium flex items-center gap-1.5 mb-2">
                    <Heart className="h-3.5 w-3.5 text-rose-500" /> Favourite Topics
                  </span>
                  {p.favouriteTopics && p.favouriteTopics.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {p.favouriteTopics.map((t, i) => (
                        <span
                          key={i}
                          className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No favourite topics recorded.</p>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <span className="text-slate-500 text-xs font-medium flex items-center gap-1.5 mb-2">
                    <Music className="h-3.5 w-3.5 text-purple-500" /> Favourite Music
                  </span>
                  {p.favouriteMusic && p.favouriteMusic.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {p.favouriteMusic.map((m, i) => (
                        <span
                          key={i}
                          className="rounded-lg bg-purple-50 border border-purple-200/60 px-2.5 py-1 text-xs font-medium text-purple-800"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No favourite music recorded.</p>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <span className="text-slate-500 text-xs font-medium flex items-center gap-1.5 mb-2">
                    <Compass className="h-3.5 w-3.5 text-amber-500" /> Meaningful Places
                  </span>
                  {p.meaningfulPlaces && p.meaningfulPlaces.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {p.meaningfulPlaces.map((pl, i) => (
                        <span
                          key={i}
                          className="rounded-lg bg-amber-50 border border-amber-200/60 px-2.5 py-1 text-xs font-medium text-amber-800"
                        >
                          {pl}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No meaningful places recorded.</p>
                  )}
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {/* Tab 2: Care & Routine */}
      {tab === "Care & Routine" && (
        <div className="space-y-6">
          {/* Configured Stage Guidance Callout */}
          <SectionCard
            title="Dementia Care Stage & Companion Adaptation"
            subtitle="Configured by caregiver or clinician to establish dialogue pacing and reminiscence depth."
          >
            <div className="rounded-xl bg-teal-50/50 border border-teal-200 p-4 mb-5">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${stageInfo.className}`}>
                  Active Setting: {stageInfo.label}
                </span>
                <span className="text-xs text-slate-500">
                  (Explicit caregiver configuration — NOT an automated AI diagnosis)
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                The GeriCare companion dynamically adjusts its repetition tolerance, conversational prompt length,
                and sensory reassurance protocols to match this configured stage.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div
                className={`rounded-xl border p-4 space-y-2 transition-all ${
                  p.stage === "EARLY"
                    ? "bg-teal-50/70 border-teal-300 ring-2 ring-teal-500/20"
                    : "bg-white border-slate-200/80 text-slate-600"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Early Stage</span>
                  {p.stage === "EARLY" && (
                    <span className="text-[10px] font-bold text-teal-700 bg-teal-100 rounded-full px-2 py-0.5">
                      Selected
                    </span>
                  )}
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Focuses on open dialogue, gentle reminiscence, daily schedule prompting, and cognitive activities.
                </p>
              </div>

              <div
                className={`rounded-xl border p-4 space-y-2 transition-all ${
                  p.stage === "MID"
                    ? "bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20"
                    : "bg-white border-slate-200/80 text-slate-600"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Mid Stage</span>
                  {p.stage === "MID" && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 rounded-full px-2 py-0.5">
                      Selected
                    </span>
                  )}
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Employs simple sentences, validating repetition, structured choices, familiar image prompts, and gentle reorientation.
                </p>
              </div>

              <div
                className={`rounded-xl border p-4 space-y-2 transition-all ${
                  p.stage === "LATE"
                    ? "bg-purple-50/70 border-purple-300 ring-2 ring-purple-500/20"
                    : "bg-white border-slate-200/80 text-slate-600"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Late Stage</span>
                  {p.stage === "LATE" && (
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-100 rounded-full px-2 py-0.5">
                      Selected
                    </span>
                  )}
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Prioritizes sensory reassurance, familiar voice greetings, favorite music, calming presence, and emotional validation.
                </p>
              </div>
            </div>
          </SectionCard>

          {/* Communication, Comfort & Daily Routine */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <SectionCard
              title="Communication & Comfort Style"
              subtitle="Direct guidance for the AI assistant and care team."
            >
              <div className="space-y-4 text-sm">
                <div>
                  <span className="text-xs font-semibold text-slate-700 block mb-1">
                    Communication Preferences
                  </span>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed">
                    {p.communicationPreferences || "No specific communication style specified. The assistant speaks calmly and respectfully in simple sentences."}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-700 block mb-1">
                    Comfort & Soothing Preferences
                  </span>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed">
                    {p.comfortPreferences || "No specific comfort soothing preferences configured."}
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Daily Routine"
              subtitle="Predictable sequence providing structure and orientation."
            >
              {p.routines && p.routines.length > 0 ? (
                <ol className="space-y-2.5 text-xs text-slate-700">
                  {p.routines.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-100 text-[11px] font-bold text-teal-800">
                        {i + 1}
                      </span>
                      <span className="pt-0.5">{item}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  No daily routine has been added yet. Add regular steps (e.g. morning tea, afternoon garden walk) to help ground the patient.
                </p>
              )}
            </SectionCard>
          </div>

          {/* Emergency Contacts */}
          <SectionCard
            title="Emergency & Safety Contacts"
            subtitle="Individuals notified immediately if acute distress is detected."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {p.emergencyContacts && p.emergencyContacts.length > 0 ? (
                p.emergencyContacts.map((c, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{c.name}</span>
                        {c.isPrimary && (
                          <span className="text-[10px] font-bold bg-teal-100 text-teal-800 rounded-full px-2 py-0.5">
                            Primary
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500">{c.relationship}</span>
                    </div>
                    <a
                      href={`tel:${c.phone}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 text-teal-800 font-semibold text-xs hover:bg-teal-100 transition-colors"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      <span>{c.phone}</span>
                    </a>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic col-span-2">
                  No emergency contacts configured.
                </p>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>Local Emergency Services:</span>
              <span className="font-semibold text-slate-900">
                {p.emergencyServicesPhone || "112 / 911 (Not specifically configured)"}
              </span>
            </div>
          </SectionCard>
        </div>
      )}

      {/* Tab 3: Family */}
      {tab === "Family" && <ProfileFamilyPanel id={id} />}

      {/* Tab 4: Memories */}
      {tab === "Memories" && <ProfileMemoriesPanel id={id} />}

      {/* Tab 5: Activities & Games */}
      {tab === "Activities & Games" && <ProfileGamesPanel id={id} />}

      {/* Tab 6: Privacy */}
      {tab === "Privacy" && <PrivacyPanel id={id} />}

      {/* Tab 7: Device */}
      {tab === "Device" && <DevicePanel id={id} />}
    </PageContainer>
  );
}

// ─── PROFILE FAMILY PANEL ────────────────────────────────────────────────────

function ProfileFamilyPanel({ id }: { id: string }) {
  const cache = useQueryClient();
  const query = useQuery({
    queryKey: ["family", id],
    queryFn: () => familyService.getFamilyMembers(id),
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FamilyMember | null>(null);
  const [form, setForm] = useState({
    name: "",
    relationship: "",
    phone: "",
    description: "",
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [voice, setVoice] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  function openAdd() {
    setEditing(null);
    setForm({ name: "", relationship: "", phone: "", description: "" });
    setPhoto(null);
    setVoice(null);
    setFormError("");
    setOpen(true);
  }

  function openEdit(m: FamilyMember) {
    setEditing(m);
    setForm({
      name: m.name,
      relationship: m.relationship || "",
      phone: m.phone || "",
      description: m.description || "",
    });
    setPhoto(null);
    setVoice(null);
    setFormError("");
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError("");
    try {
      let photoUrl: string | undefined = editing?.photoUrl;
      let voiceUrl: string | undefined = editing?.voiceRecordingUrl;
      if (photo) photoUrl = (await mediaService.uploadMedia(photo, "photo", id)).url;
      if (voice) voiceUrl = (await mediaService.uploadMedia(voice, "audio", id)).url;
      const payload = {
        ...form,
        ...(photoUrl ? { photoUrl } : {}),
        ...(voiceUrl ? { voiceRecordingUrl: voiceUrl } : {}),
      };
      if (editing) await familyService.updateFamilyMember(id, editing.id, payload as never);
      else await familyService.addFamilyMember(id, payload as never);
      await cache.invalidateQueries({ queryKey: ["family", id] });
      setOpen(false);
    } catch {
      setFormError("Could not save family member. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const del = useMutation({
    mutationFn: (fid: string) => familyService.deleteFamilyMember(id, fid),
    onSuccess: () => cache.invalidateQueries({ queryKey: ["family", id] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Family Circle</h3>
          <p className="text-xs text-slate-500">
            Relational context used by the AI companion for family recall and reassuring voice greetings.
          </p>
        </div>
        <Button variant="teal" size="sm" onClick={openAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          <span>Add Family Member</span>
        </Button>
      </div>

      <Modal
        isOpen={open}
        onClose={() => !busy && setOpen(false)}
        title={editing ? "Edit Family Member" : "Add Family Member"}
        description="Provide details and optional voice clips so the patient companion can recognize and display loved ones."
      >
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Full Name *
            </label>
            <Input
              required
              maxLength={100}
              placeholder="e.g. Maya Chen"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Relationship to Patient *
            </label>
            <Input
              required
              maxLength={80}
              placeholder="e.g. Daughter, Eldest Son, Sister"
              value={form.relationship}
              onChange={(e) => setForm({ ...form, relationship: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Phone Number (Optional)
            </label>
            <Input
              type="tel"
              maxLength={30}
              placeholder="e.g. +1 555-0199"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Notes & Description (Optional)
            </label>
            <textarea
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              rows={3}
              maxLength={400}
              placeholder="e.g. Visits on Sundays, lives nearby in Boston."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Photo (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Reassuring Voice Clip (Optional)
              </label>
              <input
                type="file"
                accept="audio/*"
                className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                onChange={(e) => setVoice(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {formError}
            </div>
          )}

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="teal"
              size="sm"
              disabled={busy}
              isLoading={busy}
            >
              {editing ? "Save Changes" : "Add Family Member"}
            </Button>
          </div>
        </form>
      </Modal>

      {query.isLoading ? (
        <LoadingSkeleton />
      ) : query.isError ? (
        <ErrorState
          message="Could not load family members. Please verify your connection."
          onRetry={() => query.refetch()}
        />
      ) : !query.data || query.data.length === 0 ? (
        <EmptyState
          icon={<User className="h-6 w-6" />}
          title="No family members registered yet"
          description="Add close family members with photos and recorded voice clips to reassure the patient during moments of anxiety."
          action={
            <Button variant="teal" size="sm" onClick={openAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              <span>Add First Family Member</span>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {query.data.map((m) => (
            <div
              key={m.id}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <ProfileAvatar name={m.name} src={m.photoUrl} size="lg" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{m.name}</h4>
                      <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                        {m.relationship || "Family"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(m)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                      title="Edit"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Are you sure you want to remove ${m.name} from the family circle?`
                          )
                        ) {
                          del.mutate(m.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {m.description && (
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {m.description}
                  </p>
                )}

                {m.phone && (
                  <div className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <a href={`tel:${m.phone}`} className="hover:text-teal-700 font-medium">
                      {m.phone}
                    </a>
                  </div>
                )}

                {m.voiceRecordingUrl && (
                  <div className="pt-2">
                    <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1 mb-1">
                      <Volume2 className="h-3.5 w-3.5 text-teal-600" /> Recorded Greeting
                    </span>
                    <audio
                      controls
                      preload="none"
                      src={m.voiceRecordingUrl}
                      className="w-full h-8"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PROFILE MEMORIES PANEL ──────────────────────────────────────────────────

const categories: { label: string; value: string }[] = [
  { label: "All Categories", value: "ALL" },
  { label: "Family", value: "FAMILY" },
  { label: "Career", value: "CAREER" },
  { label: "Travel", value: "TRAVEL" },
  { label: "Childhood", value: "CHILDHOOD" },
  { label: "Hobby", value: "HOBBY" },
  { label: "Music", value: "MUSIC" },
  { label: "Special Event", value: "SPECIAL_EVENT" },
  { label: "Other", value: "OTHER" },
];

function ProfileMemoriesPanel({ id }: { id: string }) {
  const cache = useQueryClient();
  const query = useQuery({
    queryKey: ["memories", id, "all"],
    queryFn: () => memoryService.getMemories(id),
  });

  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterSensitivity, setFilterSensitivity] = useState("ALL");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Memory | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "FAMILY" as MemoryCategory,
    sensitivity: "LOW" as SensitivityLevel,
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [audio, setAudio] = useState<File | null>(null);
  const [flags, setFlags] = useState({
    aiMayKnowInternally: true,
    aiMayMentionDirectly: false,
    visibleToPatient: true,
    useForRedirection: false,
    approved: true,
  });
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  function openAdd() {
    setEditing(null);
    setForm({
      title: "",
      description: "",
      category: "FAMILY",
      sensitivity: "LOW",
    });
    setFlags({
      aiMayKnowInternally: true,
      aiMayMentionDirectly: false,
      visibleToPatient: true,
      useForRedirection: false,
      approved: true,
    });
    setPhoto(null);
    setAudio(null);
    setFormError("");
    setOpen(true);
  }

  function openEdit(m: Memory) {
    setEditing(m);
    setForm({
      title: m.title,
      description: m.description || "",
      category: (m.category as MemoryCategory) || "FAMILY",
      sensitivity: (m.sensitivity as SensitivityLevel) || "LOW",
    });
    setFlags({
      aiMayKnowInternally: m.aiMayKnowInternally ?? true,
      aiMayMentionDirectly: m.aiMayMentionDirectly ?? false,
      visibleToPatient: m.visibleToPatient ?? true,
      useForRedirection: m.useForRedirection ?? false,
      approved: m.approved ?? true,
    });
    setPhoto(null);
    setAudio(null);
    setFormError("");
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError("");
    try {
      let imageUrl: string | undefined = editing?.imageUrl;
      let audioUrl: string | undefined = editing?.audioUrl;
      if (photo) imageUrl = (await mediaService.uploadMedia(photo, "photo", id)).url;
      if (audio) audioUrl = (await mediaService.uploadMedia(audio, "audio", id)).url;
      const payload = {
        ...form,
        ...flags,
        ...(imageUrl ? { imageUrl } : {}),
        ...(audioUrl ? { audioUrl } : {}),
      };
      if (editing) await memoryService.updateMemory(id, editing.id, payload as never);
      else await memoryService.createMemory(id, payload as never);
      await cache.invalidateQueries({ queryKey: ["memories", id] });
      setOpen(false);
    } catch {
      setFormError("Could not save memory. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const del = useMutation({
    mutationFn: (mid: string) => memoryService.deleteMemory(id, mid),
    onSuccess: () => cache.invalidateQueries({ queryKey: ["memories", id] }),
  });

  const filteredMemories = React.useMemo(() => {
    if (!query.data) return [];
    return query.data.filter((m) => {
      const matchCat =
        filterCategory === "ALL" ||
        (m.category || "").toUpperCase() === filterCategory;
      const matchSens =
        filterSensitivity === "ALL" ||
        (m.sensitivity || "LOW").toUpperCase() === filterSensitivity;
      return matchCat && matchSens;
    });
  }, [query.data, filterCategory, filterSensitivity]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Personal Memories Library</h3>
          <p className="text-xs text-slate-500">
            Life stories and familiar anchors used by the AI companion for reminiscence and gentle redirection.
          </p>
        </div>
        <Button variant="teal" size="sm" onClick={openAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          <span>Add Memory</span>
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200/80">
        <span className="text-xs font-medium text-slate-500">Filter by:</span>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700"
        >
          {categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        <select
          value={filterSensitivity}
          onChange={(e) => setFilterSensitivity(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700"
        >
          <option value="ALL">All Sensitivities</option>
          <option value="LOW">Low Sensitivity</option>
          <option value="MEDIUM">Medium Sensitivity</option>
          <option value="HIGH">High Sensitivity</option>
        </select>
      </div>

      {/* Modal */}
      <Modal
        isOpen={open}
        onClose={() => !busy && setOpen(false)}
        title={editing ? "Edit Personal Memory" : "Add Personal Memory"}
        description="Share a life memory that the companion can reference to stimulate reminiscence and reduce evening distress."
      >
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Title *
            </label>
            <Input
              required
              maxLength={150}
              placeholder="e.g. Summer Vacation in Bar Harbor"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value as MemoryCategory })
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800"
              >
                <option value="FAMILY">Family</option>
                <option value="CAREER">Career</option>
                <option value="TRAVEL">Travel</option>
                <option value="CHILDHOOD">Childhood</option>
                <option value="HOBBY">Hobby</option>
                <option value="MUSIC">Music</option>
                <option value="SPECIAL_EVENT">Special Event</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Sensitivity
              </label>
              <select
                value={form.sensitivity}
                onChange={(e) =>
                  setForm({ ...form, sensitivity: e.target.value as SensitivityLevel })
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800"
              >
                <option value="LOW">Low (Comforting)</option>
                <option value="MEDIUM">Medium (Handle with care)</option>
                <option value="HIGH">High (Sensitive topics)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Description / Story Details *
            </label>
            <textarea
              required
              rows={4}
              maxLength={2000}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="Describe the memory vividly: who was there, favorite details, sensory memories."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Memory Photo (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Audio Story / Clip (Optional)
              </label>
              <input
                type="file"
                accept="audio/*"
                className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                onChange={(e) => setAudio(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          {/* Care Toggles */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-2 text-xs">
            <span className="font-semibold text-slate-800 block mb-1">
              Caregiver AI & Visibility Controls
            </span>
            {[
              ["approved", "Approved for patient companion usage"],
              ["aiMayKnowInternally", "AI may know internally for context grounding"],
              ["aiMayMentionDirectly", "AI may proactively introduce this memory in conversation"],
              ["visibleToPatient", "Visible in patient's memory browsing interface"],
              ["useForRedirection", "Flag for calming redirection during distress episodes"],
            ].map(([k, label]) => (
              <label key={k} className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-3.5 w-3.5"
                  checked={flags[k as keyof typeof flags]}
                  onChange={(e) =>
                    setFlags({ ...flags, [k]: e.target.checked })
                  }
                />
                <span className="text-slate-700">{label}</span>
              </label>
            ))}
          </div>

          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {formError}
            </div>
          )}

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="teal"
              size="sm"
              disabled={busy}
              isLoading={busy}
            >
              {editing ? "Save Memory" : "Add Memory"}
            </Button>
          </div>
        </form>
      </Modal>

      {query.isLoading ? (
        <LoadingSkeleton />
      ) : query.isError ? (
        <ErrorState
          message="Could not load memories. Please verify your connection."
          onRetry={() => query.refetch()}
        />
      ) : filteredMemories.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="h-6 w-6" />}
          title="No memories found"
          description={
            query.data?.length === 0
              ? "Add personal stories and cherished recollections so the companion can foster comforting, familiar conversations."
              : "No memories match your current category and sensitivity filters."
          }
          action={
            query.data?.length === 0 ? (
              <Button variant="teal" size="sm" onClick={openAdd} className="gap-2">
                <Plus className="h-4 w-4" />
                <span>Add First Memory</span>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMemories.map((m) => (
            <div
              key={m.id}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {m.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                        {String(m.category || "GENERAL").replace("_", " ")}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          m.sensitivity === "HIGH"
                            ? "bg-rose-50 text-rose-700"
                            : m.sensitivity === "MEDIUM"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-teal-50 text-teal-700"
                        }`}
                      >
                        {m.sensitivity || "LOW"} Sensitivity
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(m)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                      title="Edit"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Are you sure you want to delete the memory "${m.title}"?`
                          )
                        ) {
                          del.mutate(m.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {m.imageUrl && (
                  <div className="rounded-xl overflow-hidden max-h-36 bg-slate-100">
                    <img
                      src={m.imageUrl}
                      alt={m.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {m.description && (
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {m.description}
                  </p>
                )}

                {m.audioUrl && (
                  <audio
                    controls
                    preload="none"
                    src={m.audioUrl}
                    className="w-full h-8"
                  />
                )}
              </div>

              {/* Badges footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[10px]">
                {m.approved ? (
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                    Approved
                  </span>
                ) : (
                  <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                    Pending
                  </span>
                )}
                {m.aiMayMentionDirectly && (
                  <span className="text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full font-medium">
                    Proactive Recall
                  </span>
                )}
                {m.useForRedirection && (
                  <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full font-medium">
                    Redirection
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PROFILE GAMES & COGNITIVE ACTIVITIES PANEL ──────────────────────────────

interface CardItem {
  id: string;
  uniqueId: number;
  label: string;
  category: string;
  imageUrl: string;
}

const INITIAL_MATCH_CARDS: Omit<CardItem, "uniqueId">[] = [
  {
    id: "sarah",
    label: "Sarah (Daughter)",
    category: "Family",
    imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "cornwall",
    label: "Cornwall Seaside",
    category: "Memory",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "piano",
    label: "Grand Piano",
    category: "Music",
    imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80",
  },
];

const ROUTINE_STEPS_PATTERN = [
  { id: "1", label: "08:00 AM - Morning Earl Grey tea & honey toast" },
  { id: "2", label: "09:45 AM - Light garden walk & rose pruning" },
  { id: "3", label: "11:00 AM - Classical radio & piano practice" },
  { id: "4", label: "01:00 PM - Lunch with warm vegetable soup" },
];

function ProfileGamesPanel({ id }: { id: string }) {
  const patient = usePatientQuery(id);
  const p = patient.data;

  // 1. Card Matching Game State
  const [cards, setCards] = useState<CardItem[]>(() =>
    [...INITIAL_MATCH_CARDS, ...INITIAL_MATCH_CARDS]
      .map((c, idx) => ({ ...c, uniqueId: idx }))
      .sort(() => Math.random() - 0.5)
  );
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [matchCount, setMatchCount] = useState(0);

  function resetCardGame() {
    setCards(
      [...INITIAL_MATCH_CARDS, ...INITIAL_MATCH_CARDS]
        .map((c, idx) => ({ ...c, uniqueId: idx }))
        .sort(() => Math.random() - 0.5)
    );
    setFlipped([]);
    setMatched([]);
    setMatchCount(0);
  }

  function handleCardClick(uniqueId: number) {
    if (flipped.length === 2 || flipped.includes(uniqueId)) return;
    const clickedCard = cards.find((c) => c.uniqueId === uniqueId);
    if (!clickedCard || matched.includes(clickedCard.id)) return;

    const newFlipped = [...flipped, uniqueId];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMatchCount((c) => c + 1);
      const firstCard = cards.find((c) => c.uniqueId === newFlipped[0]);
      const secondCard = cards.find((c) => c.uniqueId === newFlipped[1]);

      if (firstCard && secondCard && firstCard.id === secondCard.id) {
        setMatched((prev) => [...prev, firstCard.id]);
        setFlipped([]);
      } else {
        setTimeout(() => {
          setFlipped([]);
        }, 1000);
      }
    }
  }

  // 2. Pattern Finding Game State (Daily Schedule Order)
  const [shuffledSteps, setShuffledSteps] = useState(() =>
    [...ROUTINE_STEPS_PATTERN].sort(() => Math.random() - 0.5)
  );
  const [patternSequence, setPatternSequence] = useState<string[]>([]);

  function resetPatternGame() {
    setShuffledSteps([...ROUTINE_STEPS_PATTERN].sort(() => Math.random() - 0.5));
    setPatternSequence([]);
  }

  function handlePatternStepClick(stepId: string) {
    if (patternSequence.includes(stepId)) return;
    setPatternSequence([...patternSequence, stepId]);
  }

  const isPatternCorrect =
    patternSequence.length === ROUTINE_STEPS_PATTERN.length &&
    patternSequence.every((id, idx) => id === ROUTINE_STEPS_PATTERN[idx].id);

  // 3. Cognitive Music Match State
  const [selectedMelodyAnswer, setSelectedMelodyAnswer] = useState<string | null>(null);

  const activeGames = [
    {
      id: "card_match_family",
      title: "Card Match: Loved Ones",
      type: "Card Matching",
      description: "Interactive card matching game matching familiar family faces and names.",
      icon: <Layers className="h-5 w-5 text-teal-600" />,
      tag: "Memory & Recognition",
    },
    {
      id: "card_match_memories",
      title: "Card Match: Cherished Places",
      type: "Card Matching",
      description: "Photo recognition game pairing familiar memories and travel photos.",
      icon: <Sparkles className="h-5 w-5 text-purple-600" />,
      tag: "Visual Recall",
    },
    {
      id: "pattern_routine",
      title: "Pattern Finding: Day Schedule",
      type: "Pattern Finding",
      description: "Sequential pattern game arranging daily routine events in chronological order.",
      icon: <Brain className="h-5 w-5 text-amber-600" />,
      tag: "Orientation & Sequencing",
    },
    {
      id: "cognitive_reminisce",
      title: "Cognitive Exercise: Reminisce",
      type: "Cognitive Gaming",
      description: "Gentle reminiscence prompts built from Ellie's 32-year teaching career and gardening.",
      icon: <Heart className="h-5 w-5 text-rose-600" />,
      tag: "Story & Association",
    },
    {
      id: "melody_match",
      title: "Cognitive Game: Melody Match",
      type: "Cognitive Gaming",
      description: "Musical cognitive exercise linking Chopin & Debussy piano melodies with peaceful moments.",
      icon: <Music className="h-5 w-5 text-indigo-600" />,
      tag: "Auditory & Emotion",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-teal-500/10 via-teal-50/50 to-slate-50 border border-teal-200/60 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-teal-100 text-teal-800">
              <Gamepad2 className="h-5 w-5" />
            </span>
            <h3 className="text-lg font-bold text-slate-900">
              Cognitive Gaming & Activity Center
            </h3>
          </div>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            Personalized, failure-free cognitive exercises configured for {p?.preferredName || "Eleanor"}. These games stimulate orientation, facial recognition, and sequential pattern finding without creating stress or performance anxiety.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold bg-teal-100 text-teal-800 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs">
            <CheckCircle className="h-3.5 w-3.5 text-teal-600" />
            5 Active Games Configured
          </span>
        </div>
      </div>

      {/* Active Games Grid */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Brain className="h-4 w-4 text-teal-700" />
          Active Companion Games (Live on Patient App)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeGames.map((game) => (
            <div
              key={game.id}
              className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs hover:border-teal-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      {game.icon}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold tracking-wide uppercase text-teal-700 block">
                        {game.type}
                      </span>
                      <h5 className="text-sm font-bold text-slate-900 leading-tight">
                        {game.title}
                      </h5>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mt-1">
                  {game.description}
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  {game.tag}
                </span>
                <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                  <Check className="h-3 w-3" /> Enabled
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Game 1: Card Matching Game */}
      <SectionCard
        title="Interactive Preview: Memory Card Matching"
        subtitle="Test or play the facial and memory card matching game configured for Eleanor."
        headerIcon={<Layers className="h-4 w-4 text-teal-700" />}
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={resetCardGame}
            className="gap-1 text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Cards</span>
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span>
              Matches Found: <strong className="text-teal-700 font-bold">{matched.length} / 3</strong>
            </span>
            <span>
              Attempts: <strong className="text-slate-800 font-bold">{matchCount}</strong>
            </span>
          </div>

          {matched.length === 3 ? (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
              <Trophy className="h-8 w-8 text-emerald-600 mx-auto" />
              <h4 className="text-sm font-bold text-emerald-900">
                Wonderful job! All Cards Matched!
              </h4>
              <p className="text-xs text-emerald-700 max-w-sm mx-auto">
                Eleanor successfully recognized and paired her familiar family memories.
              </p>
              <Button
                variant="teal"
                size="sm"
                onClick={resetCardGame}
                className="mt-2 text-xs"
              >
                Play Again
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {cards.map((c) => {
                const isFlipped = flipped.includes(c.uniqueId) || matched.includes(c.id);
                return (
                  <button
                    key={c.uniqueId}
                    type="button"
                    onClick={() => handleCardClick(c.uniqueId)}
                    className={`h-36 rounded-2xl border transition-all flex flex-col items-center justify-center p-2 text-center cursor-pointer select-none relative overflow-hidden ${
                      isFlipped
                        ? matched.includes(c.id)
                          ? "bg-teal-50/80 border-teal-400 shadow-soft"
                          : "bg-white border-teal-300 shadow-md scale-102"
                        : "bg-gradient-to-br from-slate-100 to-slate-200 border-slate-300 hover:border-teal-400 hover:bg-teal-50/30"
                    }`}
                  >
                    {isFlipped ? (
                      <>
                        <div className="h-16 w-16 rounded-xl overflow-hidden mb-2 bg-slate-100 shadow-xs">
                          <img
                            src={c.imageUrl}
                            alt={c.label}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <span className="text-[11px] font-bold text-slate-800 leading-tight">
                          {c.label}
                        </span>
                        <span className="text-[9px] text-teal-700 font-semibold mt-0.5">
                          {c.category}
                        </span>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-slate-400">
                        <Brain className="h-7 w-7 text-teal-600/70" />
                        <span className="text-[10px] font-bold text-slate-500">Tap Card</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </SectionCard>

      {/* Interactive Game 2: Pattern Finding Game */}
      <SectionCard
        title="Interactive Preview: Pattern Finding (Day Routine Sequence)"
        subtitle="Arrange the steps in the correct chronological pattern to practice sequential orientation."
        headerIcon={<Brain className="h-4 w-4 text-teal-700" />}
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={resetPatternGame}
            className="gap-1 text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Pattern</span>
          </Button>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Tap each card in order from morning to afternoon to discover the full daily sequence pattern:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {shuffledSteps.map((step) => {
              const selectedIndex = patternSequence.indexOf(step.id);
              const isSelected = selectedIndex !== -1;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => handlePatternStepClick(step.id)}
                  disabled={isSelected}
                  className={`p-3.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? "bg-teal-50 border-teal-300 text-teal-900 font-semibold"
                      : "bg-white border-slate-200/90 text-slate-700 hover:border-teal-300 hover:bg-slate-50"
                  }`}
                >
                  <span>{step.label}</span>
                  {isSelected && (
                    <span className="h-6 w-6 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                      {selectedIndex + 1}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {patternSequence.length > 0 && (
            <div className="pt-2 flex items-center justify-between text-xs">
              <span className="text-slate-600">
                Pattern sequence selected: {patternSequence.length} of {ROUTINE_STEPS_PATTERN.length}
              </span>
              {patternSequence.length === ROUTINE_STEPS_PATTERN.length && (
                isPatternCorrect ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    Correct Pattern Found!
                  </span>
                ) : (
                  <span className="text-amber-700 font-medium">
                    Close! Try resetting to find the exact order.
                  </span>
                )
              )}
            </div>
          )}
        </div>
      </SectionCard>

      {/* Interactive Game 3: Cognitive Melody Match */}
      <SectionCard
        title="Interactive Preview: Cognitive Melody Match"
        subtitle="Auditory recognition game linking classical piano melodies to pleasant feelings."
        headerIcon={<Music className="h-4 w-4 text-teal-700" />}
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold text-slate-900 block mb-0.5">
                Now Playing: Gentle Piano Melody
              </span>
              <p className="text-slate-500 text-[11px]">
                Listen to the classical piece and identify the calming piece Ellie knows:
              </p>
            </div>
            <audio
              controls
              src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
              className="h-8 max-w-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: "debussy", label: "Debussy — Clair de Lune", isCorrect: true },
              { id: "jazz", label: "Modern Upbeat Jazz", isCorrect: false },
              { id: "brass", label: "Military Brass March", isCorrect: false },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedMelodyAnswer(opt.id)}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  selectedMelodyAnswer === opt.id
                    ? opt.isCorrect
                      ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-bold"
                      : "bg-slate-100 border-slate-300 text-slate-700"
                    : "bg-white border-slate-200 hover:border-teal-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {selectedMelodyAnswer && (
            <div className="p-3 rounded-xl bg-teal-50 border border-teal-100 text-teal-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-teal-600 shrink-0" />
              <span>
                {selectedMelodyAnswer === "debussy"
                  ? "Correct! Soft piano melodies like Clair de Lune are proven to ground Ellie during evening sundowning."
                  : "Good effort! Gentle, slow classical music is preferred to keep Eleanor relaxed."}
              </span>
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
