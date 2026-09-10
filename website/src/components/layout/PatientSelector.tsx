"use client";

import * as React from "react";
import { usePatientsQuery } from "@/hooks/usePatients";
import { usePatientStore } from "@/store/patient.store";
import { PatientAvatar } from "@/components/patient/PatientAvatar";
import { ChevronDown, Plus, Users, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/utils/cn";
import { useRouter } from "next/navigation";

export function PatientSelector() {
  const router = useRouter();
  const { data: patients, isLoading, isError } = usePatientsQuery();
  const { selectedPatientId, setSelectedPatientId } = usePatientStore();
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Automatically select first patient if none selected
  React.useEffect(() => {
    if (patients && patients.length > 0 && !selectedPatientId) {
      setSelectedPatientId(patients[0].id);
    }
  }, [patients, selectedPatientId, setSelectedPatientId]);

  // Click outside to close
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedPatient = patients?.find((p) => p.id === selectedPatientId);

  if (isLoading) {
    return (
      <div className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-500 shadow-xs">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-600" />
        <span>Loading patients...</span>
      </div>
    );
  }

  if (isError || !patients || patients.length === 0) {
    return (
      <Link
        href="/dashboard/patients/new"
        className="flex h-10 items-center gap-2 rounded-xl border border-dashed border-teal-300 bg-teal-50/50 px-3 text-xs font-medium text-teal-700 hover:bg-teal-100/50 transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        <span>Create First Patient</span>
      </Link>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 shadow-xs hover:border-slate-300 hover:bg-slate-50/80 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {selectedPatient ? (
          <>
            <PatientAvatar
              name={selectedPatient.preferredName || selectedPatient.firstName}
              photoUrl={selectedPatient.profilePhotoUrl}
              size="sm"
            />
            <div className="flex flex-col text-left max-w-[130px] sm:max-w-[170px]">
              <span className="text-xs font-semibold text-slate-800 truncate">
                {selectedPatient.preferredName || selectedPatient.firstName}
              </span>
              <span className="text-[10px] text-slate-400 truncate">
                {selectedPatient.stage ? `${selectedPatient.stage} stage` : "Active Profile"}
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <Users className="h-4 w-4 text-slate-400" />
            <span>Select Patient</span>
          </div>
        )}
        <ChevronDown
          className={cn(
            "h-4 w-4 text-slate-400 transition-transform duration-200 ml-1",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 z-50 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl animate-in fade-in-50 zoom-in-95">
          <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Select Patient
          </div>
          <div className="max-h-56 overflow-y-auto space-y-1">
            {patients.map((patient) => {
              const isSelected = patient.id === selectedPatientId;
              const displayName =
                patient.preferredName || patient.firstName || "Unnamed Patient";

              return (
                <button
                  key={patient.id}
                  type="button"
                  onClick={() => {
                    setSelectedPatientId(patient.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl p-2 text-left text-xs transition-colors",
                    isSelected
                      ? "bg-teal-50 text-teal-900 font-semibold"
                      : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <PatientAvatar
                    name={displayName}
                    photoUrl={patient.profilePhotoUrl}
                    size="sm"
                  />
                  <div className="flex flex-col truncate">
                    <span className="truncate">{displayName}</span>
                    {patient.stage && (
                      <span className="text-[10px] text-slate-400">
                        {patient.stage} Stage
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-2 border-t border-slate-100 pt-2">
            <Link
              href="/dashboard/patients/new"
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center gap-2 rounded-xl p-2 text-xs font-medium text-teal-700 hover:bg-teal-50 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Patient Profile</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
