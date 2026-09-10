"use client";

import * as React from "react";
import {
  Clock,
  CheckCircle2,
  Coffee,
  Utensils,
  Pill,
  Flower2,
  Music,
  BookOpen,
  Moon,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/utils/cn";

export interface DailyRoutineTimelineProps {
  routines?: string[];
  patientName?: string;
  className?: string;
}

interface ParsedRoutine {
  id: string;
  timeStr: string;
  timeMinutes: number;
  activity: string;
  category: string;
  icon: React.ReactNode;
  iconBg: string;
}

const DEFAULT_ROUTINES = [
  "08:00 AM - Morning Earl Grey tea and warm honey toast in the sunroom",
  "09:15 AM - Morning vitamins and prescription medication with water",
  "09:45 AM - Gentle garden walk: checking the roses and bird feeder",
  "11:00 AM - Listening to classical radio or playing gentle piano scales",
  "01:00 PM - Nutritious lunch: warm vegetable soup and crusty bread",
  "02:30 PM - Quiet reading time or looking through family photo albums",
  "04:00 PM - Afternoon chamomile tea and scone with daughter Sarah",
  "06:30 PM - Evening family dinner and relaxing conversation",
  "08:00 PM - Dimming ambient lights, listening to calming harp and piano music",
  "09:30 PM - Bedtime wind-down and peaceful night routine",
];

function parseTimeToMinutes(timeStr: string): number {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === "PM" && hours < 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function categorizeRoutine(text: string): {
  category: string;
  icon: React.ReactNode;
  iconBg: string;
} {
  const lower = text.toLowerCase();
  if (lower.includes("vitamin") || lower.includes("medication") || lower.includes("prescription")) {
    return {
      category: "Health & Medication",
      icon: <Pill className="h-4 w-4" />,
      iconBg: "bg-rose-50 text-rose-600 border-rose-100",
    };
  }
  if (lower.includes("tea") || lower.includes("breakfast") || lower.includes("toast")) {
    return {
      category: "Morning Nutrition",
      icon: <Coffee className="h-4 w-4" />,
      iconBg: "bg-amber-50 text-amber-600 border-amber-100",
    };
  }
  if (lower.includes("lunch") || lower.includes("dinner") || lower.includes("soup") || lower.includes("scone")) {
    return {
      category: "Meals & Nutrition",
      icon: <Utensils className="h-4 w-4" />,
      iconBg: "bg-amber-50 text-amber-600 border-amber-100",
    };
  }
  if (lower.includes("garden") || lower.includes("walk") || lower.includes("roses") || lower.includes("bird")) {
    return {
      category: "Nature & Fresh Air",
      icon: <Flower2 className="h-4 w-4" />,
      iconBg: "bg-emerald-50 text-emerald-600 border-emerald-100",
    };
  }
  if (lower.includes("piano") || lower.includes("classical") || lower.includes("music") || lower.includes("radio") || lower.includes("harp")) {
    return {
      category: "Music & Reminiscence",
      icon: <Music className="h-4 w-4" />,
      iconBg: "bg-indigo-50 text-indigo-600 border-indigo-100",
    };
  }
  if (lower.includes("read") || lower.includes("album") || lower.includes("photo") || lower.includes("puzzle")) {
    return {
      category: "Cognitive & Memories",
      icon: <BookOpen className="h-4 w-4" />,
      iconBg: "bg-purple-50 text-purple-600 border-purple-100",
    };
  }
  if (lower.includes("bedtime") || lower.includes("wind-down") || lower.includes("ambient") || lower.includes("night")) {
    return {
      category: "Rest & Wind-down",
      icon: <Moon className="h-4 w-4" />,
      iconBg: "bg-sky-50 text-sky-600 border-sky-100",
    };
  }
  return {
    category: "Daily Rhythm",
    icon: <Sparkles className="h-4 w-4" />,
    iconBg: "bg-teal-50 text-teal-600 border-teal-100",
  };
}

export function DailyRoutineTimeline({
  routines,
  patientName = "Patient",
  className,
}: DailyRoutineTimelineProps) {
  const rawRoutines = routines && routines.length > 0 ? routines : DEFAULT_ROUTINES;
  const [filterMode, setFilterMode] = React.useState<"all" | "next">("all");
  const [completedMap, setCompletedMap] = React.useState<Record<string, boolean>>({});

  // Parse items
  const items: ParsedRoutine[] = React.useMemo(() => {
    return rawRoutines.map((r, index) => {
      const parts = r.split(/\s*[-–—:]\s*(.+)/);
      const timeStr = parts[0]?.trim() || "";
      const activity = parts[1]?.trim() || r;
      const { category, icon, iconBg } = categorizeRoutine(activity);
      return {
        id: `routine-${index}`,
        timeStr,
        timeMinutes: parseTimeToMinutes(timeStr),
        activity,
        category,
        icon,
        iconBg,
      };
    });
  }, [rawRoutines]);

  // Current time in minutes from midnight
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Determine which routine is "current" / next up
  const currentOrNextIndex = React.useMemo(() => {
    const idx = items.findIndex((item) => item.timeMinutes >= currentMinutes - 30);
    return idx === -1 ? items.length - 1 : idx;
  }, [items, currentMinutes]);

  // Auto-mark routines prior to current time as completed unless explicitly toggled
  const isItemCompleted = (item: ParsedRoutine, index: number) => {
    if (completedMap[item.id] !== undefined) {
      return completedMap[item.id];
    }
    return index < currentOrNextIndex;
  };

  const toggleComplete = (id: string, currentStatus: boolean) => {
    setCompletedMap((prev) => ({
      ...prev,
      [id]: !currentStatus,
    }));
  };

  const completedCount = items.filter((item, idx) => isItemCompleted(item, idx)).length;
  const progressPercent = Math.round((completedCount / items.length) * 100);

  const displayedItems =
    filterMode === "next"
      ? items.slice(Math.max(0, currentOrNextIndex - 1), Math.min(items.length, currentOrNextIndex + 3))
      : items;

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs transition-all hover:shadow-sm space-y-4",
        className
      )}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700 shrink-0">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-900 tracking-tight">
                Today&apos;s Schedule &amp; Daily Rhythm
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200/60">
                {completedCount}/{items.length} Completed
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Familiar schedule for {patientName} • Anchors orientation, nutrition, and peaceful rest
            </p>
          </div>
        </div>

        {/* View Toggle Filter */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="flex items-center p-0.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all",
                filterMode === "all"
                  ? "bg-white text-teal-800 shadow-2xs font-bold"
                  : "hover:text-slate-900"
              )}
            >
              All Day ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("next")}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all",
                filterMode === "next"
                  ? "bg-white text-teal-800 shadow-2xs font-bold"
                  : "hover:text-slate-900"
              )}
            >
              Current &amp; Up Next
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span>Daily Routine Progress</span>
          <span>{progressPercent}% on track today</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-600 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Routine Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 pt-1">
        {displayedItems.map((item, originalIndex) => {
          const globalIndex = items.findIndex((i) => i.id === item.id);
          const completed = isItemCompleted(item, globalIndex);
          const isCurrent = globalIndex === currentOrNextIndex && !completed;

          return (
            <div
              key={item.id}
              onClick={() => toggleComplete(item.id, completed)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  toggleComplete(item.id, completed);
                }
              }}
              className={cn(
                "p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between select-none relative group",
                completed
                  ? "bg-slate-50/70 border-slate-200/70 opacity-80 hover:opacity-100 hover:border-slate-300"
                  : isCurrent
                  ? "bg-teal-50/30 border-teal-300 shadow-xs ring-1 ring-teal-400/40 hover:bg-teal-50/50"
                  : "bg-white border-slate-200/80 hover:border-teal-200 hover:shadow-2xs"
              )}
            >
              <div>
                {/* Top Row: Time + Status Badge */}
                <div className="flex items-center justify-between gap-1.5 mb-2">
                  <span className="text-xs font-bold text-slate-900 tracking-tight">
                    {item.timeStr || "Daily"}
                  </span>
                  {completed ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200/70">
                      <CheckCircle2 className="h-3 w-3" /> Done
                    </span>
                  ) : isCurrent ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded-full border border-teal-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-teal-600 animate-pulse" />
                      Now / Next
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                      <Clock className="h-2.5 w-2.5" /> Upcoming
                    </span>
                  )}
                </div>

                {/* Category Pill with Icon */}
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div
                    className={cn(
                      "h-5 w-5 rounded-md flex items-center justify-center border text-[11px] shrink-0",
                      item.iconBg
                    )}
                  >
                    {item.icon}
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                    {item.category}
                  </span>
                </div>

                {/* Description */}
                <p
                  className={cn(
                    "text-xs leading-relaxed line-clamp-3",
                    completed ? "text-slate-500 line-through decoration-slate-300" : "text-slate-800 font-medium"
                  )}
                >
                  {item.activity}
                </p>
              </div>

              {/* Action Hint */}
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 group-hover:text-teal-700 transition-colors">
                <span>{completed ? "Click to unmark" : "Click to mark done"}</span>
                <CheckCircle2
                  className={cn(
                    "h-3.5 w-3.5 transition-colors",
                    completed ? "text-emerald-600" : "text-slate-300 group-hover:text-teal-600"
                  )}
                />
              </div>
            </div>
          );
        })}
      </div>

      {filterMode === "next" && items.length > displayedItems.length && (
        <div className="text-center pt-1">
          <button
            type="button"
            onClick={() => setFilterMode("all")}
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1 transition-colors"
          >
            <span>Show all {items.length} daily routines</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
