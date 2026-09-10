"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { usePatientStore } from "@/store/patient.store";
import { MediaUploader } from "@/components/media/MediaUploader";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  familyMemberSchema,
  FamilyMemberFormData,
} from "@/schemas/family.schema";
import { FamilyMember } from "@/types";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface AddEditFamilyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FamilyMemberFormData) => Promise<void>;
  initialData?: FamilyMember | null;
  isLoading?: boolean;
}

export function AddEditFamilyModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}: AddEditFamilyModalProps) {
  const params = useParams();
  const selectedId = usePatientStore(s => s.selectedPatientId);
  const {
    setValue,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FamilyMemberFormData>({
    resolver: zodResolver(familyMemberSchema),
    defaultValues: {
      name: "",
      relationship: "",
      photoUrl: "",
      phone: "",
      priority: 1,
      voiceRecordingUrl: "",
      description: "",
      patientVisible: true,
    },
  });

  React.useEffect(() => {
    if (initialData) {
      reset({
        description: initialData.description || "",
        patientVisible: initialData.patientVisible ?? true,
        name: initialData.name,
        relationship: initialData.relationship || "",
        photoUrl: initialData.photoUrl || "",
        phone: initialData.phone || "",
        priority: initialData.priority || 1,
        voiceRecordingUrl: initialData.voiceRecordingUrl || "",
      });
    } else {
      reset({
        name: "",
        relationship: "",
        photoUrl: "",
        phone: "",
        priority: 1,
        voiceRecordingUrl: "",
        description: "",
        patientVisible: true,
      });
    }
  }, [initialData, reset]);

  const handleFormSubmit = async (data: FamilyMemberFormData) => {
    await onSubmit(data);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Family Member" : "Add Family Member"}
      description="Connect an authorized family member to allow voice note soothing and memory contributions."
      maxWidth="md"
    >
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-4 pt-1"
      >
        <label className="block text-sm">
          Patient-safe description
          <Input {...register("description")} />
        </label>
        <label className="flex gap-2 text-sm">
          <input type="checkbox" {...register("patientVisible")} />
          Visible in patient app
        </label>
        <MediaUploader
          patientId={(params.patientId as string) || selectedId || undefined}
          onImageUploaded={(url) => setValue("photoUrl", url)}
          onAudioUploaded={(url) => setValue("voiceRecordingUrl", url)}
        />
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Full Name *
          </label>
          <Input
            placeholder="Full name"
            error={!!errors.name}
            {...register("name")}
          />
          {errors.name && (
            <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Relationship *
            </label>
            <Input
              placeholder="e.g. Daughter, Sister"
              error={!!errors.relationship}
              {...register("relationship")}
            />
            {errors.relationship && (
              <p className="text-xs text-red-600 mt-1">
                {errors.relationship.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Contact Priority (1-10)
            </label>
            <Input type="number" min={1} max={10} {...register("priority")} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Phone Number
          </label>
          <Input placeholder="+1 (555) 000-0000" {...register("phone")} />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Photo URL
          </label>
          <Input placeholder="https://..." {...register("photoUrl")} />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Voice Recording URL (Placeholder)
          </label>
          <Input placeholder="https://..." {...register("voiceRecordingUrl")} />
          <p className="text-[11px] text-slate-400 mt-1">
            Caregivers can attach pre-recorded calming audio clips from family
            members.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="teal" size="sm" isLoading={isLoading}>
            {initialData ? "Save Changes" : "Add Member"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

