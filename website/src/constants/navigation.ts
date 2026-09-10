import {
  LayoutDashboard,
  Users,
  Radio,
  BookOpen,
  HeartHandshake,
  Repeat,
  HeartPulse,
  Clock,
  Bell,
  ShieldCheck,
  Settings,
  LucideIcon,
} from "lucide-react";
import { UserRole } from "@/types";

export interface NavigationItem {
  title: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
  requiredPermission?: string;
  allowedRoles?: UserRole[];
  badge?: string;
}

export const SIDEBAR_NAV_ITEMS: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    title: "Patients",
    href: "/dashboard/patients",
    icon: Users,
    allowedRoles: ["caregiver", "admin"],
  },
  {
    title: "Live Companion",
    href: "/dashboard/patients/[patientId]/live",
    icon: Radio,
    allowedRoles: ["caregiver", "admin"],
  },
  {
    title: "Memories",
    href: "/dashboard/patients/[patientId]/memories",
    icon: BookOpen,
  },
  {
    title: "Family",
    href: "/dashboard/patients/[patientId]/family",
    icon: HeartHandshake,
  },
  {
    title: "Repetition Analytics",
    href: "/dashboard/patients/[patientId]/repetition",
    icon: Repeat,
    allowedRoles: ["caregiver", "admin"],
  },
  {
    title: "Emotion & Distress",
    href: "/dashboard/patients/[patientId]/distress",
    icon: HeartPulse,
    allowedRoles: ["caregiver", "admin"],
  },
  {
    title: "Behaviour Patterns",
    href: "/dashboard/patients/[patientId]/patterns",
    icon: Clock,
    allowedRoles: ["caregiver", "admin"],
  },
  {
    title: "Alerts",
    href: "/dashboard/alerts",
    icon: Bell,
    allowedRoles: ["caregiver", "admin"],
  },
  {
    title: "Consent & Privacy",
    href: "/dashboard/patients/[patientId]/consent",
    icon: ShieldCheck,
    allowedRoles: ["caregiver", "admin"],
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];
