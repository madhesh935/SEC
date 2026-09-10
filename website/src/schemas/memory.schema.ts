import { z } from "zod";

export const memorySchema = z.object({
  displayDate: z.string().max(80).optional(),
  photoUrls: z.array(z.string()).default([]),
  title: z.string().min(1, "Memory title is required"),
  description: z.string().min(1, "Memory story or description is required"),
  category: z.string().min(1, "Category is required"),
  imageUrl: z.string().optional(),
  audioUrl: z.string().optional(),
  sensitivity: z.enum(["LOW", "MEDIUM", "HIGH"]).default("LOW"),
  approved: z.boolean().default(true),
  useForRedirection: z.boolean().default(true),
  aiMayKnowInternally: z.boolean().default(true),
  aiMayMentionDirectly: z.boolean().default(false),
  useForSafetyReasoning: z.boolean().default(true),
  visibleToPatient: z.boolean().default(false),
  visibleToCaregiver: z.boolean().default(true),
  visibleToSelectedFamily: z.boolean().default(false),
  emotionalTone: z.string().optional(),
  associatedPeople: z.array(z.string()).default([]),
});

export type MemoryFormData = z.infer<typeof memorySchema>;
