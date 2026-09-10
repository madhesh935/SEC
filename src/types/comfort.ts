export interface ComfortContent {
  id: string;
  type: 'music' | 'voice' | 'photo' | 'audio' | 'memory';
  title: string;
  mediaUrl?: string;
  imageUrl?: string;
  durationSeconds?: number;
  description?: string;
}

export interface ComfortContentResponse {
  items: ComfortContent[];
}
