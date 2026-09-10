"use client";

import * as React from "react";
import { useAuthStore } from "@/store/auth.store";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  User,
  Bell,
  Globe,
  Palette,
  Shield,
  Smartphone,
  LogOut,
  CheckCircle2,
} from "lucide-react";

export default function SettingsPage() {
  const { user, role } = useAuthStore();
  const { logout } = useAuth();

  const [savedSuccess, setSavedSuccess] = React.useState(false);

  // Settings states
  const [emailAlerts, setEmailAlerts] = React.useState(true);
  const [smsUrgentAlerts, setSmsUrgentAlerts] = React.useState(true);
  const [dailyDigest, setDailyDigest] = React.useState(false);
  const [portalLanguage, setPortalLanguage] = React.useState("en");

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      <PageHeader
        title="Portal Settings"
        subtitle="Manage personal caregiver preferences, alert notifications, and security options."
        action={
          <Button variant="teal" size="sm" onClick={handleSave}>
            Save Preferences
          </Button>
        }
      />

      {savedSuccess && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-900 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Preferences updated successfully.</span>
        </div>
      )}

      <Tabs defaultValue="profile">
        <TabsList className="mb-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="language">Language</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="devices">Connected Devices</TabsTrigger>
        </TabsList>

        {/* PROFILE */}
        <TabsContent value="profile">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Caregiver Account
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Full Name
                </label>
                <Input defaultValue={user?.name || "Caregiver"} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Email Address
                </label>
                <Input
                  defaultValue={user?.email || "caregiver@gericare.ai"}
                  disabled
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Assigned Portal Role
                </label>
                <Input value={role} disabled className="capitalize font-semibold" />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* NOTIFICATIONS */}
        <TabsContent value="notifications">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Notification Preferences
            </h3>
            <div className="space-y-3.5">
              <Switch
                id="emailAlerts"
                label="Email Notifications for High & Urgent Alerts"
                description="Receive instant dispatch emails when severe interaction tension is detected."
                checked={emailAlerts}
                onCheckedChange={setEmailAlerts}
              />
              <Switch
                id="smsUrgentAlerts"
                label="SMS Alerts for Emergency Escalations"
                description="Send urgent text message dispatch to registered phone numbers."
                checked={smsUrgentAlerts}
                onCheckedChange={setSmsUrgentAlerts}
              />
              <Switch
                id="dailyDigest"
                label="Daily Behaviour & Distress Summary Digest"
                description="Receive an aggregated evening report of today's companion interactions."
                checked={dailyDigest}
                onCheckedChange={setDailyDigest}
              />
            </div>
          </div>
        </TabsContent>

        {/* LANGUAGE */}
        <TabsContent value="language">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Language & Regional
            </h3>
            <div className="max-w-xs">
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                Portal Display Language
              </label>
              <Select
                value={portalLanguage}
                onChange={(e) => setPortalLanguage(e.target.value)}
              >
                <option value="en">English (US)</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="zh">中文 (Chinese)</option>
              </Select>
            </div>
          </div>
        </TabsContent>

        {/* SECURITY */}
        <TabsContent value="security">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Security & Access Control
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">
                    Two-Factor Authentication (2FA)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Require authenticator passcode verification for caregiver logins.
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Enable 2FA
                </Button>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">
                    Change Password
                  </h4>
                  <p className="text-xs text-slate-500">
                    Update your caregiver portal password.
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Update
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* CONNECTED DEVICES */}
        <TabsContent value="devices">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Companion Hardware Nodes
            </h3>
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-10 text-center">
              <Smartphone className="h-8 w-8 text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-500">
                No companion devices paired yet.
              </p>
              <p className="mt-1 text-xs text-slate-400 max-w-xs">
                Devices pair to a patient profile during onboarding. Once a patient
                app is connected, it will appear here.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Sign Out Card */}
      <div className="rounded-2xl border border-red-100 bg-red-50/20 p-5 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-red-900">Sign Out</h4>
          <p className="text-xs text-red-700">
            Terminate your active caregiver portal session on this device.
          </p>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={logout}
          className="gap-1.5"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </Button>
      </div>
    </div>
  );
}
