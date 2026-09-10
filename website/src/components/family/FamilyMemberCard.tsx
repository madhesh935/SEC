"use client";

import * as React from "react";
import { FamilyMember } from "@/types";
import { Button } from "@/components/ui/button";
import { Phone, Mic, Edit2, Trash2, Heart } from "lucide-react";
import { PatientAvatar } from "@/components/patient/PatientAvatar";

export interface FamilyMemberCardProps {
  member: FamilyMember;
  onEdit?: (member: FamilyMember) => void;
  onDelete?: (memberId: string) => void;
}

export function FamilyMemberCard({
  member,
  onEdit,
  onDelete,
}: FamilyMemberCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft transition-all hover:border-slate-300">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <PatientAvatar
              name={member.name}
              photoUrl={member.photoUrl}
              size="md"
            />
            <div>
              <h4 className="text-sm font-bold text-slate-900">{member.name}</h4>
              <p className="text-xs font-medium text-teal-700">
                {member.relationship || "Family Member"}
              </p>
            </div>
          </div>

          {member.priority !== undefined && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200">
              Priority #{member.priority}
            </span>
          )}
        </div>

        <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-600">
          {member.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              <span>{member.phone}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Mic className="h-3.5 w-3.5 text-slate-400" />
            <span>
              Voice Recording:{" "}
              {member.voiceRecordingUrl ? (
                <span className="font-medium text-emerald-600">Available</span>
              ) : (
                <span className="text-slate-400">None uploaded</span>
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(member)}
            className="h-8 px-2 text-slate-600 hover:text-slate-900"
          >
            <Edit2 className="mr-1 h-3.5 w-3.5" />
            Edit
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(member.id)}
            className="h-8 px-2 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="mr-1 h-3.5 w-3.5" />
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}
