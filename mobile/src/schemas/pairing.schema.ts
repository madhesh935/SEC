import { z } from "zod";

export const pairingSchema = z.object({
  pairingCode: z
    .string()
    .min(6, "Pairing code must be at least 6 characters")
    .max(12, "Pairing code cannot exceed 12 characters")
    .regex(
      /^[A-Za-z0-9-]+$/,
      "Pairing code can only contain letters, numbers, and dashes",
    ),
});

export type PairingFormData = z.infer<typeof pairingSchema>;
