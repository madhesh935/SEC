import { memorySchema } from "./contracts";
import { apiClient } from "./api";
import { PatientMemory } from "../types/memory";

export const memoryService = {
  async getMemories(patientId: string): Promise<PatientMemory[]> {
    const response = await apiClient.get<PatientMemory[]>(
      `/api/v1/patients/${patientId}/memories`,
    );
    return memorySchema.array().parse(response.data);
  },

  async getMemory(patientId: string, memoryId: string): Promise<PatientMemory> {
    const response = await apiClient.get<PatientMemory>(
      `/api/v1/patients/${patientId}/memories/${memoryId}`,
    );
    return memorySchema.parse(response.data);
  },
};
