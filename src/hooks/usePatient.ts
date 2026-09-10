import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSessionStore } from '../store/session.store';
import { patientService } from '../services/patient.service';
import { familyService } from '../services/family.service';
import { memoryService } from '../services/memory.service';
import { comfortService } from '../services/comfort.service';
import { activityService } from '../services/activity.service';
import { helpService } from '../services/help.service';

export function usePatientProfile() {
  const session = useSessionStore((state) => state.session);
  const patientId = session?.patientId;

  return useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => patientService.getPatientProfile(patientId!),
    enabled: !!patientId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
}

export function useFamilyMembers() {
  const session = useSessionStore((state) => state.session);
  const patientId = session?.patientId;

  return useQuery({
    queryKey: ['family', patientId],
    queryFn: () => familyService.getFamilyMembers(patientId!),
    enabled: !!patientId,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
}

export function useFamilyMember(familyMemberId?: string) {
  const session = useSessionStore((state) => state.session);
  const patientId = session?.patientId;

  return useQuery({
    queryKey: ['family-member', patientId, familyMemberId],
    queryFn: () => familyService.getFamilyMember(patientId!, familyMemberId!),
    enabled: !!patientId && !!familyMemberId,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
}

export function useMemories() {
  const session = useSessionStore((state) => state.session);
  const patientId = session?.patientId;

  return useQuery({
    queryKey: ['memories', patientId],
    queryFn: () => memoryService.getMemories(patientId!),
    enabled: !!patientId,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
}

export function useMemory(memoryId?: string) {
  const session = useSessionStore((state) => state.session);
  const patientId = session?.patientId;

  return useQuery({
    queryKey: ['memory', patientId, memoryId],
    queryFn: () => memoryService.getMemory(patientId!, memoryId!),
    enabled: !!patientId && !!memoryId,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
}

export function useComfortContent() {
  const session = useSessionStore((state) => state.session);
  const patientId = session?.patientId;

  return useQuery({
    queryKey: ['comfort', patientId],
    queryFn: () => comfortService.getComfortContent(patientId!),
    enabled: !!patientId,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
}

export function useRecommendedActivities() {
  const session = useSessionStore((state) => state.session);
  const patientId = session?.patientId;

  return useQuery({
    queryKey: ['activities', patientId],
    queryFn: () => activityService.getRecommendedActivities(patientId!),
    enabled: !!patientId,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
}

export function useHelpContacts() {
  const session = useSessionStore((state) => state.session);
  const patientId = session?.patientId;

  return useQuery({
    queryKey: ['help-contacts', patientId],
    queryFn: () => helpService.getHelpContacts(patientId!),
    enabled: !!patientId,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
}

export function useRequestHelp() {
  const queryClient = useQueryClient();
  const session = useSessionStore((state) => state.session);
  const patientId = session?.patientId;

  return useMutation({
    mutationFn: (reason?: string) => {
      if (!patientId) throw new Error('No active patient session');
      return helpService.requestHelp(patientId, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['help-contacts', patientId] });
    },
  });
}
