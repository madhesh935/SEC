import { patientSchema } from "./contracts";
import { apiClient } from "./api";
import { Patient } from "../types/patient";

export const patientService = {
  async heartbeat(): Promise<void> {
    await apiClient.post("/api/v1/auth/device-heartbeat");
  },
  async getPatientProfile(patientId: string): Promise<Patient> {
    const response = await apiClient.get<Patient>(
      `/api/v1/patients/${patientId}`,
    );
    return patientSchema.parse(response.data);
  },
};
