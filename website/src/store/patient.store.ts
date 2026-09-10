import { create } from "zustand";

interface PatientState {
  selectedPatientId: string | null;
  setSelectedPatientId: (patientId: string | null) => void;
}

export const usePatientStore = create<PatientState>((set) => ({
  selectedPatientId: null,
  setSelectedPatientId: (patientId) => set({ selectedPatientId: patientId }),
}));
