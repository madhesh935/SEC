"use client";

import * as React from "react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Music,
  Activity,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Volume2,
  Clock,
  Sparkles,
  Info,
} from "lucide-react";
import { usePatientStore } from "@/store/patient.store";
import { portalService, ManagedActivity } from "@/services/portal.service";
import { familyService } from "@/services/family.service";
import { memoryService } from "@/services/memory.service";
import { mediaService } from "@/services/media.service";
import { FamilyMember, Memory } from "@/types";
import {
  PageContainer,
  PageHeader,
  SectionCard,
  ProfileAvatar,
  StatusBadge,
  EmptyState,
  LoadingSkeleton,
  ErrorState,
  TabNavigation,
} from "@/components/design-system";
import { Modal } from "@/components/ui/modal";
import { formatRelativeTime } from "@/utils/formatters";

// Re-export Insights for backwards compatibility
export { Insights } from "./Insights";

export function CareContent() {
  const searchParams = useSearchParams();
  const tabs = ["Family", "Memories", "Comfort", "Activities"];
  const urlTab = searchParams?.get("tab");
  const initialTab = tabs.includes(urlTab || "") ? (urlTab as string) : "Family";
  const [activeTab, setActiveTab] = useState(initialTab);

  const selectedPatientId = usePatientStore((s) => s.selectedPatientId);

  return (
    <PageContainer>
      <PageHeader
        title="Care Content"
        subtitle="Familiar people, personal memories, soothing sounds, and cognitive activities configured for your patient's device."
      />

      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {!selectedPatientId ? (
        <EmptyState
          title="No patient selected"
          description="Select a patient from the top bar to manage family members, memories, comfort audio, and cognitive activities."
        />
      ) : (
        <div key={selectedPatientId} className="pt-2">
          {activeTab === "Family" && <FamilyPanel patientId={selectedPatientId} />}
          {activeTab === "Memories" && <MemoriesPanel patientId={selectedPatientId} />}
          {activeTab === "Comfort" && <ComfortPanel patientId={selectedPatientId} />}
          {activeTab === "Activities" && <ActivitiesPanel patientId={selectedPatientId} />}
        </div>
      )}
    </PageContainer>
  );
}

// ─── TAB 1: FAMILY CIRCLE (Step 24) ──────────────────────────────────────────

function FamilyPanel({ patientId }: { patientId: string }) {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

  const query = useQuery({
    queryKey: ["family", patientId],
    queryFn: () => familyService.getFamilyMembers(patientId),
  });

  const deleteMutation = useMutation({
    mutationFn: (memberId: string) =>
      familyService.deleteFamilyMember(patientId, memberId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["family", patientId] }),
  });

  const handleDelete = (member: FamilyMember) => {
    if (
      window.confirm(
        `Are you sure you want to remove ${member.name} from the family circle?`
      )
    ) {
      deleteMutation.mutate(member.id);
    }
  };

  const handleOpenAdd = () => {
    setEditingMember(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (member: FamilyMember) => {
    setEditingMember(member);
    setIsModalOpen(true);
  };

  if (query.isLoading) {
    return <LoadingSkeleton />;
  }

  if (query.isError) {
    return (
      <ErrorState
        message="Unable to load family members."
        onRetry={() => void query.refetch()}
      />
    );
  }

  const members = query.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Family Circle ({members.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Loved ones and close relatives whose photos and voices are recognized by the patient app.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs shrink-0 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add Family Member
        </button>
      </div>

      {members.length === 0 ? (
        <EmptyState
          title="No family members registered yet"
          description="Add children, spouses, grandchildren, and caregivers so GeriCare can mention them by name and display their photos."
          action={
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Add First Family Member
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {members.map((member) => (
            <div
              key={member.id}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="flex items-start gap-3.5">
                  <ProfileAvatar
                    src={member.photoUrl}
                    name={member.name}
                    size="lg"
                    className="shadow-2xs"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900 truncate">
                        {member.name}
                      </h3>
                      {member.relationship && (
                        <StatusBadge
                          status={member.relationship}
                          variant="teal"
                          className="text-[10px] py-0"
                        />
                      )}
                    </div>
                    {member.phone && (
                      <a
                        href={`tel:${member.phone}`}
                        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-teal-700 mt-1"
                      >
                        <Phone className="h-3 w-3" />
                        <span>{member.phone}</span>
                      </a>
                    )}
                  </div>
                </div>

                {member.description && (
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100/80 line-clamp-3">
                    {member.description}
                  </p>
                )}

                {member.voiceRecordingUrl && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Volume2 className="h-3 w-3 text-teal-600" /> Voice Greeting
                    </span>
                    <audio
                      controls
                      preload="none"
                      src={member.voiceRecordingUrl}
                      className="w-full h-8"
                      aria-label={`Voice note from ${member.name}`}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3.5 mt-4 text-xs">
                <span className="text-[11px] text-slate-400">
                  {member.patientVisible !== false ? "Visible on device" : "Caregiver only"}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(member)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Edit details"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(member)}
                    disabled={deleteMutation.isPending}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Remove member"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Family Modal */}
      <FamilyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        patientId={patientId}
        editingMember={editingMember}
      />
    </div>
  );
}

function FamilyModal({
  isOpen,
  onClose,
  patientId,
  editingMember,
}: {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  editingMember: FamilyMember | null;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [patientVisible, setPatientVisible] = useState(true);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  React.useEffect(() => {
    if (editingMember) {
      setName(editingMember.name || "");
      setRelationship(editingMember.relationship || "");
      setPhone(editingMember.phone || "");
      setDescription(editingMember.description || "");
      setPatientVisible(editingMember.patientVisible !== false);
    } else {
      setName("");
      setRelationship("");
      setPhone("");
      setDescription("");
      setPatientVisible(true);
    }
    setPhotoFile(null);
    setVoiceFile(null);
    setErrorMsg("");
  }, [editingMember, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      let photoUrl = editingMember?.photoUrl;
      let voiceRecordingUrl = editingMember?.voiceRecordingUrl;

      if (photoFile) {
        const uploadRes = await mediaService.uploadMedia(photoFile, "photo", patientId);
        photoUrl = uploadRes.url;
      }

      if (voiceFile) {
        const uploadRes = await mediaService.uploadMedia(voiceFile, "audio", patientId);
        voiceRecordingUrl = uploadRes.url;
      }

      const payload = {
        name,
        relationship,
        phone: phone || undefined,
        description: description || undefined,
        patientVisible,
        photoUrl,
        voiceRecordingUrl,
      };

      if (editingMember) {
        await familyService.updateFamilyMember(patientId, editingMember.id, payload);
      } else {
        await familyService.addFamilyMember(patientId, payload as never);
      }

      await queryClient.invalidateQueries({ queryKey: ["family", patientId] });
      onClose();
    } catch {
      setErrorMsg("Failed to save family member. Please check input and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingMember ? "Edit Family Member" : "Add Family Member"}
      description="Connect loved ones to the patient's companion for familiar voices and photo recognition."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Maya Sharma"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Relationship *
          </label>
          <input
            type="text"
            required
            maxLength={80}
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            placeholder="e.g. Daughter, Spouse, Grandson, Sister"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Phone Number (Optional)
          </label>
          <input
            type="tel"
            maxLength={30}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. +1 555-0199"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Care Notes / Key Memory (Optional)
          </label>
          <textarea
            maxLength={400}
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Visits on Sundays with grandson Kabir; loves sharing gardening stories."
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Photo (Optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
              className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Voice Note (Optional)
            </label>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setVoiceFile(e.target.files?.[0] || null)}
              className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={patientVisible}
              onChange={(e) => setPatientVisible(e.target.checked)}
              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
            />
            <span>Make visible on patient app (photos & voice messages)</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs"
          >
            {isSubmitting ? "Saving…" : editingMember ? "Save Changes" : "Add Member"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── TAB 2: PERSONAL MEMORIES (Step 25) ───────────────────────────────────────

function MemoriesPanel({
  patientId,
  comfortOnly = false,
}: {
  patientId: string;
  comfortOnly?: boolean;
}) {
  const queryClient = useQueryClient();
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [sensitivityFilter, setSensitivityFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);

  const query = useQuery({
    queryKey: ["memories", patientId, comfortOnly ? "comfort" : "all"],
    queryFn: async () => {
      const all = await memoryService.getMemories(patientId);
      return comfortOnly
        ? all.filter(
            (m) =>
              m.category === "MUSIC" ||
              (m.category as string) === "RELAXING_SOUND" ||
              !!m.audioUrl
          )
        : all;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (memoryId: string) =>
      memoryService.deleteMemory(patientId, memoryId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["memories", patientId] }),
  });

  const handleDelete = (memory: Memory) => {
    if (window.confirm(`Delete memory "${memory.title}"?`)) {
      deleteMutation.mutate(memory.id);
    }
  };

  if (query.isLoading) {
    return <LoadingSkeleton />;
  }

  if (query.isError) {
    return (
      <ErrorState
        message="Unable to load personal memories."
        onRetry={() => void query.refetch()}
      />
    );
  }

  const allMemories = query.data || [];

  const filteredMemories = allMemories.filter((m) => {
    if (categoryFilter !== "ALL" && m.category !== categoryFilter) return false;
    if (sensitivityFilter !== "ALL" && m.sensitivity !== sensitivityFilter) return false;
    return true;
  });

  const categories = [
    "ALL",
    "FAMILY",
    "CAREER",
    "TRAVEL",
    "CHILDHOOD",
    "HOBBY",
    "MUSIC",
    "SPECIAL_EVENT",
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            {comfortOnly ? "Comfort Audio & Media" : `Personal Memories (${allMemories.length})`}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {comfortOnly
              ? "Soothing sounds, favorite songs, and calming recordings for comforting moments."
              : "Stories, milestones, and personal history used to gently ground companion conversations."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingMemory(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs shrink-0 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          {comfortOnly ? "Add Comfort Audio" : "Add Memory"}
        </button>
      </div>

      {/* Category & Sensitivity Filters */}
      {!comfortOnly && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  categoryFilter === cat
                    ? "bg-teal-600 text-white shadow-2xs"
                    : "text-slate-600 hover:bg-white"
                }`}
              >
                {cat === "ALL"
                  ? "All Categories"
                  : cat.replace("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
            <span className="font-semibold">Sensitivity:</span>
            <select
              value={sensitivityFilter}
              onChange={(e) => setSensitivityFilter(e.target.value)}
              className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-medium"
            >
              <option value="ALL">All Levels</option>
              <option value="LOW">Low (Standard)</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High (Careful Handling)</option>
            </select>
          </div>
        </div>
      )}

      {filteredMemories.length === 0 ? (
        <EmptyState
          title={comfortOnly ? "No comfort media added yet" : "No memories match the filter"}
          description={
            comfortOnly
              ? "Add favourite classical music, familiar ambient sounds, or family audio clips to help calm tension."
              : "Record stories from their childhood, career, travels, or family gatherings to personalize the companion."
          }
          action={
            <button
              type="button"
              onClick={() => {
                setEditingMemory(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Add Memory
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMemories.map((memory) => {
            const hasAudio = !!memory.audioUrl;
            const hasImage = !!memory.imageUrl || (memory.photoUrls && memory.photoUrls.length > 0);
            const displayImage = memory.imageUrl || (memory.photoUrls && memory.photoUrls[0]);

            return (
              <div
                key={memory.id}
                className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  {hasImage ? (
                    <div className="h-40 bg-slate-100 overflow-hidden relative">
                      <img
                        src={displayImage}
                        alt={memory.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                        <StatusBadge
                          status={memory.category?.replace("_", " ")}
                          variant="teal"
                          className="bg-white/90 backdrop-blur-xs shadow-2xs text-[10px]"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 pb-0 flex items-center justify-between">
                      <StatusBadge
                        status={memory.category?.replace("_", " ") || "Memory"}
                        variant="teal"
                      />
                      {memory.sensitivity && (
                        <StatusBadge
                          status={`${memory.sensitivity} Sensitivity`}
                          variant={
                            memory.sensitivity === "HIGH"
                              ? "red"
                              : memory.sensitivity === "MEDIUM"
                              ? "amber"
                              : "slate"
                          }
                          className="text-[10px]"
                        />
                      )}
                    </div>
                  )}

                  <div className="p-5 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                        {memory.title}
                      </h3>
                      {memory.approved ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold shrink-0">
                          Approved
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold shrink-0">
                          Pending
                        </span>
                      )}
                    </div>

                    {memory.description && (
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                        {memory.description}
                      </p>
                    )}

                    {hasAudio && (
                      <div className="pt-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                          <Music className="h-3 w-3 text-teal-600" /> Audio Attachment
                        </span>
                        <audio
                          controls
                          preload="none"
                          src={memory.audioUrl}
                          className="w-full h-8"
                          aria-label={`Audio for ${memory.title}`}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 p-4 text-xs bg-slate-50/50">
                  <span className="text-[10px] text-slate-400 font-medium">
                    {memory.visibleToPatient ? "Visible on patient app" : "Internal context only"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMemory(memory);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-white transition-colors cursor-pointer"
                      title="Edit memory"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(memory)}
                      disabled={deleteMutation.isPending}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white transition-colors cursor-pointer"
                      title="Delete memory"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Memory Modal */}
      <MemoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        patientId={patientId}
        editingMemory={editingMemory}
        defaultCategory={comfortOnly ? "MUSIC" : "FAMILY"}
      />
    </div>
  );
}

function MemoryModal({
  isOpen,
  onClose,
  patientId,
  editingMemory,
  defaultCategory,
}: {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  editingMemory: Memory | null;
  defaultCategory?: string;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(defaultCategory || "FAMILY");
  const [sensitivity, setSensitivity] = useState("LOW");
  const [approved, setApproved] = useState(true);
  const [visibleToPatient, setVisibleToPatient] = useState(true);
  const [aiMayKnowInternally, setAiMayKnowInternally] = useState(true);
  const [aiMayMentionDirectly, setAiMayMentionDirectly] = useState(true);
  const [useForRedirection, setUseForRedirection] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  React.useEffect(() => {
    if (editingMemory) {
      setTitle(editingMemory.title || "");
      setDescription(editingMemory.description || "");
      setCategory(editingMemory.category || defaultCategory || "FAMILY");
      setSensitivity(editingMemory.sensitivity || "LOW");
      setApproved(editingMemory.approved ?? true);
      setVisibleToPatient(editingMemory.visibleToPatient ?? true);
      setAiMayKnowInternally(editingMemory.aiMayKnowInternally ?? true);
      setAiMayMentionDirectly(editingMemory.aiMayMentionDirectly ?? true);
      setUseForRedirection(editingMemory.useForRedirection ?? false);
    } else {
      setTitle("");
      setDescription("");
      setCategory(defaultCategory || "FAMILY");
      setSensitivity("LOW");
      setApproved(true);
      setVisibleToPatient(true);
      setAiMayKnowInternally(true);
      setAiMayMentionDirectly(true);
      setUseForRedirection(false);
    }
    setPhotoFile(null);
    setAudioFile(null);
    setErrorMsg("");
  }, [editingMemory, defaultCategory, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      let imageUrl = editingMemory?.imageUrl;
      let audioUrl = editingMemory?.audioUrl;

      if (photoFile) {
        const uploadRes = await mediaService.uploadMedia(photoFile, "photo", patientId);
        imageUrl = uploadRes.url;
      }

      if (audioFile) {
        const uploadRes = await mediaService.uploadMedia(audioFile, "audio", patientId);
        audioUrl = uploadRes.url;
      }

      const payload = {
        title,
        description,
        category,
        sensitivity,
        approved,
        visibleToPatient,
        aiMayKnowInternally,
        aiMayMentionDirectly,
        useForRedirection,
        imageUrl,
        audioUrl,
      };

      if (editingMemory) {
        await memoryService.updateMemory(patientId, editingMemory.id, payload as never);
      } else {
        await memoryService.createMemory(patientId, payload as never);
      }

      await queryClient.invalidateQueries({ queryKey: ["memories", patientId] });
      await queryClient.invalidateQueries({ queryKey: ["comfort", patientId] });
      onClose();
    } catch {
      setErrorMsg("Failed to save memory. Please check fields and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingMemory ? "Edit Memory" : "Add Memory"}
      description="Document personal stories, milestones, and familiar moments."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Memory Title *
          </label>
          <input
            type="text"
            required
            maxLength={150}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Summer family picnic at Lake Louise"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Story / Details *
          </label>
          <textarea
            required
            maxLength={2000}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what happened, who was there, and comforting details the companion can gently bring up."
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="FAMILY">Family</option>
              <option value="CAREER">Career & Accomplishments</option>
              <option value="TRAVEL">Travel & Places</option>
              <option value="CHILDHOOD">Childhood & Roots</option>
              <option value="HOBBY">Hobbies & Pastimes</option>
              <option value="MUSIC">Music & Songs</option>
              <option value="RELAXING_SOUND">Relaxing Sounds</option>
              <option value="SPECIAL_EVENT">Celebrations & Events</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Sensitivity Level
            </label>
            <select
              value={sensitivity}
              onChange={(e) => setSensitivity(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="LOW">Low (Warm / Safe)</option>
              <option value="MEDIUM">Medium (Requires Context)</option>
              <option value="HIGH">High (Do Not Proactively Prompt)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Photo (Optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
              className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Audio (Optional)
            </label>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
              className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
            />
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
          <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={approved}
              onChange={(e) => setApproved(e.target.checked)}
              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
            />
            <span>Approved for patient app and live companion</span>
          </label>
          <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={visibleToPatient}
              onChange={(e) => setVisibleToPatient(e.target.checked)}
              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
            />
            <span>Visible to patient on their mobile / tablet screen</span>
          </label>
          <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={useForRedirection}
              onChange={(e) => setUseForRedirection(e.target.checked)}
              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
            />
            <span>Use as a calming redirection topic during elevated distress</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs"
          >
            {isSubmitting ? "Saving…" : editingMemory ? "Save Changes" : "Create Memory"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── TAB 3: COMFORT CONTENT (Step 26) ─────────────────────────────────────────

function ComfortPanel({ patientId }: { patientId: string }) {
  return (
    <div className="space-y-6">
      <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/80 flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-teal-700 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <h3 className="text-xs font-bold text-teal-950">
            Comfort Mode Media
          </h3>
          <p className="text-xs text-teal-800 leading-relaxed font-normal">
            Content categorized as Music, Relaxing Sounds, or attached with audio is automatically prioritized in the patient app&apos;s Comfort tab when soothing is needed.
          </p>
        </div>
      </div>

      <MemoriesPanel patientId={patientId} comfortOnly={true} />
    </div>
  );
}

// ─── TAB 4: COGNITIVE ACTIVITIES (Step 27) ────────────────────────────────────

function ActivitiesPanel({ patientId }: { patientId: string }) {
  const queryClient = useQueryClient();

  const activitiesQuery = useQuery({
    queryKey: ["managed-activities", patientId],
    queryFn: () => portalService.activities(patientId),
  });

  const resultsQuery = useQuery({
    queryKey: ["activity-results", patientId],
    queryFn: () => portalService.activityResults(patientId),
  });

  const toggleMutation = useMutation({
    mutationFn: (activity: ManagedActivity) =>
      portalService.configureActivity(patientId, activity.type, !activity.enabled),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["managed-activities", patientId] }),
  });

  if (activitiesQuery.isLoading) {
    return <LoadingSkeleton />;
  }

  if (activitiesQuery.isError) {
    return (
      <ErrorState
        message="Unable to load cognitive activities configuration."
        onRetry={() => void activitiesQuery.refetch()}
      />
    );
  }

  const activities = activitiesQuery.data || [];
  const results = resultsQuery.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Cognitive Activities Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Exercises designed around familiar people and memories to stimulate conversation and recall.
          </p>
        </div>
      </div>

      {/* Non-clinical notice */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-center gap-2.5">
        <Info className="h-4 w-4 text-teal-700 shrink-0" />
        <span>
          Activity observations describe conversational engagement and memory familiarity. They do not constitute clinical diagnostic scores.
        </span>
      </div>

      {/* 5 Cognitive Activities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {activities.map((a) => (
          <div
            key={a.type}
            className={`rounded-2xl border p-5 shadow-2xs transition-all flex flex-col justify-between ${
              a.enabled
                ? "bg-white border-slate-200/80"
                : "bg-slate-50/70 border-slate-200/60 opacity-80"
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                      a.enabled ? "bg-teal-50 text-teal-700" : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {a.title}
                    </h3>
                    <StatusBadge
                      status={a.enabled ? "Enabled" : "Disabled"}
                      variant={a.enabled ? "teal" : "slate"}
                      className="text-[10px] py-0 mt-0.5"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={toggleMutation.isPending}
                  onClick={() => toggleMutation.mutate(a)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    a.enabled
                      ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                      : "bg-teal-600 hover:bg-teal-700 text-white border-teal-600 shadow-2xs"
                  }`}
                >
                  {a.enabled ? "Disable" : "Enable"}
                </button>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                {a.availableCount === 0
                  ? "Requires approved family members or memories to personalize questions."
                  : `${a.availableCount} personalized content questions available.`}
              </p>
            </div>

            <div className="border-t border-slate-100 pt-3.5 mt-4 text-[11px] text-slate-400 flex items-center justify-between">
              <span>{a.completionCount} completed sessions</span>
              <span>Last: {a.lastPlayed ? formatRelativeTime(a.lastPlayed) : "Never"}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Activity Results History Table */}
      <SectionCard
        title="Activity Session History"
        subtitle="Recent patient engagement observations and completion records"
        headerIcon={<Clock className="h-4 w-4" />}
      >
        {resultsQuery.isLoading ? (
          <div className="space-y-2.5 py-4 animate-pulse">
            <div className="h-10 bg-slate-100 rounded-xl" />
            <div className="h-10 bg-slate-100 rounded-xl" />
          </div>
        ) : results.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">
            No completed activity sessions recorded on the patient app yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Activity</th>
                  <th className="py-2.5 px-3">Result</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Observation</th>
                  <th className="py-2.5 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((res, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {res.activityId.replace("_", " ")}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge
                        status={res.result}
                        variant={res.result === "completed" ? "mint" : "slate"}
                      />
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {res.completionTime ? `${Math.round(res.completionTime)}s` : "—"}
                    </td>
                    <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                      {res.feedback || "Good engagement with familiar prompt"}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {formatRelativeTime(res.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
