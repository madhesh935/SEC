import { z } from "zod";

const optionalText = z.string().nullable().optional();
export const patientSchema = z.object({
  id: z.string(),
  firstName: optionalText,
  preferredName: z.string(),
  preferredLanguage: z.string(),
  profilePhotoUrl: optionalText,
});
export const familySchema = z.object({
  id: z.string(),
  name: z.string(),
  relationship: optionalText,
  description: optionalText,
  photoUrl: optionalText,
  phoneAvailable: z.boolean(),
  phoneNumber: optionalText,
  voiceMessageAvailable: z.boolean(),
  voiceMessageUrl: optionalText,
});
export const memorySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: optionalText,
  category: z.string(),
  imageUrl: optionalText,
  audioUrl: optionalText,
  displayDate: optionalText,
  associatedPeople: z.array(z.string()),
  photoUrls: z.array(z.string()),
  people: z.array(familySchema),
});
export const comfortSchema = z.object({
  id: z.string(),
  resourceId: z.string(),
  type: z.enum(["music", "voice", "photo", "audio", "memory"]),
  title: z.string(),
  mediaUrl: optionalText,
  imageUrl: optionalText,
  description: optionalText,
  durationSeconds: z.number().nullable().optional(),
});
export const actionSchema = z.object({
  type: z.enum([
    "PLAY_FAMILY_VOICE",
    "SHOW_MEMORY",
    "PLAY_COMFORT_AUDIO",
    "CALL_CAREGIVER",
    "OPEN_FAMILY",
    "OPEN_COMFORT",
  ]),
  label: z.string(),
  resourceId: optionalText,
});
export const recommendationSchema = z
  .object({ title: z.string(), action: actionSchema })
  .nullable();
export const conversationSchema = z.object({
  conversationId: z.string(),
  transcript: z.string(),
  responseText: z.string(),
  responseAudioUrl: z.string().nullable(),
  status: z.string(),
  uiMode: z.enum(["normal", "comfort", "caregiver_notified"]),
  actions: z.array(actionSchema),
});
export const activityTypeSchema = z.enum([
  "family_recognition",
  "life_memory_recall",
  "daily_routine_sequencing",
  "photo_recognition",
  "music_memory",
]);
export const activitySchema = z.object({
  id: z.string(),
  type: activityTypeSchema,
  title: z.string(),
  description: z.string(),
  iconName: optionalText,
  estimatedMinutes: z.number().nullable().optional(),
  completed: z.boolean().optional(),
});
const option = z.object({ id: z.string(), label: z.string() });
export const activityDetailSchema = z.object({
  id: z.string(),
  type: activityTypeSchema,
  title: z.string(),
  description: z.string(),
  prompt: z.string(),
  difficulty: z.enum(["gentle", "supported"]),
  interactionMode: z.enum(["choice", "sequence", "reflection", "listen"]),
  imageUrl: optionalText,
  audioUrl: optionalText,
  nextActivityId: optionalText,
  options: z.array(option),
  steps: z.array(option),
});
export const feedbackSchema = z.object({
  activityId: z.string(),
  patientId: z.string(),
  result: z.string(),
  response: z.array(z.string()),
  completionTime: z.number(),
  timestamp: z.string(),
  feedback: z.string(),
});
export const settingsSchema = z.object({
  textSize: z.enum(["normal", "large", "extra-large"]),
  reducedMotion: z.boolean(),
  voiceVolume: z.number().min(0).max(1),
  replayVoiceResponse: z.boolean(),
});
export const helpSchema = z.object({
  caregiverName: optionalText,
  caregiverPhone: optionalText,
  caregiverAvailable: z.boolean().nullable().optional(),
  emergencyPhone: optionalText,
  familyContactPhone: optionalText,
  familyContactName: optionalText,
});
export const helpResultSchema = z.object({
  success: z.boolean(),
  message: optionalText,
  timestamp: optionalText,
});
export const pairingSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  patientId: z.string().min(1),
  patientPreferredName: optionalText,
});
export type PatientAction = z.infer<typeof actionSchema>;
export type ActivityDetail = z.infer<typeof activityDetailSchema>;
export type ActivityFeedback = z.infer<typeof feedbackSchema>;
export type PatientSettings = z.infer<typeof settingsSchema>;
