import apiClient from "./api";
import { FamilyMember, FamilyPrompt } from "@/types";
import { FamilyMemberFormData } from "@/schemas/family.schema";

export const familyService = {
  /**
   * Fetch all registered family members for a patient.
   */
  async getFamilyMembers(patientId: string): Promise<FamilyMember[]> {
    const response = await apiClient.get<FamilyMember[]>(
      `/api/v1/patients/${patientId}/family`
    );
    return response.data;
  },

  /**
   * Add a new family member.
   */
  async addFamilyMember(
    patientId: string,
    data: FamilyMemberFormData
  ): Promise<FamilyMember> {
    const response = await apiClient.post<FamilyMember>(
      `/api/v1/patients/${patientId}/family`,
      data
    );
    return response.data;
  },

  /**
   * Update family member details.
   */
  async updateFamilyMember(
    patientId: string,
    familyId: string,
    data: Partial<FamilyMemberFormData>
  ): Promise<FamilyMember> {
    const response = await apiClient.put<FamilyMember>(
      `/api/v1/patients/${patientId}/family/${familyId}`,
      data
    );
    return response.data;
  },

  /**
   * Remove a family member.
   */
  async deleteFamilyMember(
    patientId: string,
    familyId: string
  ): Promise<void> {
    await apiClient.delete(
      `/api/v1/patients/${patientId}/family/${familyId}`
    );
  },

  /**
   * Fetch suggested conversation topics and prompts for family connection.
   */
  async getFamilyPrompts(patientId: string): Promise<FamilyPrompt[]> {
    const response = await apiClient.get<FamilyPrompt[]>(
      `/api/v1/patients/${patientId}/family-prompts`
    );
    return response.data;
  },
};
