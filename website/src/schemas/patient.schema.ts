import { z } from "zod";

export const emergencyContactSchema = z.object({
  name: z.string().min(1, "Contact name is required"),
  relationship: z.string().min(1, "Relationship is required"),
  phone: z.string().min(6, "Valid phone number is required"),
  isPrimary: z.boolean().default(false),
});

export const createPatientStep1Schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  preferredName: z.string().optional(),
  // Coercing "" (an empty-but-optional number input) straight to a number
  // yields NaN, which then fails .min() even though the field is optional -
  // preprocess strips blank input back to undefined first.
  age: z.preprocess(
    (val) => (val === "" || val === null ? undefined : val),
    z.coerce.number().min(1, "Please enter a valid age").max(130).optional()
  ),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  preferredLanguage: z.string().min(1, "Preferred language is required"),
  profilePhotoUrl: z.string().optional(),
});

export const createPatientStep2Schema = z.object({
  stage: z.enum(["EARLY", "MID", "LATE"], {
    errorMap: () => ({
      message: "Please select a caregiver/clinician configured dementia stage",
    }),
  }),
  primaryCaregiverId: z.string().optional(),
  communicationPreferences: z.string().optional(),
});

export const createPatientStep4Schema = z.object({
  profession: z.string().optional(),
  hometown: z.string().optional(),
  placesLived: z.array(z.string()).default([]),
  education: z.string().optional(),
  importantLifeEvents: z.array(z.string()).default([]),
  hobbies: z.array(z.string()).default([]),
  favouriteTopics: z.array(z.string()).default([]),
  favouriteFood: z.array(z.string()).default([]),
  favouriteMusic: z.array(z.string()).default([]),
  routines: z.array(z.string()).default([]),
  meaningfulPlaces: z.array(z.string()).default([]),
});

export const createPatientFullSchema = createPatientStep1Schema
  .merge(createPatientStep2Schema)
  .merge(createPatientStep4Schema)
  .extend({
    emergencyContacts: z.array(emergencyContactSchema).default([]),
    comfortPreferences: z.string().optional(),
    personalDataConsent: z.boolean().default(true),
    aiConversationConsent: z.boolean().default(true),
    emergencyEscalationConsent: z.boolean().default(true),
  });

export type CreatePatientFormData = z.infer<typeof createPatientFullSchema>;
