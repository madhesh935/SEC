"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { familyService } from "@/services/family.service";
import { usePatientQuery } from "@/hooks/usePatients";
import { FamilyMember } from "@/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { FamilyMemberCard } from "@/components/family/FamilyMemberCard";
import { AddEditFamilyModal } from "@/components/family/AddEditFamilyModal";
import { LoadingState } from "@/components/states/LoadingState";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Plus, Users, HeartHandshake } from "lucide-react";
import Link from "next/link";

export default function PatientFamilyPage() {
  const params = useParams();
  const patientId = params.patientId as string;
  const queryClient = useQueryClient();

  const { data: patient } = usePatientQuery(patientId);

  const {
    data: familyMembers,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["family-members", patientId],
    queryFn: () => familyService.getFamilyMembers(patientId),
    enabled: !!patientId,
  });

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingMember, setEditingMember] = React.useState<FamilyMember | null>(null);
  const [deletingMemberId, setDeletingMemberId] = React.useState<string | null>(null);

  const addMutation = useMutation({
    mutationFn: (data: Parameters<typeof familyService.addFamilyMember>[1]) =>
      familyService.addFamilyMember(patientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family-members", patientId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      familyId,
      data,
    }: {
      familyId: string;
      data: Parameters<typeof familyService.updateFamilyMember>[2];
    }) => familyService.updateFamilyMember(patientId, familyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family-members", patientId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (familyId: string) =>
      familyService.deleteFamilyMember(patientId, familyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family-members", patientId] });
      setDeletingMemberId(null);
    },
  });

  const handleOpenAdd = () => {
    setEditingMember(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (member: FamilyMember) => {
    setEditingMember(member);
    setIsModalOpen(true);
  };

  const handleSubmitModal = async (formData: Parameters<typeof familyService.addFamilyMember>[1]) => {
    if (editingMember) {
      await updateMutation.mutateAsync({
        familyId: editingMember.id,
        data: formData,
      });
    } else {
      await addMutation.mutateAsync(formData);
    }
  };

  const patientName = patient
    ? patient.preferredName || patient.firstName
    : "Patient";

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={`${patientName}'s Family Circle`}
        subtitle="Manage authorized relatives, priority contacts, and soothing voice recording clips."
        action={
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/patients/${patientId}`}>
              <Button variant="outline" size="sm">
                Patient Profile
              </Button>
            </Link>
            <Button variant="teal" size="sm" onClick={handleOpenAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              <span>Add Family Member</span>
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <LoadingState message="Loading family member records..." />
      ) : isError ? (
        <ErrorState
          title="Unable to load family circle"
          message="We couldn't connect to the family service. Please try again."
          onRetry={() => refetch()}
        />
      ) : !familyMembers || familyMembers.length === 0 ? (
        <EmptyState
          icon={HeartHandshake}
          title="No family members registered yet"
          description={`Add authorized family members for ${patientName} so they can contribute memories and provide calming voice messages.`}
          actionLabel="Add First Family Member"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {familyMembers.map((member) => (
            <FamilyMemberCard
              key={member.id}
              member={member}
              onEdit={handleOpenEdit}
              onDelete={(id) => setDeletingMemberId(id)}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <AddEditFamilyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitModal}
        initialData={editingMember}
        isLoading={addMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingMemberId}
        onClose={() => setDeletingMemberId(null)}
        onConfirm={() => {
          if (deletingMemberId) deleteMutation.mutate(deletingMemberId);
        }}
        title="Remove Family Member"
        description="Are you sure you want to remove this family member from the patient's care network?"
        variant="danger"
        confirmLabel="Remove"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
