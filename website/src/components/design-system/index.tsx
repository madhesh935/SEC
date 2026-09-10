"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/utils/cn";
import {
  User,
  Clock,
  Radio,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  Info,
  Image as ImageIcon,
} from "lucide-react";

// ==========================================
// 1. PageContainer & PageHeader
// ==========================================

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function PageContainer({ className, children, ...props }: PageContainerProps) {
  return (
    <div
      className={cn("w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 sm:space-y-8", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, badge, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2", className)}>
      <div className="space-y-1">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
          {badge}
        </div>
        {subtitle && <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2.5 shrink-0 flex-wrap">{actions}</div>}
    </header>
  );
}

// ==========================================
// 2. ProfileAvatar & StatusBadge & ConnectionBadge
// ==========================================

export interface ProfileAvatarProps {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function ProfileAvatar({ src, name, size = "md", className }: ProfileAvatarProps) {
  const [imageError, setImageError] = React.useState(false);

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-base",
    xl: "h-20 w-20 text-xl",
  }[size];

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "P";

  return (
    <div
      className={cn(
        "relative rounded-2xl bg-teal-50 border border-teal-100/80 text-teal-800 font-semibold flex items-center justify-center overflow-hidden shrink-0 shadow-2xs",
        sizeClasses,
        className
      )}
      aria-label={name}
    >
      {src && !imageError ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
          loading="lazy"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

export interface StatusBadgeProps {
  status?: string | null;
  variant?: "teal" | "mint" | "blue" | "lavender" | "amber" | "red" | "slate";
  dot?: boolean;
  className?: string;
}

export function StatusBadge({
  status,
  variant = "teal",
  dot = true,
  className,
}: StatusBadgeProps) {
  if (!status) return <span className="text-slate-400 text-xs">—</span>;

  const variantStyles = {
    teal: "bg-teal-50 text-teal-800 border-teal-200/80",
    mint: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
    blue: "bg-sky-50 text-sky-800 border-sky-200/80",
    lavender: "bg-purple-50 text-purple-800 border-purple-200/80",
    amber: "bg-amber-50 text-amber-900 border-amber-200/80",
    red: "bg-rose-50 text-rose-800 border-rose-200/80",
    slate: "bg-slate-100 text-slate-700 border-slate-200/80",
  }[variant];

  const dotStyles = {
    teal: "bg-teal-600",
    mint: "bg-emerald-500",
    blue: "bg-sky-500",
    lavender: "bg-purple-500",
    amber: "bg-amber-500",
    red: "bg-rose-500",
    slate: "bg-slate-400",
  }[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide",
        variantStyles,
        className
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dotStyles)} aria-hidden="true" />}
      <span>{status}</span>
    </span>
  );
}

export interface ConnectionBadgeProps {
  connected: boolean;
  connecting?: boolean;
  label?: string;
  className?: string;
}

export function ConnectionBadge({
  connected,
  connecting,
  label,
  className,
}: ConnectionBadgeProps) {
  if (connecting) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-medium text-amber-800",
          className
        )}
      >
        <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
        {label || "Connecting…"}
      </span>
    );
  }

  if (connected) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-medium text-emerald-800",
          className
        )}
      >
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        {label || "Companion Connected"}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-600",
        className
      )}
    >
      <span className="h-2 w-2 rounded-full bg-slate-400" />
      {label || "Offline"}
    </span>
  );
}

// ==========================================
// 3. SectionCard & MetricCard
// ==========================================

export interface SectionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  headerIcon?: React.ReactNode;
}

export function SectionCard({
  title,
  subtitle,
  action,
  headerIcon,
  children,
  className,
  ...props
}: SectionCardProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs transition-shadow hover:shadow-sm",
        className
      )}
      {...props}
    >
      {(title || action || headerIcon) && (
        <div className="flex items-start justify-between gap-4 pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {headerIcon && (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700 shrink-0">
                {headerIcon}
              </div>
            )}
            <div>
              {title && <h2 className="text-base font-semibold text-slate-900 tracking-tight">{title}</h2>}
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export interface MetricCardProps {
  label: string;
  value: string | number | null | undefined;
  subtitle?: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  variant?: "default" | "teal" | "amber" | "rose" | "blue" | "lavender";
  isLoading?: boolean;
  isError?: boolean;
}

export function MetricCard({
  label,
  value,
  subtitle,
  badge,
  icon,
  variant = "default",
  isLoading,
  isError,
}: MetricCardProps) {
  const colorStyles = {
    default: "bg-white border-slate-200/80 text-slate-900",
    teal: "bg-teal-50/40 border-teal-200/70 text-teal-900",
    amber: "bg-amber-50/40 border-amber-200/70 text-amber-950",
    rose: "bg-rose-50/40 border-rose-200/70 text-rose-950",
    blue: "bg-sky-50/40 border-sky-200/70 text-sky-950",
    lavender: "bg-purple-50/40 border-purple-200/70 text-purple-950",
  }[variant];

  return (
    <div
      className={cn(
        "rounded-2xl border p-5 shadow-2xs flex flex-col justify-between min-h-[116px] transition-all hover:shadow-xs",
        colorStyles
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          {badge}
          {icon && <div className="text-slate-400 shrink-0">{icon}</div>}
        </div>
      </div>

      <div className="mt-2">
        {isLoading ? (
          <div className="h-8 w-20 bg-slate-200 rounded-lg animate-pulse my-1" />
        ) : isError ? (
          <span className="text-sm font-medium text-slate-400">Unavailable</span>
        ) : value === null || value === undefined ? (
          <span className="text-sm font-medium text-slate-400">Not available</span>
        ) : (
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </div>
        )}

        {subtitle && !isLoading && (
          <p className="text-xs text-slate-500 mt-1 font-normal">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 4. PatientHero
// ==========================================

export interface PatientHeroProps {
  photoUrl?: string | null;
  name: string;
  age?: number | null;
  stage?: string | null;
  location?: string | null;
  languages?: string | string[] | null;
  biographySummary?: string | null;
  connected?: boolean;
  lastActive?: string | null;
  profileHref?: string;
  companionHref?: string;
}

export function PatientHero({
  photoUrl,
  name,
  age,
  stage,
  location,
  languages,
  biographySummary,
  connected = false,
  lastActive,
  profileHref = "/caregiver/patients",
  companionHref = "/caregiver/companion",
}: PatientHeroProps) {
  const languageDisplay = Array.isArray(languages)
    ? languages.join(", ")
    : languages || null;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs relative overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex items-start gap-5">
          <ProfileAvatar src={photoUrl} name={name} size="xl" className="shadow-xs" />

          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{name}</h2>
              {stage && (
                <StatusBadge
                  status={`${stage.replace("_", " ")} Stage`}
                  variant="teal"
                />
              )}
              <ConnectionBadge connected={connected} />
            </div>

            <p className="text-xs text-slate-500 flex items-center gap-2 flex-wrap font-medium">
              {age !== undefined && age !== null && <span>{age} years</span>}
              {age && location && <span>•</span>}
              {location && <span>{location}</span>}
              {(age || location) && languageDisplay && <span>•</span>}
              {languageDisplay && <span>Languages: {languageDisplay}</span>}
            </p>

            {biographySummary ? (
              <p className="text-sm text-slate-600 max-w-4xl leading-relaxed pt-1 line-clamp-2">
                {biographySummary}
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic pt-1">
                No biography summary provided yet.
              </p>
            )}

            {lastActive && (
              <p className="text-xs text-slate-400 flex items-center gap-1.5 pt-1">
                <Clock className="h-3.5 w-3.5" />
                <span>Last interaction: {new Date(lastActive).toLocaleString()}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start md:self-center flex-wrap pt-2 md:pt-0">
          <Link
            href={profileHref}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors shadow-2xs"
          >
            <User className="h-3.5 w-3.5" />
            View Profile
          </Link>
          <Link
            href={companionHref}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs"
          >
            <Radio className="h-3.5 w-3.5" />
            Open Companion
          </Link>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 5. States: EmptyState, LoadingSkeleton, ErrorState, RetryState
// ==========================================

export interface EmptyStateProps {
  title?: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title = "No information yet",
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-slate-200/90 bg-slate-50/50 p-8 text-center flex flex-col items-center justify-center gap-3 min-h-[200px]",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400 shadow-2xs">
        {icon || <Info className="h-6 w-6" />}
      </div>
      <div className="max-w-md space-y-1">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4 animate-pulse", className)}>
      <div className="h-28 bg-slate-200/70 rounded-2xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-slate-200/70 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-64 bg-slate-200/70 rounded-2xl" />
        <div className="h-64 bg-slate-200/70 rounded-2xl" />
      </div>
    </div>
  );
}

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  message = "We couldn't load this information. Please try again.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-rose-200 bg-rose-50/40 p-6 text-center flex flex-col items-center justify-center gap-3",
        className
      )}
      role="alert"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <p className="text-sm font-medium text-rose-900 max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          type="button"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 transition-colors shadow-2xs"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Try Again
        </button>
      )}
    </div>
  );
}

// ==========================================
// 6. QuickAction & MediaCard & ActivityTimeline
// ==========================================

export interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick?: () => void;
  href?: string;
}

export function QuickAction({ title, description, icon, onClick, href }: QuickActionProps) {
  const content = (
    <div className="flex items-start gap-3.5 p-4 rounded-xl border border-slate-200/80 bg-white hover:bg-teal-50/30 hover:border-teal-200 transition-all text-left w-full group shadow-2xs hover:shadow-xs">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 group-hover:bg-teal-600 group-hover:text-white transition-colors shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="text-xs font-bold text-slate-900 group-hover:text-teal-900 transition-colors flex items-center justify-between">
          <span>{title}</span>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
        </h4>
        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{description}</p>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block w-full">{content}</Link>;
  }

  return (
    <button type="button" onClick={onClick} className="w-full text-left">
      {content}
    </button>
  );
}

export interface MediaCardProps {
  title: string;
  category?: string;
  imageUrl?: string | null;
  description?: string | null;
  metaText?: string | null;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  badge?: React.ReactNode;
}

export function MediaCard({
  title,
  category,
  imageUrl,
  description,
  metaText,
  icon,
  href,
  onClick,
  badge,
}: MediaCardProps) {
  const [imageError, setImageError] = React.useState(false);

  const cardInner = (
    <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs hover:shadow-sm transition-all group flex flex-col h-full">
      <div className="h-32 bg-slate-100 relative overflow-hidden flex items-center justify-center text-slate-400">
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-slate-400">
            {icon || <ImageIcon className="h-8 w-8 text-slate-300" />}
            {category && <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{category}</span>}
          </div>
        )}
        {badge && <div className="absolute top-2.5 right-2.5">{badge}</div>}
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-1">
            {title}
          </h4>
          {description && (
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {metaText && (
          <p className="text-[10px] text-slate-400 font-medium mt-3 border-t border-slate-100 pt-2">
            {metaText}
          </p>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block h-full">{cardInner}</Link>;
  }

  return (
    <div onClick={onClick} className={cn("h-full", onClick && "cursor-pointer")}>
      {cardInner}
    </div>
  );
}

export interface TabNavigationProps {
  tabs: string[];
  activeTab: string;
  onChange: (tab: string) => void;
  className?: string;
}

export function TabNavigation({ tabs, activeTab, onChange, className }: TabNavigationProps) {
  return (
    <div className={cn("border-b border-slate-200", className)}>
      <nav className="flex space-x-6 overflow-x-auto no-scrollbar" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onChange(tab)}
              className={cn(
                "whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer",
                isActive
                  ? "border-teal-600 text-teal-700 font-semibold"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {tab}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
