import { useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSessionStore } from "../store/session.store";
import { patientService } from "../services/patient.service";
import { familyService } from "../services/family.service";
import { memoryService } from "../services/memory.service";
import { comfortService } from "../services/comfort.service";
import { activityService } from "../services/activity.service";
import { helpService } from "../services/help.service";
import { experienceService } from "../services/experience.service";

export function usePatientQuery<T>(
  key: string,
  fetcher: (patientId: string) => Promise<T>,
  resource?: string,
) {
  const id = useSessionStore((s) => s.session?.patientId);
  const query = useQuery({
    queryKey: [key, id, resource],
    queryFn: () => fetcher(id!),
    enabled: !!id,
    staleTime: 30000,
    retry: 1,
    refetchInterval: 60000,
  });
  const { refetch } = query;
  useFocusEffect(
    useCallback(() => {
      if (id) void refetch();
    }, [id, refetch]),
  );
  return query;
}
export const usePatientProfile = () =>
  usePatientQuery("patient", patientService.getPatientProfile);
export const useFamilyMembers = () =>
  usePatientQuery("family", familyService.getFamilyMembers);
export const useFamilyMember = (id = "") =>
  usePatientQuery(
    "family-member",
    (pid) => familyService.getFamilyMember(pid, id),
    id,
  );
export const useMemories = () =>
  usePatientQuery("memories", memoryService.getMemories);
export const useMemory = (id = "") =>
  usePatientQuery("memory", (pid) => memoryService.getMemory(pid, id), id);
export const useComfortContent = () =>
  usePatientQuery("comfort", comfortService.getComfortContent);
export const useRecommendedActivities = () =>
  usePatientQuery("activities", activityService.getRecommendedActivities);
export const useActivity = (id = "") =>
  usePatientQuery(
    "activity",
    (pid) => activityService.getActivity(pid, id),
    id,
  );
export const useHelpContacts = () =>
  usePatientQuery("help-contacts", helpService.getHelpContacts);
export const useRecommendation = () =>
  usePatientQuery("recommendation", experienceService.recommendation);
export const usePatientSettings = () =>
  usePatientQuery("settings", experienceService.settings);
export function useRequestHelp() {
  const id = useSessionStore((s) => s.session?.patientId);
  return useMutation({
    mutationFn: (reason?: string) => {
      if (!id) throw new Error("No session");
      return helpService.requestHelp(id, reason);
    },
  });
}
