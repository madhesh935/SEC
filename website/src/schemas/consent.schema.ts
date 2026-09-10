import { z } from "zod";

export const consentSchema = z.object({
  biographyUsage: z.boolean().optional(),
  aiMayMentionMemoryDirectly: z.boolean().optional(),
  patientMaySeeMemory: z.boolean().optional(),
  personalDataCollection: z.boolean().default(true),
  memoriesUsage: z.boolean().default(true),
  photosUsage: z.boolean().default(true),
  voiceRecordingsUsage: z.boolean().default(true),
  aiConversationUsage: z.boolean().default(true),
  caregiverAccessLevel: z.enum(["FULL", "RESTRICTED"]).default("FULL"),
  familyAccessLevel: z.enum(["APPROVED_ONLY", "NONE", "CUSTOM"]).default("APPROVED_ONLY"),
  emergencyEscalationEnabled: z.boolean().default(true),
  dataRetentionDays: z.coerce.number().min(30).max(3650).default(365),
});

export type ConsentFormData = z.infer<typeof consentSchema>;

