import { z } from "zod";
import { memorySchema } from "../services/contracts";
export type PatientMemory = z.infer<typeof memorySchema>;

export type PatientMemoriesResponse = PatientMemory[];
