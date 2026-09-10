import { z } from "zod";

export const pinSchema = z.object({
  pin: z
    .string()
    .length(4, "PIN must be exactly 4 digits")
    .regex(/^\d{4}$/, "PIN must only contain numbers"),
});

export type PinFormData = z.infer<typeof pinSchema>;
