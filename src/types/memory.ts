export interface PatientMemory {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  audioUrl?: string;
  associatedPeople?: string[];
  displayDate?: string;
}

export interface PatientMemoriesResponse {
  memories: PatientMemory[];
}
