import { apiClient } from './api';
import { Patient } from '../types/patient';

export const patientService = {
  async getPatientProfile(patientId: string): Promise<Patient> {
    const response = await apiClient.get<Patient>(`/api/v1/patients/${patientId}`);
    return response.data;
  },
};
