import { z } from "zod";
import { familySchema } from "../services/contracts";
export type FamilyMember = z.infer<typeof familySchema>;

export type FamilyMembersResponse = FamilyMember[];
