import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import { z } from "zod";
import api from "./api";
import { auth } from "./firebase";
import { User } from "@/types";
import {
  LoginFormData,
  SignupFormData,
  ForgotPasswordFormData,
} from "@/schemas/auth.schema";

const profileSchema = z.object({
  uid: z.string(),
  email: z.string().nullable(),
  role: z.enum(["caregiver", "family", "admin"]),
  name: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
});

const mapUser = (data: unknown): User => {
  const p = profileSchema.parse(data);
  return {
    id: p.uid,
    email: p.email ?? undefined,
    name: p.name ?? undefined,
    role: p.role,
    avatarUrl: p.avatarUrl ?? undefined,
  };
};

export interface LoginResponse {
  token: string;
  user: User;
}

function identity() {
  if (!auth)
    throw new Error(
      "Sign-in is not configured. Please contact the service administrator.",
    );
  return auth;
}

export const authService = {
  /**
   * Exchange a Firebase ID token for a GeriCare session.
   * Caregiver LOGIN → /auth/session (validates existing profile)
   * Caregiver SIGNUP → /auth/caregiver-registration (creates profile)
   * Family LOGIN/SIGNUP → /auth/session (+ optional invitation token)
   */
  async exchange(
    idToken: string,
    path: string,
    invitationToken?: string,
  ): Promise<LoginResponse> {
    const { data } = await api.post("/api/v1" + path, {
      idToken,
      ...(invitationToken ? { invitationToken } : {}),
    });
    return { token: z.string().parse(data.token), user: mapUser(data.user) };
  },

  async login(
    data: LoginFormData,
    _portal: "caregiver" | "family" = "caregiver",
    invitationToken?: string,
  ) {
    // Firebase client SDK sign-in establishes the client session for token refresh
    const result = await signInWithEmailAndPassword(
      identity(),
      data.email,
      data.password,
    );
    const token = await result.user.getIdToken();
    // Both caregiver and family login use /auth/session — validates existing profile
    return this.exchange(token, "/auth/session", invitationToken);
  },

  async signup(
    data: SignupFormData,
    portal: "caregiver" | "family" = "caregiver",
    invitationToken?: string,
  ) {
    if (portal === "family" && !invitationToken)
      throw new Error(
        "Please use your caregiver's invitation to create an account.",
      );
    const result = await createUserWithEmailAndPassword(
      identity(),
      data.email,
      data.password,
    );
    await updateProfile(result.user, { displayName: data.name });
    const token = await result.user.getIdToken();
    // Caregiver signup → /auth/caregiver-registration (creates profile)
    // Family signup → /auth/session (+ required invitation to bind to patient)
    const path =
      portal === "caregiver"
        ? "/auth/caregiver-registration"
        : "/auth/session";
    const session = await this.exchange(token, path, invitationToken);
    await api.put("/api/v1/users/me/profile", { name: data.name });
    return { ...session, user: { ...session.user, name: data.name } };
  },

  async loginWithGoogle(
    idToken?: string,
    _portal: "caregiver" | "family" = "caregiver",
    invitationToken?: string,
  ) {
    if (!idToken) throw new Error("Please sign in with Google first.");
    // Google flows: caregiver first-time → caregiver-registration; returning/family → session
    // We use /auth/session for both since get_or_create handles new Google users gracefully
    return this.exchange(idToken, "/auth/session", invitationToken);
  },

  async getCurrentUser() {
    return mapUser((await api.get("/api/v1/auth/me")).data);
  },

  async logout() {
    await signOut(identity());
  },

  async refreshSession() {
    return { token: await identity().currentUser!.getIdToken(true) };
  },

  async forgotPassword(data: ForgotPasswordFormData) {
    await sendPasswordResetEmail(identity(), data.email);
    return {
      success: true,
      message:
        "Password reset instructions have been requested. Please check your inbox.",
    };
  },
};
