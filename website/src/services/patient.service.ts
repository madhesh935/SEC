import apiClient from "./api";
import { Patient, PatientStatus, LiveCompanionStatus } from "@/types";
import { CreatePatientFormData } from "@/schemas/patient.schema";

export const patientService = {
  /**
   * Fetch all patients accessible to the logged-in user.
   */
  async getPatients(): Promise<Patient[]> {
    const response = await apiClient.get<Patient[]>("/api/v1/patients");
    return response.data;
  },

  /**
   * Fetch a single patient profile by ID.
   */
  async getPatientById(patientId: string): Promise<Patient> {
    const response = await apiClient.get<Patient>(`/api/v1/patients/${patientId}`);
    return response.data;
  },

  /**
   * Create a new patient profile.
   */
  async createPatient(data: CreatePatientFormData): Promise<Patient> {
    const response = await apiClient.post<Patient>("/api/v1/patients", data);
    return response.data;
  },

  /**
   * Update an existing patient profile.
   */
  async updatePatient(patientId: string, data: Partial<Patient>): Promise<Patient> {
    const response = await apiClient.put<Patient>(`/api/v1/patients/${patientId}`, data);
    return response.data;
  },

  /**
   * Fetch primary status metrics for dashboard overview.
   */
  async getPatientStatus(patientId: string): Promise<PatientStatus> {
    const response = await apiClient.get<PatientStatus>(
      `/api/v1/patients/${patientId}/status`
    );
    return response.data;
  },

  /**
   * Fetch live companion conversation status.
   */
  async getLiveStatus(patientId: string): Promise<LiveCompanionStatus> {
    const response = await apiClient.get<LiveCompanionStatus>(
      `/api/v1/patients/${patientId}/live-status`
    );
    return response.data;
  },
};
