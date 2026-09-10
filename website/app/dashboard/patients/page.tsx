"use client";

import * as React from "react";
import { usePatientsQuery } from "@/hooks/usePatients";
import { PageHeader } from "@/components/layout/PageHeader";
import { PatientCard } from "@/components/patient/PatientCard";
import { LoadingState } from "@/components/states/LoadingState";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Users, Search } from "lucide-react";
import Link from "next/link";

export default function PatientsPage() {
  const { data: patients, isLoading, isError, refetch } = usePatientsQuery();
  const [searchQuery, setSearchQuery] = React.useState("");

  // Client-side search when list is loaded
  const filteredPatients = React.useMemo(() => {
    if (!patients) return [];
    if (!searchQuery.trim()) return patients;
    const query = searchQuery.toLowerCase();
    return patients.filter((p) => {
      const name = `${p.preferredName || ""} ${p.firstName || ""}`.toLowerCase();
      const hometown = (p.hometown || "").toLowerCase();
      const language = (p.preferredLanguage || "").toLowerCase();
      return (
        name.includes(query) ||
        hometown.includes(query) ||
        language.includes(query)
      );
    });
  }, [patients, searchQuery]);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Patient Profiles"
        subtitle="Manage dementia care plans, biographical context, personal memories, and family connections."
        action={
          <Link href="/caregiver/patients/new">
            <Button variant="teal" size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              <span>Create Patient</span>
            </Button>
          </Link>
        }
      />

      {/* Search & Filter Bar */}
      {patients && patients.length > 0 && (
        <div className="flex items-center gap-3 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patients by name, language, or hometown..."
              className="pl-9"
            />
          </div>
        </div>
      )}

      {/* Main Content States */}
      {isLoading ? (
        <LoadingState message="Loading registered patient profiles..." />
      ) : isError ? (
        <ErrorState
          title="Unable to load patient directory"
          message="We couldn't connect to the patient service. Please verify your connection."
          onRetry={() => refetch()}
        />
      ) : !patients || patients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No patient profiles have been created yet."
          description="Build a rich, personalized profile with biographical details, comfort routines, and personal memories to power the AI companion."
          actionLabel="Create First Patient"
          onAction={() => window.location.assign("/caregiver/patients/new")}
        />
      ) : filteredPatients.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm font-medium text-slate-700">
            No patients found matching "{searchQuery}"
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearchQuery("")}
            className="mt-3"
          >
            Clear Search Filter
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((patient) => (
            <PatientCard key={patient.id} patient={patient} />
          ))}
        </div>
      )}
    </div>
  );
}
