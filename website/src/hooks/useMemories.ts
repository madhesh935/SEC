import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { memoryService, MemoryFilters } from "@/services/memory.service";
import { MemoryFormData } from "@/schemas/memory.schema";

export function useMemoriesQuery(patientId?: string, filters?: MemoryFilters) {
  return useQuery({
    queryKey: ["memories", patientId, filters],
    queryFn: () =>
      patientId ? memoryService.getMemories(patientId, filters) : [],
    enabled: !!patientId,
    staleTime: 1000 * 60,
  });
}

export function useCreateMemoryMutation(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: MemoryFormData) =>
      memoryService.createMemory(patientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memories", patientId] });
    },
  });
}

export function useUpdateMemoryMutation(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      memoryId,
      data,
    }: {
      memoryId: string;
      data: Partial<MemoryFormData>;
    }) => memoryService.updateMemory(patientId, memoryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memories", patientId] });
    },
  });
}

export function useDeleteMemoryMutation(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memoryId: string) =>
      memoryService.deleteMemory(patientId, memoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memories", patientId] });
    },
  });
}
