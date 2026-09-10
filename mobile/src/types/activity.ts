import { z } from "zod";
import { activitySchema, activityTypeSchema } from "../services/contracts";
export type ActivityType = z.infer<typeof activityTypeSchema>;
export type ActivityItem = z.infer<typeof activitySchema>;
