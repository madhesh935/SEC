import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { patientService } from "@/services/patient.service";
import { CreatePatientFormData } from "@/schemas/patient.schema";
import { Patient } from "@/types";

export const PATIENTS_QUERY_KEY = ["patients"];

export function usePatientsQuery() {
  return useQuery({
    queryKey: PATIENTS_QUERY_KEY,
    queryFn: () => patientService.getPatients(),
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 1,
  });
}

export function usePatientQuery(patientId?: string) {
  return useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => (patientId ? patientService.getPatientById(patientId) : null),
    enabled: !!patientId,
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });
}

export function usePatientStatusQuery(patientId?: string) {
  return useQuery({
    queryKey: ["patient-status", patientId],
    queryFn: () => (patientId ? patientService.getPatientStatus(patientId) : null),
    enabled: !!patientId,
    refetchInterval: 15000, // Poll every 15s when active
    retry: 1,
  });
}

export function usePatientLiveStatusQuery(patientId?: string) {
  return useQuery({
    queryKey: ["patient-live-status", patientId],
    queryFn: () => (patientId ? patientService.getLiveStatus(patientId) : null),
    enabled: !!patientId,
    refetchInterval: 5000, // Poll every 5s for live companion updates
    retry: 1,
  });
}

export function useCreatePatientMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePatientFormData) => patientService.createPatient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PATIENTS_QUERY_KEY });
    },
  });
}

export function useUpdatePatientMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      patientId,
      data,
    }: {
      patientId: string;
      data: Partial<Patient>;
    }) => patientService.updatePatient(patientId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: PATIENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["patient", variables.patientId] });
    },
  });
}
