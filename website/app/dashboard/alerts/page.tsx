"use client";

import * as React from "react";
import { useAlertsQuery, useAcknowledgeAlertMutation } from "@/hooks/useAlerts";
import { usePatientsQuery } from "@/hooks/usePatients";
import { AlertSeverity, AlertStatus, Alert } from "@/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { AlertCard } from "@/components/alerts/AlertCard";
import { LoadingState } from "@/components/states/LoadingState";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select } from "@/components/ui/select";
import { Filter, BellRing, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AlertsListPage() {
  const [activeTab, setActiveTab] = React.useState<"ALL" | "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED">("ALL");
  const [severityFilter, setSeverityFilter] = React.useState<string>("ALL");
  const [patientFilter, setPatientFilter] = React.useState<string>("ALL");

  const queryFilters = React.useMemo(() => {
    return {
      status: activeTab !== "ALL" ? (activeTab as AlertStatus) : undefined,
      severity: severityFilter !== "ALL" ? (severityFilter as AlertSeverity) : undefined,
      patientId: patientFilter !== "ALL" ? patientFilter : undefined,
    };
  }, [activeTab, severityFilter, patientFilter]);

  const {
    data: alerts,
    isLoading,
    isError,
    refetch,
  } = useAlertsQuery(queryFilters);

  const { data: patients } = usePatientsQuery();
  const acknowledgeMutation = useAcknowledgeAlertMutation();

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title="Safety & Behaviour Alerts"
        subtitle="Real-time notifications for elevated interaction tension, repeated questions, or safety escalation triggers."
        action={
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Refresh Alerts
          </Button>
        }
      />

      {/* Tabs & Filters Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as typeof activeTab)}
        >
          <TabsList>
            <TabsTrigger value="ALL">All Alerts</TabsTrigger>
            <TabsTrigger value="ACTIVE">Active</TabsTrigger>
            <TabsTrigger value="ACKNOWLEDGED">Acknowledged</TabsTrigger>
            <TabsTrigger value="RESOLVED">Resolved</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Severity & Patient Filters */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <Select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="h-9 text-xs w-36"
          >
            <option value="ALL">All Severities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MODERATE">Moderate</option>
            <option value="LOW">Low</option>
          </Select>

          {patients && patients.length > 0 && (
            <Select
              value={patientFilter}
              onChange={(e) => setPatientFilter(e.target.value)}
              className="h-9 text-xs w-40"
            >
              <option value="ALL">All Patients</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.preferredName || p.firstName}
                </option>
              ))}
            </Select>
          )}
        </div>
      </div>

      {/* Main Content States */}
      {isLoading ? (
        <LoadingState message="Loading care alerts..." />
      ) : isError ? (
        <ErrorState
          title="Unable to load alerts"
          message="Could not connect to the alert processing endpoint."
          onRetry={() => refetch()}
        />
      ) : !alerts || alerts.length === 0 ? (
        <EmptyState
          icon={BellRing}
          title={
            activeTab === "ACTIVE"
              ? "No active alerts"
              : "No alert records match this filter"
          }
          description="All patient behavioural tension indicators and emergency thresholds are operating within normal parameters."
        />
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onAcknowledge={(id) => acknowledgeMutation.mutate({ alertId: id })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
