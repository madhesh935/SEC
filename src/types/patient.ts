import { z } from "zod";
import { patientSchema } from "../services/contracts";
export type Patient = z.infer<typeof patientSchema>;

export type PatientProfileResponse = Patient;
