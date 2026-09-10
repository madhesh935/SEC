import { z } from "zod";
import api from "./api";
const nullable = z.string().nullable();
export const permission = z.enum([
  "viewProfile",
  "viewMemories",
  "contributeMemory",
  "uploadPhoto",
  "uploadVoice",
  "viewUpdates",
]);
export type Permission = z.infer<typeof permission>;
export const familyPatient = z.object({
  id: z.string(),
  preferredName: z.string(),
  relationship: z.string(),
  profilePhotoUrl: nullable,
  preferredLanguage: nullable,
  profession: nullable,
  hometown: nullable,
  hobbies: z.array(z.string()),
  favouriteTopics: z.array(z.string()),
  caregiverName: nullable,
  caregiverEmail: nullable,
  permissions: z.array(permission),
});
export type FamilyPatient = z.infer<typeof familyPatient>;
const familyMemory = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  imageUrl: nullable,
  audioUrl: nullable,
  displayDate: nullable,
  reviewStatus: z.enum(["approved", "pending"]),
  contributedByYou: z.boolean(),
});
export type FamilyMemory = z.infer<typeof familyMemory>;
const grant = z.object({
  userId: z.string(),
  patientId: z.string(),
  relationship: z.string(),
  permissions: z.array(permission),
  status: z.enum(["active", "revoked"]),
  email: nullable,
});
export type Grant = z.infer<typeof grant>;
const device = z.object({
  deviceId: z.string(),
  active: z.boolean(),
  connected: z.boolean(),
  boundAt: nullable,
  lastSeenAt: nullable,
});
const preferences = z.object({
  notificationsEnabled: z.boolean(),
  language: z.string(),
});
const activity = z.object({
  type: z.enum([
    "family_recognition",
    "life_memory_recall",
    "daily_routine_sequencing",
    "photo_recognition",
    "music_memory",
  ]),
  enabled: z.boolean(),
  title: z.string(),
  availableCount: z.number(),
  completionCount: z.number(),
  lastPlayed: nullable,
});
export type ManagedActivity = z.infer<typeof activity>;

const activityFeedback = z.object({
  activityId: z.string(),
  patientId: z.string(),
  result: z.string(),
  response: z.array(z.string()),
  completionTime: z.number(),
  timestamp: z.string(),
  feedback: z.string(),
});
export type ActivityFeedback = z.infer<typeof activityFeedback>;
const dashboard = z.object({
  currentState: nullable,
  conversationsToday: z.number(),
  repeatedTopics: z.number(),
  activeAlerts: z.number(),
  connected: z.boolean(),
  lastActive: nullable,
  biographySummary: nullable,
});
const unifiedActivityItem = z.object({
  id: z.string(),
  type: z.enum(["conversation", "activity", "alert", "memory", "comfort"]),
  title: z.string(),
  description: nullable,
  timestamp: nullable,
  severity: nullable,
  icon: nullable,
});
export type UnifiedActivityItem = z.infer<typeof unifiedActivityItem>;
async function get<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  return schema.parse((await api.get("/api/v1" + path)).data);
}
const p = (id: string) => "/patients/" + encodeURIComponent(id);
const f = (id: string) => "/family/patients/" + encodeURIComponent(id);
export const portalService = {
  dashboard: (id: string) => get(p(id) + "/dashboard", dashboard),
  unifiedActivity: (id: string, limit = 10) =>
    get(p(id) + `/unified-activity?limit=${limit}`, z.array(unifiedActivityItem)),
  devices: (id: string) => get(p(id) + "/devices", z.array(device)),
  revokeDevice: async (id: string, deviceId: string) => {
    await api.delete(
      "/api/v1" + p(id) + "/devices/" + encodeURIComponent(deviceId),
    );
  },
  activities: (id: string) =>
    get(p(id) + "/activity-management", z.array(activity)),
  configureActivity: async (
    id: string,
    type: ManagedActivity["type"],
    enabled: boolean,
  ) => {
    await api.put("/api/v1" + p(id) + "/activity-management", {
      type,
      enabled,
    });
  },
  activityResults: (id: string) =>
    get(p(id) + "/activity-results", z.array(activityFeedback)),
  grants: (id: string) => get(p(id) + "/family-access", z.array(grant)),
  updateGrant: async (id: string, entry: Grant) =>
    grant.parse(
      (
        await api.put(
          "/api/v1" +
            p(id) +
            "/family-access/" +
            encodeURIComponent(entry.userId),
          { permissions: entry.permissions, status: entry.status },
        )
      ).data,
    ),
  invite: async (
    id: string,
    email: string,
    relationship: string,
    permissions: Permission[],
  ) =>
    z
      .object({ token: z.string(), email: z.string(), expiresAt: z.string() })
      .parse(
        (
          await api.post("/api/v1" + p(id) + "/invitations", {
            email,
            relationship,
            permissions,
          })
        ).data,
      ),
  preferences: () => get("/users/me/preferences", preferences),
  savePreferences: async (data: z.infer<typeof preferences>) =>
    preferences.parse(
      (await api.put("/api/v1/users/me/preferences", data)).data,
    ),
  saveProfile: async (name: string) => {
    await api.put("/api/v1/users/me/profile", { name });
  },
  familyPatients: () => get("/family/patients", z.array(familyPatient)),
  familyPatient: (id: string) => get(f(id), familyPatient),
  familyMemories: (id: string) =>
    get(f(id) + "/memories", z.array(familyMemory)),
  contribute: async (
    id: string,
    data: {
      title: string;
      description: string;
      category: "FAMILY";
      imageUrl?: string;
      audioUrl?: string;
    },
  ) =>
    familyMemory.parse(
      (await api.post("/api/v1" + f(id) + "/memories", data)).data,
    ),
  suggestions: (id: string) =>
    get(
      f(id) + "/connection",
      z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          description: z.string(),
          memoryId: z.string(),
        }),
      ),
    ),
  notifications: (id: string) =>
    get(
      f(id) + "/notifications",
      z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          message: z.string(),
          createdAt: nullable,
        }),
      ),
    ),
};
