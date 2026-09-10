"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { usePatientStore } from "@/store/patient.store";
import {
  useMemoriesQuery,
  useCreateMemoryMutation,
  useUpdateMemoryMutation,
  useDeleteMemoryMutation,
} from "@/hooks/useMemories";
import { usePatientQuery } from "@/hooks/usePatients";
import { Memory } from "@/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { MemoryCard } from "@/components/memories/MemoryCard";
import { AddEditMemoryModal } from "@/components/memories/AddEditMemoryModal";
import { LoadingState } from "@/components/states/LoadingState";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { DataTable, Column } from "@/components/ui/data-table";
import { BookOpen, Plus, LayoutGrid, List, Filter } from "lucide-react";
import Link from "next/link";

export default function PatientMemoriesPage({
  comfortOnly = false,
}: { comfortOnly?: boolean } = {}) {
  const params = useParams();
  const selectedId = usePatientStore((s) => s.selectedPatientId);
  const patientId = (params.patientId as string) || selectedId || "";

  const { data: patient } = usePatientQuery(patientId);

  // Filter states
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL");
  const [selectedSensitivity, setSelectedSensitivity] =
    React.useState<string>("ALL");
  const [selectedApproval, setSelectedApproval] = React.useState<string>("ALL");
  const [viewMode, setViewMode] = React.useState<"cards" | "table">("cards");

  const queryFilters = React.useMemo(() => {
    return {
      category: selectedCategory !== "ALL" ? selectedCategory : undefined,
      sensitivity:
        selectedSensitivity !== "ALL" ? selectedSensitivity : undefined,
      approved:
        selectedApproval === "APPROVED"
          ? true
          : selectedApproval === "PENDING"
            ? false
            : undefined,
    };
  }, [selectedCategory, selectedSensitivity, selectedApproval]);

  const {
    data: allMemories,
    isLoading,
    isError,
    refetch,
  } = useMemoriesQuery(patientId, queryFilters);

  const memories = comfortOnly
    ? allMemories?.filter(
        (m) =>
          m.category === "MUSIC" ||
          m.category === "RELAXING_SOUND" ||
          m.audioUrl ||
          m.useForRedirection,
      )
    : allMemories;
  const createMutation = useCreateMemoryMutation(patientId);
  const updateMutation = useUpdateMemoryMutation(patientId);
  const deleteMutation = useDeleteMemoryMutation(patientId);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingMemory, setEditingMemory] = React.useState<Memory | null>(null);
  const [deletingMemoryId, setDeletingMemoryId] = React.useState<string | null>(
    null,
  );

  const handleOpenAdd = () => {
    setEditingMemory(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (mem: Memory) => {
    setEditingMemory(mem);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (
    formData: Parameters<typeof createMutation.mutateAsync>[0],
  ) => {
    if (editingMemory) {
      await updateMutation.mutateAsync({
        memoryId: editingMemory.id,
        data: formData,
      });
    } else {
      await createMutation.mutateAsync(formData);
    }
  };

  const patientName = patient
    ? patient.preferredName || patient.firstName
    : "Patient";

  // Table view columns
  const tableColumns: Column<Memory>[] = [
    {
      key: "title",
      header: "Memory Title",
      render: (item: Memory) => (
        <div>
          <span className="font-semibold text-slate-900 block">
            {item.title}
          </span>
          <span className="text-xs text-slate-500 line-clamp-1">
            {item.description}
          </span>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (item: Memory) => (
        <span className="rounded-md bg-teal-50 px-2 py-0.5 text-xs text-teal-800 border border-teal-200">
          {item.category || "General"}
        </span>
      ),
    },
    {
      key: "sensitivity",
      header: "Sensitivity",
      render: (item: Memory) => (
        <span
          className={`rounded-md px-2 py-0.5 text-xs font-medium border ${
            item.sensitivity === "HIGH"
              ? "bg-red-50 text-red-800 border-red-200"
              : item.sensitivity === "MEDIUM"
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-slate-100 text-slate-700 border-slate-200"
          }`}
        >
          {item.sensitivity}
        </span>
      ),
    },
    {
      key: "approved",
      header: "Status",
      render: (item: Memory) => (
        <span
          className={`rounded-md px-2 py-0.5 text-xs ${
            item.approved
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-amber-50 text-amber-800 border border-amber-200"
          }`}
        >
          {item.approved ? "Approved" : "Pending"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (item: Memory) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenEdit(item)}
            className="h-8 px-2 text-xs"
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeletingMemoryId(item.id)}
            className="h-8 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={`${patientName}'s Personal Memories`}
        subtitle="Catalog verified family stories, photographs, and soothing memories for conversational grounding."
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
              onClick={handleOpenAdd}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Memory</span>
            </Button>
          </div>
        }
      />

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Filter className="h-3.5 w-3.5" />
            <span>Filters:</span>
          </div>

          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-9 text-xs w-36"
          >
            <option value="ALL">All Categories</option>
            <option value="FAMILY">Family</option>
            <option value="CAREER">Career</option>
            <option value="TRAVEL">Travel</option>
            <option value="CHILDHOOD">Childhood</option>
            <option value="HOBBY">Hobbies</option>
            <option value="MUSIC">Music</option>
            <option value="SPECIAL_EVENT">Special Events</option>
          </Select>

          <Select
            value={selectedSensitivity}
            onChange={(e) => setSelectedSensitivity(e.target.value)}
            className="h-9 text-xs w-32"
          >
            <option value="ALL">All Sensitivity</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </Select>

          <Select
            value={selectedApproval}
            onChange={(e) => setSelectedApproval(e.target.value)}
            className="h-9 text-xs w-32"
          >
            <option value="ALL">All Status</option>
            <option value="APPROVED">Approved</option>
            <option value="PENDING">Pending</option>
          </Select>
        </div>

        {/* View Toggle (Cards vs Table) */}
        <div className="flex items-center gap-1 border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-3">
          <button
            type="button"
            onClick={() => setViewMode("cards")}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === "cards"
                ? "bg-teal-50 text-teal-800"
                : "text-slate-400 hover:text-slate-600"
            }`}
            aria-label="Cards view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === "table"
                ? "bg-teal-50 text-teal-800"
                : "text-slate-400 hover:text-slate-600"
            }`}
            aria-label="Table view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Content Views */}
      {isLoading ? (
        <LoadingState message="Loading personal memories..." />
      ) : isError ? (
        <ErrorState
          title="Unable to load memories"
          message="We couldn't connect to the memory service. Please try again."
          onRetry={() => refetch()}
        />
      ) : !memories || memories.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No personal memories have been added yet."
          description={`Add cherished moments, family history, and favorite life stories for ${patientName} to empower the Personal Memory Engine.`}
          actionLabel="Add First Memory"
          onAction={handleOpenAdd}
        />
      ) : viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {memories.map((mem) => (
            <MemoryCard
              key={mem.id}
              memory={mem}
              onEdit={handleOpenEdit}
              onDelete={(id) => setDeletingMemoryId(id)}
            />
          ))}
        </div>
      ) : (
        <DataTable
          columns={tableColumns}
          data={memories}
          keyExtractor={(item) => item.id}
        />
      )}

      {/* Add / Edit Memory Modal */}
      <AddEditMemoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={editingMemory}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingMemoryId}
        onClose={() => setDeletingMemoryId(null)}
        onConfirm={() => {
          if (deletingMemoryId) deleteMutation.mutate(deletingMemoryId);
          setDeletingMemoryId(null);
        }}
        title="Delete Personal Memory"
        description="Are you sure you want to permanently delete this memory? It will no longer be accessible for companion conversation grounding."
        variant="danger"
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
