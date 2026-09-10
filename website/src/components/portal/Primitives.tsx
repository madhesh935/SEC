"use client";
import { useEffect, useState } from "react";
import { Heart, Leaf, RefreshCw, UserRound } from "lucide-react";
export function Brand() {
  return (
    <span className="gc-brand">
      <Heart aria-hidden="true" />
      <span>
        GeriCare<span className="gc-brand-ai"> AI</span>
      </span>
    </span>
  );
}
export function Heading({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="gc-heading">
      <div>
        <p className="gc-eyebrow">People · Memories · Always</p>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children}
    </header>
  );
}
export function Surface({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={"gc-surface " + className}>
      {title && <h2>{title}</h2>}
      {children}
    </section>
  );
}
export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="gc-empty">
      <Leaf size={32} aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}
export function Failure({
  error,
  retry,
}: {
  error: unknown;
  retry: () => unknown;
}) {
  const status = (error as { status?: number })?.status;
  return (
    <div className="gc-empty" role="alert">
      <p>
        {status === 403
          ? "You do not have permission to view this information."
          : status === 401
            ? "Your session needs to be renewed. Please sign in again."
            : "We couldn't connect right now. Please try again."}
      </p>
      <button className="gc-button secondary" onClick={() => retry()}>
        <RefreshCw size={17} />
        Try again
      </button>
    </div>
  );
}
export function DataState({
  query,
  children,
  empty,
}: {
  query: {
    isPending: boolean;
    isError: boolean;
    error: unknown;
    refetch: () => unknown;
  };
  children: React.ReactNode;
  empty?: string | false;
}) {
  if (query.isPending)
    return (
      <div className="gc-loading" role="status">
        <div />
        <div />
        <p>Loading your information…</p>
      </div>
    );
  if (query.isError)
    return <Failure error={query.error} retry={query.refetch} />;
  if (empty) return <Empty>{empty}</Empty>;
  return children;
}
export function Photo({
  src,
  name,
  large = false,
}: {
  src?: string | null;
  name: string;
  large?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [src]);
  return (
    <div
      className={"gc-photo " + (large ? "large" : "")}
      aria-busy={!!src && !loaded && !failed}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={name}
          onError={() => setFailed(true)}
          onLoad={() => setLoaded(true)}
        />
      ) : (
        <UserRound aria-label={name} size={large ? 46 : 26} />
      )}
    </div>
  );
}
export function Tabs({
  items,
  value,
  onChange,
}: {
  items: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <nav className="gc-tabs" aria-label="Sections">
      {items.map((item) => (
        <button
          key={item}
          aria-current={value === item ? "page" : undefined}
          onClick={() => onChange(item)}
        >
          {item}
        </button>
      ))}
    </nav>
  );
}
export function time(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "Not recorded";
}
export function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}
