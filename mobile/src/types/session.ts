export interface SessionData {
  accessToken: string;
  refreshToken?: string;
  patientId: string;
  deviceId: string;
  patientPreferredName?: string | null;
}

export interface SessionState {
  session: SessionData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
