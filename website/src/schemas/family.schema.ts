import { z } from "zod";

export const familyMemberSchema = z.object({
  description: z.string().max(500).optional(),
  patientVisible: z.boolean().default(true),
  name: z.string().min(1, "Family member name is required"),
  relationship: z.string().min(1, "Relationship is required"),
  photoUrl: z.string().optional(),
  phone: z.string().optional(),
  priority: z.coerce.number().min(1).max(10).default(1),
  voiceRecordingUrl: z.string().optional(),
});

export type FamilyMemberFormData = z.infer<typeof familyMemberSchema>;
