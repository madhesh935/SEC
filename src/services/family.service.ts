import { familySchema } from "./contracts";
import { apiClient } from "./api";
import { FamilyMember } from "../types/family";

export const familyService = {
  async getFamilyMembers(patientId: string): Promise<FamilyMember[]> {
    const response = await apiClient.get<FamilyMember[]>(
      `/api/v1/patients/${patientId}/family`,
    );
    return familySchema.array().parse(response.data);
  },

  async getFamilyMember(
    patientId: string,
    familyMemberId: string,
  ): Promise<FamilyMember> {
    const response = await apiClient.get<FamilyMember>(
      `/api/v1/patients/${patientId}/family/${familyMemberId}`,
    );
    return familySchema.parse(response.data);
  },
};
