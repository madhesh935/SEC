"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { usePatientStore } from "@/store/patient.store";
import { useQuery } from "@tanstack/react-query";
import { portalService } from "@/services/portal.service";
import { familyService } from "@/services/family.service";
import { MediaUploader } from "@/components/media/MediaUploader";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { memorySchema, MemoryFormData } from "@/schemas/memory.schema";
import { Memory } from "@/types";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { MemoryPermissionPanel } from "./MemoryPermissionPanel";

export interface AddEditMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MemoryFormData) => Promise<void>;
  initialData?: Memory | null;
  isLoading?: boolean;
}

export function AddEditMemoryModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}: AddEditMemoryModalProps) {
  const params = useParams();
  const selectedId = usePatientStore(s => s.selectedPatientId);
  const patientId = (params.patientId as string) || selectedId || "";
  const grants = useQuery({queryKey:["family-access",patientId],queryFn:()=>portalService.grants(patientId),enabled:!!patientId});
  const family = useQuery({
    queryKey: ["family-members", patientId],
    queryFn: () => familyService.getFamilyMembers(patientId),
    enabled: !!patientId,
  });
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MemoryFormData>({
    resolver: zodResolver(memorySchema),
    defaultValues: {
      title: "",
      displayDate: "",
      photoUrls: [],
      description: "",
      category: "FAMILY",
      sensitivity: "LOW",
      approved: true,
      useForRedirection: true,
      imageUrl: "",
      audioUrl: "",
      emotionalTone: "Joyful and comforting",
      aiMayKnowInternally: true,
      aiMayMentionDirectly: false,
      useForSafetyReasoning: true,
      visibleToPatient: false,
      visibleToCaregiver: true,
      visibleToSelectedFamily: false,
      associatedPeople: [],
      familyUserIds: [],
    },
  });

  React.useEffect(() => {
    if (initialData) {
      reset({
        displayDate: initialData.displayDate || "",
        photoUrls: initialData.photoUrls || [],
        title: initialData.title,
        description: initialData.description || "",
        category: initialData.category || "FAMILY",
        sensitivity: initialData.sensitivity || "LOW",
        approved: initialData.approved ?? true,
        useForRedirection: initialData.useForRedirection ?? true,
        imageUrl: initialData.imageUrl || "",
        audioUrl: initialData.audioUrl || "",
        emotionalTone: initialData.emotionalTone || "",
        aiMayKnowInternally: initialData.aiMayKnowInternally ?? true,
        aiMayMentionDirectly: initialData.aiMayMentionDirectly ?? false,
        useForSafetyReasoning: initialData.useForSafetyReasoning ?? true,
        visibleToPatient: initialData.visibleToPatient ?? false,
        visibleToCaregiver: initialData.visibleToCaregiver ?? true,
        visibleToSelectedFamily: initialData.visibleToSelectedFamily ?? false,
        associatedPeople: initialData.associatedPeople || [],
        familyUserIds: initialData.familyUserIds || [],
      });
    } else {
      reset({
        title: "",
        displayDate: "",
        photoUrls: [],
        description: "",
        category: "FAMILY",
        sensitivity: "LOW",
        approved: true,
        useForRedirection: true,
        imageUrl: "",
        audioUrl: "",
        emotionalTone: "Joyful and comforting",
        aiMayKnowInternally: true,
        aiMayMentionDirectly: false,
        useForSafetyReasoning: true,
        visibleToPatient: false,
        visibleToCaregiver: true,
        visibleToSelectedFamily: false,
        associatedPeople: [],
      familyUserIds: [],
      });
    }
  }, [initialData, reset]);

  const sensitivity = watch("sensitivity");

  const handleFormSubmit = async (data: MemoryFormData) => {
    await onSubmit(data);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Personal Memory" : "Add Personal Memory"}
      description="Add verified memories to help the AI Companion ground the patient during confusion or distress."
      maxWidth="xl"
    >
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-4 pt-1"
      >
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Memory Title *
          </label>
          <Input
            placeholder="Memory title"
            error={!!errors.title}
            {...register("title")}
          />
          {errors.title && (
            <p className="text-xs text-red-600 mt-1">{errors.title.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Category *
            </label>
            <Select {...register("category")}>
              <option value="FAMILY">Family & Children</option>
              <option value="CAREER">Career & Achievements</option>
              <option value="TRAVEL">Travel & Adventures</option>
              <option value="CHILDHOOD">Childhood & Youth</option>
              <option value="HOBBY">Hobbies & Crafts</option>
              <option value="MUSIC">Favourite Music</option>
              <option value="RELAXING_SOUND">Relaxing Sounds</option>
              <option value="SPECIAL_EVENT">Special Life Events</option>
              <option value="OTHER">Other</option>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Sensitivity Level *
            </label>
            <Select {...register("sensitivity")}>
              <option value="LOW">Low (Safe to mention freely)</option>
              <option value="MEDIUM">Medium (Use with gentle context)</option>
              <option value="HIGH">
                High (Guardrail: avoid direct prompt)
              </option>
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Story / Context Description *
          </label>
          <Textarea
            placeholder="Describe the story, who was there, what happened, and why it brings warmth to the patient..."
            rows={3}
            error={!!errors.description}
            {...register("description")}
          />
          {errors.description && (
            <p className="text-xs text-red-600 mt-1">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Image URL (Optional)
            </label>
            <Input placeholder="https://..." {...register("imageUrl")} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Emotional Tone
            </label>
            <Input
              placeholder="e.g. Joyful, Peaceful, Proud"
              {...register("emotionalTone")}
            />
          </div>
        </div>

        <label className="block text-sm">
          Display date (optional, as you want the patient to see it)
          <Input {...register("displayDate")} />
        </label>
        <label className="block text-sm">
          Audio URL
          <Input {...register("audioUrl")} />
        </label>
        <MediaUploader
          patientId={patientId}
          onImageUploaded={(url) => setValue("imageUrl", url)}
          onAudioUploaded={(url) => setValue("audioUrl", url)}
        />
        <p className="text-sm text-slate-600">
          Approved patient-visible music, sounds, photos and stories also appear
          in Comfort. Voice recordings require voice consent.
        </p>
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold">
            People in this memory
          </legend>
          {family.data?.map((person) => (
            <label key={person.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={watch("associatedPeople").includes(person.id)}
                onChange={(event) =>
                  setValue(
                    "associatedPeople",
                    event.target.checked
                      ? [...watch("associatedPeople"), person.id]
                      : watch("associatedPeople").filter(
                          (id) => id !== person.id,
                        ),
                  )
                }
              />
              {person.name}
            </label>
          ))}
        </fieldset>
        {/* Sensitive Memory Controls Component (Step 13) */}
        {watch("visibleToSelectedFamily") && <fieldset className="rounded-xl border p-4"><legend>Family accounts who can see this memory</legend>{grants.isPending ? <p>Loading family accounts…</p> : grants.isError ? <button type="button" onClick={() => void grants.refetch()}>Retry family access</button> : grants.data?.filter(g=>g.status==="active").map(g=><label key={g.userId} className="gc-check"><input type="checkbox" checked={watch("familyUserIds").includes(g.userId)} onChange={e=>setValue("familyUserIds",e.target.checked?[...watch("familyUserIds"),g.userId]:watch("familyUserIds").filter(id=>id!==g.userId))}/>{g.email || g.relationship}</label>)}{grants.data?.length===0 && <p>No family accounts have joined yet. Invite someone from Patient ? Privacy.</p>}</fieldset>}
        <MemoryPermissionPanel
          permissions={{
            aiMayKnowInternally: watch("aiMayKnowInternally"),
            aiMayMentionDirectly: watch("aiMayMentionDirectly"),
            useForSafetyReasoning: watch("useForSafetyReasoning"),
            visibleToPatient: watch("visibleToPatient"),
            visibleToCaregiver: watch("visibleToCaregiver"),
            visibleToSelectedFamily: watch("visibleToSelectedFamily"),
          }}
          onChange={(key, val) => setValue(key, val)}
          isSensitive={sensitivity === "HIGH" || sensitivity === "MEDIUM"}
        />

        <div className="flex items-center justify-between pt-2">
          <Switch
            id="useForRedirection"
            label="Allow AI redirection with this memory"
            checked={watch("useForRedirection")}
            onCheckedChange={(val) => setValue("useForRedirection", val)}
          />
          <Switch
            id="approved"
            label="Caregiver Approved"
            checked={watch("approved")}
            onCheckedChange={(val) => setValue("approved", val)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="teal" size="sm" isLoading={isLoading}>
            {initialData ? "Save Changes" : "Save Memory"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}


