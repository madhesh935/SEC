"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SIDEBAR_NAV_ITEMS } from "@/constants/navigation";
import { useUiStore } from "@/store/ui.store";
import { usePatientStore } from "@/store/patient.store";
import { useAuthStore } from "@/store/auth.store";
import {
  Heart,
  ChevronLeft,
  ChevronRight,
  X,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/utils/cn";

export function Sidebar() {
  const pathname = usePathname();
  const {
    isSidebarCollapsed,
    toggleSidebar,
    isMobileSidebarOpen,
    setMobileSidebarOpen,
  } = useUiStore();
  const { selectedPatientId } = usePatientStore();
  const { role, user } = useAuthStore();

  // Close mobile sidebar on route change
  React.useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname, setMobileSidebarOpen]);

  // Resolve dynamic [patientId] in routes
  const resolveHref = (href: string) => {
    if (href.includes("[patientId]")) {
      if (selectedPatientId) {
        return href.replace("[patientId]", selectedPatientId);
      }
      return "/dashboard/patients";
    }
    return href;
  };

  // Filter items based on user role
  const visibleNavItems = SIDEBAR_NAV_ITEMS.filter((item) => {
    if (!item.allowedRoles) return true;
    return item.allowedRoles.includes(role);
  });

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-white border-r border-slate-200/80">
      {/* Brand Header */}
      <div>
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-100">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 overflow-hidden transition-opacity hover:opacity-90"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white shadow-xs shrink-0">
              <Heart className="h-5 w-5 fill-white/20" />
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight text-slate-900 leading-none">
                  GeriCare <span className="text-teal-600">AI</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                  Caregiver & Family Portal
                </span>
              </div>
            )}
          </Link>

          {/* Desktop collapse toggle */}
          <button
            type="button"
            onClick={toggleSidebar}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            className="flex lg:hidden h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {visibleNavItems.map((item) => {
            const targetHref = resolveHref(item.href);
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === targetHref
              : pathname.startsWith(targetHref);

            return (
              <Link
                key={item.title}
                href={targetHref}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-teal-50 text-teal-800 font-semibold shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900",
                  isSidebarCollapsed && "justify-center px-2"
                )}
                title={isSidebarCollapsed ? item.title : undefined}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-colors",
                    isActive
                      ? "text-teal-700 stroke-[2.2]"
                      : "text-slate-400 group-hover:text-slate-600"
                  )}
                />
                {!isSidebarCollapsed && (
                  <span className="truncate">{item.title}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Role Indicator Footer */}
      <div className="p-3 border-t border-slate-100">
        {!isSidebarCollapsed ? (
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/60">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Active Portal Role
              </span>
              <span className="rounded-md bg-teal-100/80 px-1.5 py-0.5 text-[10px] font-bold uppercase text-teal-800">
                {role}
              </span>
            </div>
            {user?.name && (
              <p className="mt-1 text-xs font-medium text-slate-800 truncate">
                {user.name}
              </p>
            )}
            <p className="text-[10px] text-slate-400 mt-0.5 truncate">
              {user?.email || "Caregiver Session"}
            </p>
          </div>
        ) : (
          <div
            className="flex justify-center p-1 text-teal-700"
            title={`Role: ${role}`}
          >
            <ShieldAlert className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop & Tablet Sidebar */}
      <aside
        className={cn(
          "hidden lg:block h-screen sticky top-0 shrink-0 transition-all duration-300 z-30",
          isSidebarCollapsed ? "w-18" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-50 flex lg:hidden bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-50 h-full w-72 max-w-[85vw] shadow-2xl animate-in slide-in-from-left duration-300">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
