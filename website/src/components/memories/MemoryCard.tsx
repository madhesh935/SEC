"use client";

import * as React from "react";
import { Memory } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  CheckCircle,
  Volume2,
  Edit2,
  Trash2,
  Users,
} from "lucide-react";
import { cn } from "@/utils/cn";

export interface MemoryCardProps {
  memory: Memory;
  onEdit?: (memory: Memory) => void;
  onDelete?: (memoryId: string) => void;
}

export function MemoryCard({ memory, onEdit, onDelete }: MemoryCardProps) {
  const sensitivityBadge = {
    LOW: "bg-slate-100 text-slate-700 border-slate-200",
    MEDIUM: "bg-amber-50 text-amber-800 border-amber-200",
    HIGH: "bg-red-50 text-red-800 border-red-200 font-semibold",
  }[memory.sensitivity || "LOW"];

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white shadow-soft transition-all hover:border-slate-300 hover:shadow-card overflow-hidden">
      <div>
        {/* Optional Image Banner */}
        {memory.imageUrl && (
          <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
            <img
              src={memory.imageUrl}
              alt={memory.title}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>
        )}

        <div className="p-5">
          {/* Header & Badges */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
            <span className="rounded-md bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-800 border border-teal-200">
              {memory.category || "General"}
            </span>

            <span
              className={cn(
                "rounded-md border px-2 py-0.5 text-[11px] font-medium",
                sensitivityBadge
              )}
            >
              {memory.sensitivity} Sensitivity
            </span>

            {memory.approved ? (
              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Approved
              </span>
            ) : (
              <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 border border-amber-200">
                Pending Approval
              </span>
            )}
          </div>

          <h4 className="text-base font-bold text-slate-900 leading-snug">
            {memory.title}
          </h4>

          <p className="mt-2 text-xs text-slate-600 line-clamp-3 leading-relaxed">
            {memory.description}
          </p>

          {/* Associated details */}
          <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
            {memory.associatedPeople && memory.associatedPeople.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                <span>People: {memory.associatedPeople.join(", ")}</span>
              </div>
            )}

            {memory.emotionalTone && (
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                <span>Tone: {memory.emotionalTone}</span>
              </div>
            )}

            {memory.audioUrl && (
              <div className="flex items-center gap-1.5 text-teal-700">
                <Volume2 className="h-3.5 w-3.5" />
                <span>Audio recording attached</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-end gap-2 border-t border-slate-100 p-4 bg-slate-50/50">
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(memory)}
            className="h-8 px-2.5 text-xs text-slate-600 hover:text-slate-900"
          >
            <Edit2 className="mr-1 h-3.5 w-3.5" />
            Edit
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(memory.id)}
            className="h-8 px-2.5 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="mr-1 h-3.5 w-3.5" />
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}
