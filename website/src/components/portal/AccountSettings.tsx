"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { usePatientStore } from "@/store/patient.store";
import { portalService } from "@/services/portal.service";
import { authService } from "@/services/auth.service";
import {
  PageContainer,
  PageHeader,
  TabNavigation,
  SectionCard,
  StatusBadge,
  EmptyState,
  LoadingSkeleton,
  ErrorState,
} from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DevicePanel } from "./PatientManagement";
import {
  User,
  Smartphone,
  ShieldCheck,
  Check,
  AlertCircle,
  KeyRound,
  Mail,
} from "lucide-react";

export function AccountSettings({ family = false }: { family?: boolean }) {
  const tabs = family
    ? ["Profile", "Notifications", "Security", "Language", "Access"]
    : ["Profile", "Notifications", "Security", "Language", "Devices"];

  const [tab, setTab] = useState("Profile");
  const user = useAuthStore((s) => s.user);
  const id = usePatientStore((s) => s.selectedPatientId);
  const [name, setName] = useState(user?.name || "");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const cache = useQueryClient();

  const q = useQuery({
    queryKey: ["preferences", user?.id],
    queryFn: portalService.preferences,
  });

  const [language, setLanguage] = useState("en");
  const [notifications, setNotifications] = useState(false);

  useEffect(() => {
    if (q.data) {
      setLanguage(q.data.language || "en");
      setNotifications(q.data.notificationsEnabled);
    }
  }, [q.data]);

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user?.name]);

  const savePreferencesMutation = useMutation({
    mutationFn: () =>
      portalService.savePreferences({
        language,
        notificationsEnabled: notifications,
      }),
    onSuccess: () => {
      setNotice("Account preferences saved successfully.");
      cache.invalidateQueries({ queryKey: ["preferences", user?.id] });
    },
    onError: () => {
      setError("Failed to save preferences. Please try again.");
    },
  });

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await portalService.saveProfile(name);
      if (user) {
        useAuthStore.getState().setUser({ ...user, name });
      }
      setNotice("Your profile was saved successfully.");
    } catch {
      setError("We couldn't save this change. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handlePasswordReset() {
    if (!user?.email) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await authService.forgotPassword({ email: user.email });
      setNotice("Password reset email sent. Please check your inbox.");
    } catch {
      setError("Failed to request password reset. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Account & Portal Settings"
        subtitle="Manage your caregiver credentials, communication preferences, and security controls."
      />

      <TabNavigation
        tabs={tabs}
        activeTab={tab}
        onChange={(t) => {
          setTab(t);
          setNotice("");
          setError("");
        }}
      />

      {/* Global Alerts */}
      {notice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-center gap-2">
          <Check className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{notice}</span>
        </div>
      )}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Tab 1: Profile */}
      {tab === "Profile" && (
        <SectionCard
          title="Caregiver Profile"
          subtitle="Your personal identity and contact details across the GeriCare network."
        >
          <form onSubmit={handleProfileSave} className="max-w-lg space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <Input
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Caregiver Name"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <Input
                type="email"
                disabled
                value={user?.email || ""}
                className="bg-slate-50 text-slate-500 font-mono text-xs cursor-not-allowed"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Email address is tied to your login authentication credentials.
              </p>
            </div>

            <div className="pt-2">
              <span className="block text-xs font-semibold text-slate-700 mb-1">
                Account Role
              </span>
              <StatusBadge
                status={user?.role === "caregiver" ? "Primary Caregiver" : "Care Circle"}
                variant="teal"
              />
            </div>

            <div className="pt-3">
              <Button
                type="submit"
                variant="teal"
                size="sm"
                disabled={busy}
                isLoading={busy}
              >
                Save Profile
              </Button>
            </div>
          </form>
        </SectionCard>
      )}

      {/* Tab 2: Notifications */}
      {tab === "Notifications" && (
        <SectionCard
          title="Notification Preferences"
          subtitle="Configure how and when you receive real-time care alerts."
        >
          {q.isLoading ? (
            <LoadingSkeleton />
          ) : (
            <div className="max-w-lg space-y-5">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4 mt-0.5"
                    checked={notifications}
                    onChange={(e) => setNotifications(e.target.checked)}
                  />
                  <div>
                    <span className="text-sm font-semibold text-slate-900">
                      Enable Caregiver Notifications
                    </span>
                    <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                      Receive real-time alerts for acute disorientation, recurring evening distress, and missed daily routine checkpoints.
                    </p>
                  </div>
                </label>
              </div>

              <Button
                variant="teal"
                size="sm"
                disabled={savePreferencesMutation.isPending}
                isLoading={savePreferencesMutation.isPending}
                onClick={() => savePreferencesMutation.mutate()}
              >
                Save Notification Settings
              </Button>
            </div>
          )}
        </SectionCard>
      )}

      {/* Tab 3: Security */}
      {tab === "Security" && (
        <SectionCard
          title="Account Security & Authentication"
          subtitle="Manage credentials and password security."
        >
          <div className="max-w-lg space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
                <KeyRound className="h-4 w-4 text-teal-600" />
                <h4>Password Reset</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Click below to send a secure password reset link to <strong className="text-slate-900">{user?.email}</strong>.
                If you sign in using Google SSO, your credentials are authenticated directly through your Google account.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={busy || !user?.email}
              isLoading={busy}
              onClick={handlePasswordReset}
              className="gap-2"
            >
              <Mail className="h-4 w-4" />
              <span>Send Password Reset Email</span>
            </Button>
          </div>
        </SectionCard>
      )}

      {/* Tab 4: Language */}
      {tab === "Language" && (
        <SectionCard
          title="Language & Regional Settings"
          subtitle="Set your preferred regional and conversational language."
        >
          {q.isLoading ? (
            <LoadingSkeleton />
          ) : (
            <div className="max-w-lg space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Preferred Language Code
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="en">English (US / UK)</option>
                  <option value="es">Spanish (Español)</option>
                  <option value="hi">Hindi (हिन्दी)</option>
                  <option value="ta">Tamil (தமிழ்)</option>
                  <option value="te">Telugu (తెలుగు)</option>
                  <option value="fr">French (Français)</option>
                  <option value="de">German (Deutsch)</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Saved as your account profile preference. The caregiver portal currently renders in English.
                </p>
              </div>

              <Button
                variant="teal"
                size="sm"
                disabled={savePreferencesMutation.isPending}
                isLoading={savePreferencesMutation.isPending}
                onClick={() => savePreferencesMutation.mutate()}
              >
                Save Language Preference
              </Button>
            </div>
          )}
        </SectionCard>
      )}

      {/* Tab 5: Devices */}
      {tab === "Devices" &&
        (id ? (
          <DevicePanel id={id} />
        ) : (
          <EmptyState
            icon={<Smartphone className="h-6 w-6" />}
            title="No patient selected"
            description="Please choose an active patient from the top bar to inspect and pair companion devices."
          />
        ))}

      {/* Tab 6: Access (Family view) */}
      {tab === "Access" && <FamilyAccess id={id} />}
    </PageContainer>
  );
}

function FamilyAccess({ id }: { id: string | null }) {
  const q = useQuery({
    queryKey: ["family-profile", id],
    queryFn: () => portalService.familyPatient(id!),
    enabled: !!id,
  });

  if (!id) {
    return (
      <EmptyState
        icon={<User className="h-6 w-6" />}
        title="No loved one selected"
        description="Select a family member profile from the top bar to view access permissions."
      />
    );
  }

  return (
    <SectionCard
      title="Family Access Permissions"
      subtitle="Permissions configured by the primary caregiver for this patient profile."
    >
      {q.isLoading ? (
        <LoadingSkeleton />
      ) : q.isError ? (
        <ErrorState message="Could not load family access details." onRetry={() => q.refetch()} />
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            The primary caregiver manages which modules and memories you can view and contribute to.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {q.data?.permissions.map((p) => (
              <div
                key={p}
                className="flex items-center gap-2 p-3 rounded-xl bg-teal-50/50 border border-teal-200/70 text-xs font-semibold text-teal-900"
              >
                <ShieldCheck className="h-4 w-4 text-teal-600 shrink-0" />
                <span>{p.replace(/([A-Z])/g, " $1")}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
}
