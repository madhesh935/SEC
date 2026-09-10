export interface HelpContacts {
  caregiverName?: string | null;
  caregiverPhone?: string | null;
  caregiverAvailable?: boolean | null;
  emergencyPhone?: string | null;
  familyContactPhone?: string | null;
  familyContactName?: string | null;
}

export interface RequestHelpPayload {
  patientId: string;
  reason?: string | null;
}

export interface RequestHelpResponse {
  success: boolean;
  message?: string | null;
  timestamp?: string | null;
}
