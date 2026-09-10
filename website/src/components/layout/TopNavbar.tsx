"use client";

import * as React from "react";
import { PatientSelector } from "./PatientSelector";
import { useUiStore } from "@/store/ui.store";
import { useAuthStore } from "@/store/auth.store";
import { useAlertsQuery } from "@/hooks/useAlerts";
import { useAuth } from "@/hooks/useAuth";
import {
  Menu,
  Bell,
  Wifi,
  WifiOff,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Settings,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/utils/cn";
import { UserRole } from "@/types";

export function TopNavbar() {
  const { toggleMobileSidebar, toggleNotificationCenter } = useUiStore();
  const { user, role, setRole } = useAuthStore();
  const { logout } = useAuth();
  const { data: activeAlerts } = useAlertsQuery({ status: "ACTIVE" });

  const [isOnline, setIsOnline] = React.useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  // Track online/offline status
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Click outside to close user menu
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const alertCount = activeAlerts?.length ?? 0;

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 sm:px-6 backdrop-blur-md">
      {/* Left section: mobile hamburger & Patient Selector */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleMobileSidebar}
          className="flex lg:hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
          aria-label="Open sidebar navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <PatientSelector />
      </div>

      {/* Right section: connection status, notifications, user menu */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Connection State indicator */}
        <div
          className={cn(
            "hidden sm:flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
            isOnline
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-red-50 text-red-700 border-red-200"
          )}
          title={isOnline ? "Server connection active" : "Network connection lost"}
        >
          {isOnline ? (
            <>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px]">Live Sync</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5 text-red-600" />
              <span className="text-[11px]">Offline</span>
            </>
          )}
        </div>

        {/* Notifications Icon Button */}
        <button
          type="button"
          onClick={toggleNotificationCenter}
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
          aria-label="View notifications"
        >
          <Bell className="h-4 w-4" />
          {alertCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-xs">
              {alertCount}
            </span>
          )}
        </button>

        {/* Logged-in User Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 pr-2.5 shadow-xs hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
            aria-expanded={isUserMenuOpen}
            aria-haspopup="menu"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 text-teal-800 text-xs font-semibold">
              {user?.name ? user.name[0].toUpperCase() : "C"}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 leading-none">
                {user?.name || "Caregiver Portal"}
              </span>
              <span className="text-[10px] text-slate-400 capitalize mt-0.5">
                {role}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-0.5" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 z-50 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl animate-in fade-in-50 zoom-in-95">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900 truncate">
                  {user?.name || "GeriCare User"}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {user?.email || "caregiver@gericare.ai"}
                </p>
              </div>

              {/* Role switcher preview for testing */}
              <div className="p-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Switch Portal Role
                </span>
                <div className="grid grid-cols-3 gap-1">
                  {(["caregiver", "family", "admin"] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={cn(
                        "rounded-lg px-2 py-1 text-[11px] font-medium capitalize transition-colors",
                        role === r
                          ? "bg-teal-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-1 space-y-0.5">
                <Link
                  href="/dashboard/settings"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Settings className="h-4 w-4 text-slate-400" />
                  <span>Portal Settings</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
