export interface Patient {
  id: string;
  preferredName?: string;
  firstName?: string;
  profilePhotoUrl?: string;
  preferredLanguage?: string;
  stageDisplayLabel?: string;
}

export interface PatientProfileResponse {
  patient: Patient;
}
