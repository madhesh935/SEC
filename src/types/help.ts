export interface HelpContacts {
  caregiverName?: string;
  caregiverPhone?: string;
  caregiverAvailable?: boolean;
  emergencyPhone?: string;
  familyContactPhone?: string;
  familyContactName?: string;
}

export interface RequestHelpPayload {
  patientId: string;
  reason?: string;
}

export interface RequestHelpResponse {
  success: boolean;
  message?: string;
  timestamp?: string;
}
