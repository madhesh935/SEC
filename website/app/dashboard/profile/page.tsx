"use client";

import * as React from "react";
import { useAuthStore } from "@/store/auth.store";
import { PageHeader } from "@/components/layout/PageHeader";
import { PatientAvatar } from "@/components/patient/PatientAvatar";
import { ShieldCheck, Mail, User, Calendar } from "lucide-react";

export default function ProfilePage() {
  const { user, role } = useAuthStore();

  return (
    <div className="space-y-6 pb-16 max-w-3xl mx-auto">
      <PageHeader
        title="User Profile"
        subtitle="Your authenticated credentials and authorized caregiver portal permissions."
      />

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
          <PatientAvatar name={user?.name || "Caregiver"} size="xl" />
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {user?.name || "Authorized Portal User"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{user?.email || "caregiver@gericare.ai"}</p>
            <span className="mt-2 inline-block rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-bold uppercase text-teal-800 border border-teal-200">
              Role: {role}
            </span>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <ShieldCheck className="h-4 w-4 text-teal-600" />
            <span>HIPAA-aligned encrypted session</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <Mail className="h-4 w-4 text-slate-400" />
            <span>Notifications are sent to {user?.email || "your registered email"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
