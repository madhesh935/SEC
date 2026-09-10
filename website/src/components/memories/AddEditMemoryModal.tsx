"use client";

import * as React from "react";
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
    },
  });

  React.useEffect(() => {
    if (initialData) {
      reset({
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
      });
    } else {
      reset({
        title: "",
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
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-1">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Memory Title *
          </label>
          <Input
            placeholder="e.g. 1972 Summer Trip to Lake Tahoe"
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
              <option value="MUSIC">Music & Performance</option>
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
              <option value="HIGH">High (Guardrail: avoid direct prompt)</option>
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
            <Input
              placeholder="https://..."
              {...register("imageUrl")}
            />
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

        {/* Sensitive Memory Controls Component (Step 13) */}
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
