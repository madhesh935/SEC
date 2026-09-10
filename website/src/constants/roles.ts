import { UserRole } from "@/types";

/**
 * Role-based permission definitions.
 * Note: These frontend checks improve UX and safety, but all sensitive data access
 * and mutations MUST also be strictly enforced by the backend and Firestore security rules.
 */
export interface RolePermissions {
  canManagePatients: boolean;
  canManageAllMemories: boolean;
  canViewLiveCompanion: boolean;
  canManageFamilyMembers: boolean;
  canViewRepetitionAnalytics: boolean;
  canViewDistressAnalytics: boolean;
  canManageAlerts: boolean;
  canManageConsent: boolean;
  canAccessSystemSettings: boolean;
  canSubmitMemories: boolean;
  canViewFamilyPrompts: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  caregiver: {
    canManagePatients: true,
    canManageAllMemories: true,
    canViewLiveCompanion: true,
    canManageFamilyMembers: true,
    canViewRepetitionAnalytics: true,
    canViewDistressAnalytics: true,
    canManageAlerts: true,
    canManageConsent: true,
    canAccessSystemSettings: true,
    canSubmitMemories: true,
    canViewFamilyPrompts: true,
  },
  family: {
    canManagePatients: false,
    canManageAllMemories: false,
    canViewLiveCompanion: false,
    canManageFamilyMembers: false,
    canViewRepetitionAnalytics: false,
    canViewDistressAnalytics: false,
    canManageAlerts: false,
    canManageConsent: false,
    canAccessSystemSettings: false,
    canSubmitMemories: true, // Family can submit/suggest memories
    canViewFamilyPrompts: true, // Family connection prompts
  },
  admin: {
    canManagePatients: true,
    canManageAllMemories: true,
    canViewLiveCompanion: true,
    canManageFamilyMembers: true,
    canViewRepetitionAnalytics: true,
    canViewDistressAnalytics: true,
    canManageAlerts: true,
    canManageConsent: true,
    canAccessSystemSettings: true,
    canSubmitMemories: true,
    canViewFamilyPrompts: true,
  },
};

export function hasPermission(
  role: UserRole | undefined,
  permission: keyof RolePermissions
): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.[permission] ?? false;
}
