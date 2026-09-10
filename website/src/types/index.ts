// ==========================================
// User & Auth Types
// ==========================================
export type UserRole = "caregiver" | "family" | "admin";

export interface User {
  id: string;
  name?: string;
  email?: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface AuthSession {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// ==========================================
// Patient Types
// ==========================================
export type DementiaStage = "EARLY" | "MID" | "LATE";

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  isPrimary?: boolean;
}

export interface Patient {
  emergencyServicesPhone?: string;
  id: string;
  firstName?: string;
  preferredName?: string;
  age?: number;
  dateOfBirth?: string;
  gender?: string;
  profilePhotoUrl?: string;
  preferredLanguage?: string;
  stage?: DementiaStage;
  primaryCaregiverId?: string;
  lastInteraction?: string;
  // Biography & Life Story (Step 10)
  profession?: string;
  hometown?: string;
  placesLived?: string[];
  education?: string;
  importantLifeEvents?: string[];
  hobbies?: string[];
  favouriteTopics?: string[];
  favouriteFood?: string[];
  favouriteMusic?: string[];
  routines?: string[];
  meaningfulPlaces?: string[];
  // Care Information
  communicationPreferences?: string;
  comfortPreferences?: string;
  emergencyContacts?: EmergencyContact[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PatientStatus {
  currentState?: string | null;
  distressScore?: number | null;
  interactionsToday?: number;
  repeatedQuestions?: number;
  eveningRisk?: string;
  lastActiveTimestamp?: string;
}

// ==========================================
// Family Member Types
// ==========================================
export interface FamilyMember {
  description?: string;
  patientVisible?: boolean;
  id: string;
  patientId: string;
  name: string;
  relationship?: string;
  photoUrl?: string;
  phone?: string;
  priority?: number;
  voiceRecordingUrl?: string;
  createdAt?: string;
}

export interface FamilyPrompt {
  id: string;
  topic: string;
  description: string;
  recommendedTone?: string;
  suggestedBy?: string;
}

// ==========================================
// Personal Memory Types
// ==========================================
export type SensitivityLevel = "LOW" | "MEDIUM" | "HIGH";
export type MemoryCategory =
  | "FAMILY"
  | "CAREER"
  | "TRAVEL"
  | "CHILDHOOD"
  | "HOBBY"
  | "MUSIC"
  | "SPECIAL_EVENT"
  | "OTHER";

export interface Memory {
  displayDate?: string;
  photoUrls?: string[];
  id: string;
  patientId: string;
  title: string;
  description?: string;
  category?: MemoryCategory | string;
  imageUrl?: string;
  audioUrl?: string;
  sensitivity?: SensitivityLevel;
  approved?: boolean;
  useForRedirection?: boolean;
  // Sensitive Memory Controls (Step 13)
  aiMayKnowInternally?: boolean;
  aiMayMentionDirectly?: boolean;
  useForSafetyReasoning?: boolean;
  visibleToPatient?: boolean;
  visibleToCaregiver?: boolean;
  visibleToSelectedFamily?: boolean;
  emotionalTone?: string;
  associatedPeople?: string[];
  createdAt?: string;
  updatedAt?: string;
}

// ==========================================
// Alert Types
// ==========================================
export type AlertSeverity = "LOW" | "MODERATE" | "HIGH" | "URGENT";
export type AlertStatus = "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";

export interface AlertAction {
  id: string;
  actionType: "ACKNOWLEDGE" | "RESOLVE" | "NOTE" | "ESCALATE";
  performedBy: string;
  timestamp: string;
  note?: string;
}

export interface Alert {
  id: string;
  patientId: string;
  patientName?: string;
  severity: AlertSeverity;
  reason: string;
  createdAt: string;
  status: AlertStatus;
  context?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  actionHistory?: AlertAction[];
}

// ==========================================
// Conversation & Live Companion Types
// ==========================================
export interface ConversationEvent {
  id: string;
  patientId: string;
  transcript?: string;
  intent?: string;
  emotion?: string;
  repetitionCount?: number;
  distressScore?: number | null;
  strategy?: string[];
  createdAt: string;
  aiResponse?: string;
  safetyStatus?: string;
  retrievedMemory?: string;
}

export interface LiveCompanionStatus {
  isActive: boolean;
  currentSpeech?: string;
  intent?: string;
  detectedEmotion?: string;
  repetitionCount?: number;
  distressScore?: number | null;
  retrievedMemory?: string;
  selectedStrategy?: string;
  aiResponse?: string;
  safetyStatus?: string;
  currentStage?: DementiaStage;
  sessionStartedAt?: string;
}

// ==========================================
// Analytics Types
// ==========================================
export interface DistressTrendPoint {
  timestamp: string;
  timeLabel: string;
  distressScore: number;
  baselineScore?: number;
}

export interface RepeatedTopicItem {
  id: string;
  topic: string;
  count: number;
  lastOccurred: string;
  associatedStrategies: string[];
}

export interface RepetitionAnalyticsData {
  totalEvents: number;
  averagePerTopic: number;
  topics: RepeatedTopicItem[];
  trend: { time: string; count: number }[];
  timeOfDayBreakdown: { hour: string; count: number }[];
  strategiesWithReducedDistress: string[];
}

export interface EmotionDistributionItem {
  emotion: string;
  percentage: number;
  count: number;
}

export interface DistressAnalyticsData {
  currentDistressScore: number | null;
  riskLevel: "LOW" | "MODERATE" | "ELEVATED" | "HIGH" | null;
  trend: DistressTrendPoint[];
  emotionDistribution: EmotionDistributionItem[];
  highDistressEvents: ConversationEvent[];
  commonTriggers: { trigger: string; frequency: number }[];
  strategiesUsed: { strategy: string; count: number; successRate?: number }[];
}

export interface HourlyPatternItem {
  hour: number;
  label: string;
  distressScore: number | null;
  repetitionCount: number;
  isHighRiskWindow: boolean;
}

export interface PatternAnalyticsData {
  hourlyPatterns: HourlyPatternItem[];
  recurringEveningWindows: string[];
  commonEveningTriggers: string[];
  comfortStrategiesUsed: { strategy: string; count: number; observedChange: string }[];
}

export interface StrategyEffectivenessItem {
  strategyName: string;
  usageCount: number;
  observedChange: string;
  confidenceScore?: number;
  category: "MUSIC" | "MEMORY" | "VOICE" | "REDIRECTION" | "REASSURANCE" | "OTHER";
}

// ==========================================
// Consent & Privacy Types
// ==========================================
export interface ConsentSettings {
  patientId: string;
  personalDataCollection: boolean;
  memoriesUsage: boolean;
  photosUsage: boolean;
  voiceRecordingsUsage: boolean;
  aiConversationUsage: boolean;
  caregiverAccessLevel: "FULL" | "RESTRICTED";
  familyAccessLevel: "APPROVED_ONLY" | "NONE" | "CUSTOM";
  emergencyEscalationEnabled: boolean;
  dataRetentionDays: number;
  updatedAt?: string;
}

// ==========================================
// API Types
// ==========================================
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
