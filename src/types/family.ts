export interface FamilyMember {
  id: string;
  name: string;
  relationship?: string;
  photoUrl?: string;
  phoneAvailable?: boolean;
  phoneNumber?: string;
  voiceMessageAvailable?: boolean;
  voiceMessageUrl?: string;
  description?: string;
}

export interface FamilyMembersResponse {
  family: FamilyMember[];
}
