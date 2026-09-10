export type ActivityType =
  | 'family_recognition'
  | 'life_memory_recall'
  | 'daily_routine_sequencing';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  iconName?: string;
  estimatedMinutes?: number;
  completed?: boolean;
}

export interface RecommendedActivitiesResponse {
  activities: ActivityItem[];
}
