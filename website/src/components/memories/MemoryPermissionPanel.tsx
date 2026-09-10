"use client";

import * as React from "react";
import { Switch } from "@/components/ui/switch";
import { ShieldCheck, Lock, Eye, Bot, AlertTriangle } from "lucide-react";

export interface MemoryPermissions {
  aiMayKnowInternally?: boolean;
  aiMayMentionDirectly?: boolean;
  useForSafetyReasoning?: boolean;
  visibleToPatient?: boolean;
  visibleToCaregiver?: boolean;
  visibleToSelectedFamily?: boolean;
}

export interface MemoryPermissionPanelProps {
  permissions: MemoryPermissions;
  onChange: (key: keyof MemoryPermissions, val: boolean) => void;
  isSensitive?: boolean;
}

export function MemoryPermissionPanel({
  permissions,
  onChange,
  isSensitive = false,
}: MemoryPermissionPanelProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5 space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-200/60 pb-3">
        <ShieldCheck className="h-5 w-5 text-teal-700 shrink-0" />
        <div>
          <h4 className="text-sm font-semibold text-slate-900">
            Memory Privacy & AI Grounding Guardrails
          </h4>
          <p className="text-xs text-slate-500">
            Configure how the AI Companion reasons about and communicates this story.
          </p>
        </div>
      </div>

      {isSensitive && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p>
            This memory is flagged as sensitive. Restricting direct mentions prevents triggering grief or anxiety while preserving context for conversational safety.
          </p>
        </div>
      )}

      <div className="space-y-3.5 pt-1">
        <Switch
          id="aiMayKnowInternally"
          label="AI may know internally"
          description="Allows the companion engine to understand this context without explicitly speaking about it."
          checked={permissions.aiMayKnowInternally ?? true}
          onCheckedChange={(val) => onChange("aiMayKnowInternally", val)}
        />

        <Switch
          id="aiMayMentionDirectly"
          label="AI may mention directly"
          description="Allows the companion to bring up this memory during cheerful conversation or redirection."
          checked={permissions.aiMayMentionDirectly ?? false}
          onCheckedChange={(val) => onChange("aiMayMentionDirectly", val)}
        />

        <Switch
          id="useForSafetyReasoning"
          label="Use for safety reasoning"
          description="Informs safety checks if the patient asks questions relating to deceased persons or old locations."
          checked={permissions.useForSafetyReasoning ?? true}
          onCheckedChange={(val) => onChange("useForSafetyReasoning", val)}
        />

        <Switch
          id="visibleToPatient"
          label="Visible to patient on tablet companion"
          description="Displays photos and title on the patient's companion screen."
          checked={permissions.visibleToPatient ?? false}
          onCheckedChange={(val) => onChange("visibleToPatient", val)}
        />

        <Switch
          id="visibleToCaregiver"
          label="Visible to caregiver portal"
          description="Caregivers have full review and audit access."
          checked={permissions.visibleToCaregiver ?? true}
          onCheckedChange={(val) => onChange("visibleToCaregiver", val)}
        />

        <Switch
          id="visibleToSelectedFamily"
          label="Visible to authorized family circle"
          description="Share this memory with invited relatives."
          checked={permissions.visibleToSelectedFamily ?? false}
          onCheckedChange={(val) => onChange("visibleToSelectedFamily", val)}
        />
      </div>
    </div>
  );
}
