"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { ShieldCheck, ArrowRight, Brain, Users, LineChart, HeartHandshake } from "lucide-react";
import { auth } from "@/services/firebase";
import { authService, LoginResponse } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { Brand } from "./Primitives";

function GoogleIcon() {
  return (
    <svg className="gc-google-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
    </svg>
  );
}

const caregiverFeatures = [
  { icon: Brain, title: "Stage-adaptive AI", desc: "Responds appropriately to early, mid and late-stage needs" },
  { icon: LineChart, title: "Real-time insights", desc: "Distress monitoring, repetition patterns, interaction data" },
  { icon: Users, title: "Family coordination", desc: "Invite family with granular memory and access controls" },
];

const familyFeatures = [
  { icon: HeartHandshake, title: "Shared memories", desc: "View and contribute stories approved by your caregiver" },
  { icon: Brain, title: "Stay connected", desc: "Familiar voices and memories help your loved one every day" },
  { icon: LineChart, title: "Approved updates", desc: "Receive meaningful updates shared by the care team" },
];

export function AuthPage({
  portal,
  signup = false,
}: {
  portal: "caregiver" | "family";
  signup?: boolean;
}) {
  const router = useRouter();
  const search = useSearchParams();
  const [invitation, setInvitation] = useState(search.get("invitation") || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const family = portal === "family";
  const features = family ? familyFeatures : caregiverFeatures;

  async function run(action: () => Promise<LoginResponse>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await action();
      useAuthStore.getState().setSession(result.user, result.token);
      router.replace(result.user.role === "family" ? "/family" : "/caregiver");
    } catch (e) {
      const code = (e as { code?: string }).code;
      setError(
        code === "auth/user-not-found" || code === "auth/wrong-password"
          ? "Email or password is incorrect. Please try again."
          : code === "auth/email-already-in-use"
            ? "An account already exists with this email. Please sign in instead."
            : code === "auth/weak-password"
              ? "Please choose a password of at least 8 characters."
              : code?.startsWith("auth/")
                ? "We couldn't sign you in. Check your details and try again."
                : (e as Error).message ||
                    "We couldn't sign you in. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    if (!auth) throw new Error("Google sign-in is not configured.");
    const result = await signInWithPopup(auth, new GoogleAuthProvider());
    return authService.loginWithGoogle(
      await result.user.getIdToken(),
      portal,
      invitation || undefined,
    );
  }

  return (
    <main className="gc-auth">
      {/* ── Left brand panel ── */}
      <div className="gc-auth-panel-brand">
        <Link href={"/" + portal} aria-label="GeriCare home">
          <Brand />
        </Link>

        <div className="gc-auth-brand-body">
          <div>
            <p style={{ fontSize: 11, letterSpacing: "2px", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", fontWeight: 700, marginBottom: 16 }}>
              {family ? "Family Portal" : "Caregiver Portal"}
            </p>
            <h2>
              {family
                ? "Stay close to the people you love."
                : "Care built around the person you know."}
            </h2>
            <p style={{ marginTop: 14 }}>
              {family
                ? "Share familiar stories, voices and memories that help your loved one feel connected — wherever you are."
                : "A voice-first AI companion that grounds conversations in real biography, memory and routine — made personal by you."}
            </p>
          </div>

          <div className="gc-auth-brand-features">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="gc-auth-brand-feature">
                <div className="gc-auth-brand-feature-icon">
                  <Icon size={18} color="rgba(255,255,255,0.9)" />
                </div>
                <div className="gc-auth-brand-feature-text">
                  <strong>{title}</strong>
                  <span>{desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="gc-auth-brand-footer">
          GeriCare AI · Familiarity, connection and care. · HIPAA-aware design
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div className="gc-auth-form-panel">
        <div className="gc-auth-form-inner">
          <div className="gc-auth-portal-switch">
            <Link href={"/" + (family ? "caregiver" : "family") + "/login"}>
              {family ? "Caregiver portal" : "Family portal"}
              <ArrowRight size={13} />
            </Link>
          </div>

          <h2>
            {family ? "Family" : "Caregiver"} {signup ? "Account" : "Sign In"}
          </h2>
          <p className="gc-muted">
            {signup
              ? family
                ? "Use the invitation code shared by your caregiver."
                : "Create your account to start personalizing care."
              : "Welcome back — a familiar place to pick up where you left off."}
          </p>

          {error && (
            <p className="gc-form-error" role="alert" style={{ marginTop: 12 }}>
              {error}
            </p>
          )}
          {notice && <p role="status" style={{ marginTop: 12, fontSize: 13, color: "#2e6e4e" }}>{notice}</p>}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void run(() =>
                signup
                  ? authService.signup(
                      { name, email, password, confirmPassword: password },
                      portal,
                      invitation || undefined,
                    )
                  : authService.login(
                      { email, password, rememberMe: true },
                      portal,
                      invitation || undefined,
                    ),
              );
            }}
          >
            {signup && (
              <label>
                Your name
                <input
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={100}
                  placeholder="Full name"
                />
              </label>
            )}
            <label>
              Email address
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </label>
            <label>
              Password
              {!signup && (
                <button
                  type="button"
                  className="gc-forgot-link"
                  onClick={async () => {
                    if (!email) {
                      setError("Enter your email address above first.");
                      return;
                    }
                    setBusy(true);
                    try {
                      const result = await authService.forgotPassword({ email });
                      setNotice(result.message);
                    } catch {
                      setError(
                        "We couldn't request a password reset. Please try again.",
                      );
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Forgot password?
                </button>
              )}
              <input
                type="password"
                autoComplete={signup ? "new-password" : "current-password"}
                minLength={signup ? 8 : 1}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={signup ? "At least 8 characters" : "Your password"}
              />
            </label>
            {family && (
              <label>
                Invitation code {signup ? "" : "(if joining a loved one)"}
                <input
                  value={invitation}
                  onChange={(e) => setInvitation(e.target.value)}
                  required={signup}
                  autoComplete="off"
                  placeholder="Paste the invitation code here"
                />
              </label>
            )}
            <button className="gc-button" disabled={busy} style={{ marginTop: 4 }}>
              {busy ? "Connecting…" : signup ? "Create account" : "Sign in"}
              <ArrowRight size={17} />
            </button>
          </form>

          <div className="gc-divider" style={{ marginTop: 16 }}>or</div>

          <button
            type="button"
            className="gc-button secondary"
            style={{ width: "100%", justifyContent: "center" }}
            disabled={busy || (family && signup && !invitation)}
            onClick={() => void run(google)}
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <p className="gc-auth-switch">
            {signup ? "Already have an account?" : "New to GeriCare?"}{" "}
            <Link
              href={
                "/" +
                portal +
                (signup ? "/login" : "/signup") +
                (invitation
                  ? "?invitation=" + encodeURIComponent(invitation)
                  : "")
              }
            >
              {signup
                ? "Sign in"
                : family
                  ? "Join with an invitation"
                  : "Create caregiver account"}
            </Link>
          </p>

          <small className="gc-auth-notice" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 16, fontSize: 11, color: "#8b9890" }}>
            <ShieldCheck size={12} aria-hidden="true" />
            Secure access · Permissions managed by GeriCare
          </small>
        </div>
      </div>
    </main>
  );
}
