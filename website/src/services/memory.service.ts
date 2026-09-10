import apiClient from "./api";
import { Memory } from "@/types";
import { MemoryFormData } from "@/schemas/memory.schema";

export interface MemoryFilters {
  category?: string;
  sensitivity?: string;
  approved?: boolean;
}

export const memoryService = {
  /**
   * Fetch personal memories for a patient, with optional filters.
   */
  async getMemories(
    patientId: string,
    filters?: MemoryFilters
  ): Promise<Memory[]> {
    const response = await apiClient.get<Memory[]>(
      `/api/v1/patients/${patientId}/memories`,
      { params: filters }
    );
    return response.data;
  },

  /**
   * Add a new personal memory for a patient.
   */
  async createMemory(
    patientId: string,
    data: MemoryFormData
  ): Promise<Memory> {
    const response = await apiClient.post<Memory>(
      `/api/v1/patients/${patientId}/memories`,
      data
    );
    return response.data;
  },

  /**
   * Update an existing memory.
   */
  async updateMemory(
    patientId: string,
    memoryId: string,
    data: Partial<MemoryFormData>
  ): Promise<Memory> {
    const response = await apiClient.put<Memory>(
      `/api/v1/patients/${patientId}/memories/${memoryId}`,
      data
    );
    return response.data;
  },

  /**
   * Delete a memory.
   */
  async deleteMemory(patientId: string, memoryId: string): Promise<void> {
    await apiClient.delete(
      `/api/v1/patients/${patientId}/memories/${memoryId}`
    );
  },
};
