"use client";

import * as React from "react";
import { Patient } from "@/types";
import { PatientAvatar } from "./PatientAvatar";
import { Button } from "@/components/ui/button";
import { getStageBadgeInfo, formatRelativeTime } from "@/utils/formatters";
import { usePatientStore } from "@/store/patient.store";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clock, Globe, ArrowUpRight, HeartHandshake } from "lucide-react";

export interface PatientCardProps {
  patient: Patient;
}

export function PatientCard({ patient }: PatientCardProps) {
  const router = useRouter();
  const { setSelectedPatientId } = usePatientStore();
  const stageInfo = getStageBadgeInfo(patient.stage);

  const displayName =
    patient.preferredName || patient.firstName || "Unnamed Patient";

  const handleOpenDashboard = () => {
    setSelectedPatientId(patient.id);
    router.push("/dashboard");
  };

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft transition-all hover:border-slate-300 hover:shadow-card">
      <div>
        {/* Top Header with Avatar & Stage */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <PatientAvatar
              name={displayName}
              photoUrl={patient.profilePhotoUrl}
              size="lg"
            />
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                {displayName}
              </h3>
              {patient.preferredName && patient.firstName && (
                <p className="text-xs text-slate-400">
                  Legal: {patient.firstName}
                </p>
              )}
              {patient.age !== undefined && (
                <p className="text-xs font-medium text-slate-500">
                  {patient.age} years old
                </p>
              )}
            </div>
          </div>

          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold shrink-0 ${stageInfo.className}`}
          >
            {stageInfo.label}
          </span>
        </div>

        {/* Patient Details metadata */}
        <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-600">
          {patient.preferredLanguage && (
            <div className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-slate-400" />
              <span>Language: <span className="font-semibold text-slate-800">{patient.preferredLanguage}</span></span>
            </div>
          )}

          {patient.lastInteraction && (
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>Last interaction: {formatRelativeTime(patient.lastInteraction)}</span>
            </div>
          )}

          {patient.hometown && (
            <div className="text-slate-500 text-[11px] truncate">
              Hometown: {patient.hometown}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-3">
        <Link
          href={`/dashboard/patients/${patient.id}`}
          className="flex-1"
        >
          <Button variant="outline" size="sm" className="w-full text-xs">
            View Profile
          </Button>
        </Link>
        <Button
          variant="teal"
          size="sm"
          onClick={handleOpenDashboard}
          className="flex-1 text-xs gap-1"
        >
          <span>Open Dashboard</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
