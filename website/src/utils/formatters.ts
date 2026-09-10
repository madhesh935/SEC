import { AlertSeverity, DementiaStage } from "@/types";

export function formatDateTime(dateString?: string): string {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatDateOnly(dateString?: string): string {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatRelativeTime(dateString?: string): string {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return formatDateOnly(dateString);
  } catch {
    return dateString;
  }
}

export function getStageBadgeInfo(stage?: DementiaStage): {
  label: string;
  className: string;
} {
  switch (stage) {
    case "EARLY":
      return {
        label: "Early Stage",
        className: "bg-teal-50 text-teal-700 border-teal-200",
      };
    case "MID":
      return {
        label: "Mid Stage",
        className: "bg-amber-50 text-amber-700 border-amber-200",
      };
    case "LATE":
      return {
        label: "Late Stage",
        className: "bg-purple-50 text-purple-700 border-purple-200",
      };
    default:
      return {
        label: "Not Specified",
        className: "bg-slate-100 text-slate-600 border-slate-200",
      };
  }
}

export function getSeverityBadgeInfo(severity: AlertSeverity): {
  label: string;
  className: string;
  indicatorColor: string;
} {
  switch (severity) {
    case "URGENT":
      return {
        label: "Urgent",
        className: "bg-red-50 text-red-700 border-red-200 font-semibold",
        indicatorColor: "bg-red-600",
      };
    case "HIGH":
      return {
        label: "High",
        className: "bg-orange-50 text-orange-700 border-orange-200",
        indicatorColor: "bg-orange-500",
      };
    case "MODERATE":
      return {
        label: "Moderate",
        className: "bg-amber-50 text-amber-700 border-amber-200",
        indicatorColor: "bg-amber-500",
      };
    case "LOW":
      return {
        label: "Low",
        className: "bg-slate-100 text-slate-700 border-slate-200",
        indicatorColor: "bg-slate-400",
      };
  }
}
