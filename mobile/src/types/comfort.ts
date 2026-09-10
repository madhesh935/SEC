import { z } from "zod";
import { comfortSchema } from "../services/contracts";
export type ComfortContent = z.infer<typeof comfortSchema>;

export type ComfortContentResponse = ComfortContent[];
