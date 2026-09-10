"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Home,
  Users,
  Bot,
  BookHeart,
  ChartNoAxesCombined,
  Bell,
  Settings,
  Menu,
  X,
  ChevronDown,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Heart,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { usePatientStore } from "@/store/patient.store";
import { authService } from "@/services/auth.service";
import { patientService } from "@/services/patient.service";
import { portalService } from "@/services/portal.service";
import { realtimeService } from "@/services/realtime.service";
import { useAlertsQuery } from "@/hooks/useAlerts";
import { ProfileAvatar, StatusBadge } from "@/components/design-system";
import { cn } from "@/utils/cn";

// Strict Step 3 Navigation: Exactly 7 Items
const caregiverNav = [
  { label: "Dashboard", href: "/caregiver", icon: Home, exact: true },
  { label: "Patients", href: "/caregiver/patients", icon: Users, exact: false },
  { label: "Companion", href: "/caregiver/companion", icon: Bot, exact: false },
  { label: "Care Content", href: "/caregiver/care-content", icon: BookHeart, exact: false },
  { label: "Insights", href: "/caregiver/insights", icon: ChartNoAxesCombined, exact: false },
  { label: "Alerts", href: "/caregiver/alerts", icon: Bell, exact: false },
  { label: "Settings", href: "/caregiver/settings", icon: Settings, exact: false },
] as const;

const familyNav = [
  { label: "Home", href: "/family", icon: Home, exact: true },
  { label: "Loved One", href: "/family/loved-one", icon: Heart, exact: false },
  { label: "Memories & Voices", href: "/family/memories", icon: BookHeart, exact: false },
  { label: "Connection", href: "/family/connection", icon: Users, exact: false },
  { label: "Notifications", href: "/family/notifications", icon: Bell, exact: false },
  { label: "Settings", href: "/family/settings", icon: Settings, exact: false },
] as const;

export function PortalShell({
  role,
  children,
}: {
  role: "caregiver" | "family";
  children: React.ReactNode;
}) {
  const auth = useAuthStore();
  const path = usePathname();
  const router = useRouter();
  const cache = useQueryClient();
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [offline, setOffline] = React.useState(false);
  const [liveSyncConnected, setLiveSyncConnected] = React.useState<boolean | null>(null);
  const [patientDropdownOpen, setPatientDropdownOpen] = React.useState(false);

  const { selectedPatientId, setSelectedPatientId } = usePatientStore();
  const authorized =
    !!auth.user &&
    (auth.role === role || (role === "caregiver" && auth.role === "admin"));

  // Fetch full accessible patients list
  const patientsQuery = useQuery({
    queryKey: [role, "accessible-patients"],
    queryFn: async () => {
      if (role === "caregiver") {
        return await patientService.getPatients();
      } else {
        const fps = await portalService.familyPatients();
        return fps.map((fp) => ({
          id: fp.id,
          preferredName: fp.preferredName,
          firstName: fp.preferredName,
          stage: "EARLY" as const,
          profilePhotoUrl: fp.profilePhotoUrl || undefined,
        }));
      }
    },
    enabled: authorized,
  });

  const accessiblePatients = React.useMemo(
    () => patientsQuery.data || [],
    [patientsQuery.data]
  );
  const selectedPatient = accessiblePatients.find((p) => p.id === selectedPatientId);

  // Active alerts count for notification bell badge
  const alertsQuery = useAlertsQuery({
    status: "ACTIVE",
    patientId: selectedPatientId || undefined,
  });
  const activeAlertCount = alertsQuery.data?.length || 0;

  // Realtime Live Sync listener
  React.useEffect(() => {
    if (!selectedPatientId || offline) {
      setLiveSyncConnected(false);
      return;
    }
    const unsub = realtimeService.subscribeToLiveStatus(
      selectedPatientId,
      () => {},
      (connected) => setLiveSyncConnected(connected)
    );
    return () => unsub();
  }, [selectedPatientId, offline]);

  // Auth redirect guard
  React.useEffect(() => {
    if (!auth.isLoading && !auth.user && !auth.error) {
      router.replace("/" + role + "/login");
    }
  }, [auth.isLoading, auth.user, auth.error, role, router]);

  // Network offline listener
  React.useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  // Auto-select first accessible patient if none selected or invalid (prioritize Eleanor Vance)
  React.useEffect(() => {
    if (accessiblePatients.length > 0 && (!selectedPatientId || !accessiblePatients.some((p) => p.id === selectedPatientId))) {
      const eleanor = accessiblePatients.find(
        (p) => p.firstName?.toLowerCase() === "eleanor" || p.preferredName?.toLowerCase() === "ellie"
      );
      setSelectedPatientId(eleanor ? eleanor.id : accessiblePatients[0].id);
    }
  }, [accessiblePatients, selectedPatientId, setSelectedPatientId]);

  // Patient switch handler: updates selectedPatientId, cancels previous queries, evicts cache
  async function switchPatient(newId: string) {
    const prevId = selectedPatientId;
    setSelectedPatientId(newId);
    setPatientDropdownOpen(false);

    if (prevId) {
      await cache.cancelQueries({
        predicate: (q) => q.queryKey.includes(prevId),
      });
      cache.removeQueries({
        predicate: (q) => q.queryKey.includes(prevId),
      });
    }

    // Refetch patient-specific queries
    await cache.invalidateQueries({
      predicate: (q) => q.queryKey.includes(newId),
    });

    // If currently viewing a patient detail route, redirect to the new patient's detail route
    if (path.includes("/patients/") && !path.endsWith("/new")) {
      router.push("/caregiver/patients/" + newId);
    }
  }

  async function logout() {
    await authService.logout();
    cache.clear();
    useAuthStore.getState().clearSession();
    router.replace("/" + role + "/login");
  }

  if (auth.isLoading) {
    return (
      <main className="min-h-screen bg-[#FAFAF7] flex flex-col items-center justify-center p-6 text-center" role="status">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-xs">
            <Heart className="h-5 w-5 fill-white/20" />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">GeriCare AI</span>
        </div>
        <p className="text-sm text-slate-500">Checking your secure session…</p>
      </main>
    );
  }

  if (auth.error) {
    return (
      <main className="min-h-screen bg-[#FAFAF7] flex flex-col items-center justify-center p-6 text-center">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-xs">
            <Heart className="h-5 w-5 fill-white/20" />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">GeriCare AI</span>
        </div>
        <p role="alert" className="text-sm text-rose-700 bg-rose-50 border border-rose-200 px-4 py-2 rounded-xl mb-4 max-w-md">
          {auth.error}
        </p>
        <div className="flex gap-3">
          <Link className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl" href={"/" + role + "/login"}>
            Return to sign in
          </Link>
          <button
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  if (!auth.user) return null;

  if (!authorized) {
    return (
      <main className="min-h-screen bg-[#FAFAF7] flex flex-col items-center justify-center p-6 text-center">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-xs">
            <Heart className="h-5 w-5 fill-white/20" />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">GeriCare AI</span>
        </div>
        <h1 className="text-lg font-bold text-slate-900 mb-1">Access restricted</h1>
        <p className="text-sm text-slate-500 mb-4">This account belongs to a different portal.</p>
        <Link
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl"
          href={auth.role === "family" ? "/family" : "/caregiver"}
        >
          Open your portal
        </Link>
      </main>
    );
  }

  const navItems = role === "caregiver" ? caregiverNav : familyNav;

  return (
    <div className="min-h-screen bg-[#FAFAF7] text-slate-900 font-sans flex flex-col lg:flex-row antialiased">
      {/* Accessibility Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 z-50 px-4 py-2 bg-teal-700 text-white font-semibold rounded-xl shadow-lg"
      >
        Skip to content
      </a>

      {/* Mobile Drawer Backdrop */}
      {mobileDrawerOpen && (
        <div
          aria-label="Close navigation"
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* STEP 3: Fixed/Collapsible Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-all duration-200 ease-in-out shadow-xs",
          sidebarCollapsed ? "lg:w-20" : "lg:w-64",
          mobileDrawerOpen ? "w-72 translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Top Branding Section */}
        <div>
          <div
            className={cn(
              "flex h-16 items-center border-b border-slate-100 transition-all",
              sidebarCollapsed
                ? "justify-center px-2 relative"
                : "justify-between px-5"
            )}
          >
            <Link
              href={"/" + role}
              className={cn(
                "flex items-center gap-2.5 group shrink-0",
                sidebarCollapsed ? "justify-center" : "overflow-hidden"
              )}
              onClick={() => setMobileDrawerOpen(false)}
              title={sidebarCollapsed ? "GeriCare AI" : undefined}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white shadow-2xs group-hover:bg-teal-700 transition-colors shrink-0">
                <Heart className="h-5 w-5 fill-white/20" />
              </div>
              {!sidebarCollapsed && (
                <div className="flex flex-col">
                  <span className="text-base font-bold tracking-tight text-slate-900 leading-none">
                    GeriCare <span className="text-teal-600">AI</span>
                  </span>
                  <span className="text-[10.5px] text-slate-400 font-medium mt-0.5">
                    {role === "caregiver" ? "Caregiver Portal" : "Family Portal"}
                  </span>
                </div>
              )}
            </Link>

            {/* Desktop Collapse Button */}
            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={cn(
                "hidden lg:flex items-center justify-center transition-all cursor-pointer",
                sidebarCollapsed
                  ? "absolute -right-3.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-white border border-slate-200/90 text-slate-500 hover:text-teal-700 hover:border-teal-300 shadow-sm z-50"
                  : "h-7 w-7 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              )}
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-3.5 w-3.5" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(false)}
              className="flex lg:hidden h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1" aria-label="Main navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? path === item.href
                : path === item.href || path.startsWith(item.href + "/");

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileDrawerOpen(false)}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 group relative cursor-pointer",
                    isActive
                      ? "bg-teal-50 text-teal-900 font-semibold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                    sidebarCollapsed && "justify-center px-2"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 shrink-0 transition-colors",
                      isActive ? "text-teal-700" : "text-slate-400 group-hover:text-slate-600"
                    )}
                  />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                  {/* Subtle active left indicator pill */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-teal-600 rounded-r-full" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* STEP 3 Bottom Section: Divider + Caregiver Avatar + Name + Role */}
        <div className="p-3 border-t border-slate-100 space-y-2">
          <div
            className={cn(
              "flex items-center gap-3 p-2 rounded-xl bg-slate-50/70 border border-slate-100",
              sidebarCollapsed && "justify-center p-1.5"
            )}
          >
            <ProfileAvatar
              name={auth.user.name || auth.user.email || "Caregiver"}
              src={auth.user.avatarUrl}
              size="sm"
            />
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {auth.user.name || "Caregiver"}
                </p>
                <p className="text-[10.5px] text-slate-400 capitalize truncate">
                  {role === "caregiver" ? "Caregiver / Family" : "Family Member"}
                </p>
              </div>
            )}
            {!sidebarCollapsed && (
              <button
                onClick={() => void logout()}
                className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-200 ease-in-out",
          sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
        )}
      >
        {/* STEP 4: Global Header / Topbar */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 shadow-2xs">
          {/* Left / Center: Mobile Menu Button + Patient Photo + Name + Stage badge + Dropdown */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 -ml-1.5"
              aria-label="Open menu"
              onClick={() => setMobileDrawerOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Patient Selector Popover/Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setPatientDropdownOpen(!patientDropdownOpen)}
                className="flex items-center gap-3 p-1.5 pr-2.5 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer text-left group"
                aria-haspopup="listbox"
                aria-expanded={patientDropdownOpen}
              >
                <ProfileAvatar
                  src={selectedPatient?.profilePhotoUrl}
                  name={selectedPatient?.preferredName || selectedPatient?.firstName || "Patient"}
                  size="sm"
                  className="shadow-2xs"
                />
                <div className="hidden sm:flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 group-hover:text-teal-900 transition-colors truncate max-w-[160px]">
                      {selectedPatient
                        ? selectedPatient.preferredName || selectedPatient.firstName
                        : "Select Patient"}
                    </span>
                    {selectedPatient && (
                      <StatusBadge
                        status={`${(selectedPatient.stage || "EARLY").replace("_", " ")} Stage`}
                        variant="teal"
                      />
                    )}
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ml-1 shrink-0" />
              </button>

              {/* Accessible Patient List Dropdown Menu */}
              {patientDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setPatientDropdownOpen(false)}
                  />
                  <div
                    role="listbox"
                    className="absolute left-0 top-full mt-2 w-72 rounded-2xl border border-slate-200/90 bg-white shadow-card p-2 z-50 animate-in fade-in-50 zoom-in-95 duration-150"
                  >
                    <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      Accessible Patients
                    </div>
                    <div className="max-h-60 overflow-y-auto py-1 space-y-0.5">
                      {accessiblePatients.map((p) => {
                        const isSelected = p.id === selectedPatientId;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => void switchPatient(p.id)}
                            className={cn(
                              "w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors cursor-pointer",
                              isSelected ? "bg-teal-50 text-teal-900" : "hover:bg-slate-50 text-slate-700"
                            )}
                          >
                            <ProfileAvatar
                              src={p.profilePhotoUrl}
                              name={p.preferredName || p.firstName || "Patient"}
                              size="sm"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold truncate">
                                {p.preferredName || p.firstName}
                              </p>
                              <p className="text-[10.5px] text-slate-400 capitalize">
                                {(p.stage || "Early").toLowerCase()} stage
                              </p>
                            </div>
                            {isSelected && (
                              <span className="h-2 w-2 rounded-full bg-teal-600 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                      {accessiblePatients.length === 0 && (
                        <p className="text-xs text-slate-400 p-3 text-center">No patient profiles found.</p>
                      )}
                    </div>
                    {role === "caregiver" && (
                      <div className="border-t border-slate-100 pt-1 mt-1">
                        <Link
                          href="/caregiver/patients/new"
                          onClick={() => setPatientDropdownOpen(false)}
                          className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-semibold text-teal-700 hover:bg-teal-50 rounded-xl transition-colors"
                        >
                          + Create New Patient
                        </Link>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Side: Live Sync + Notification Bell + Caregiver Profile */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* Live Sync Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-600 shadow-2xs">
              <span
                className={cn(
                  "h-2 w-2 rounded-full shrink-0",
                  offline
                    ? "bg-slate-400"
                    : liveSyncConnected === true
                    ? "bg-emerald-500 animate-pulse"
                    : liveSyncConnected === false
                    ? "bg-slate-400"
                    : "bg-amber-400 animate-pulse"
                )}
              />
              <span className="hidden sm:inline text-slate-700 font-medium">
                {offline
                  ? "Offline"
                  : liveSyncConnected === true
                  ? "Live Sync"
                  : "Live Sync"}
              </span>
            </div>

            {/* Notification Bell with Active Alert Count */}
            <Link
              href={role === "family" ? "/family/notifications" : "/caregiver/alerts"}
              className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              aria-label={activeAlertCount > 0 ? `${activeAlertCount} active alerts` : "Alerts"}
            >
              <Bell className="h-5 w-5" />
              {activeAlertCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs animate-in zoom-in-75">
                  {activeAlertCount > 9 ? "9+" : activeAlertCount}
                </span>
              )}
            </Link>

            {/* Caregiver Avatar + Name + Role (Step 4) */}
            <Link
              href={"/" + role + "/settings"}
              className="flex items-center gap-2.5 p-1 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors"
            >
              <ProfileAvatar
                name={auth.user.name || auth.user.email || "Caregiver"}
                src={auth.user.avatarUrl}
                size="sm"
                className="shadow-2xs"
              />
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 leading-tight">
                  {auth.user.name || auth.user.email?.split("@")[0] || "Caregiver"}
                </span>
                <span className="text-[10.5px] text-slate-500 leading-tight">
                  {role === "caregiver" ? "Caregiver / Family" : "Family Circle"}
                </span>
              </div>
            </Link>
          </div>
        </header>

        {/* Offline notification banner */}
        {offline && (
          <div className="bg-amber-500 text-white text-xs font-medium px-4 py-2 text-center shadow-xs" role="status">
            You are currently offline. Saved care information may not reflect recent events.
          </div>
        )}

        {/* Main Content Area */}
        <main id="main-content" className="flex-1 outline-none">
          {children}
        </main>

        {/* Clean, reassuring footer */}
        <footer className="border-t border-slate-200/80 bg-white/60 py-4 px-6 text-center text-xs text-slate-400">
          GeriCare AI · Compassionate intelligence and connection for dementia care.
        </footer>
      </div>
    </div>
  );
}

