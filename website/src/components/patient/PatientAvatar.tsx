import * as React from "react";
import { cn } from "@/utils/cn";
import { User as UserIcon } from "lucide-react";

export interface PatientAvatarProps {
  name?: string;
  photoUrl?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function PatientAvatar({
  name,
  photoUrl,
  size = "md",
  className,
}: PatientAvatarProps) {
  const [imageError, setImageError] = React.useState(false);

  const getInitials = (fullName?: string) => {
    if (!fullName) return "";
    const parts = fullName.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-base font-semibold",
    xl: "h-20 w-20 text-xl font-bold",
  }[size];

  if (photoUrl && !imageError) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-full border border-slate-200 bg-slate-100 shadow-xs shrink-0",
          sizeClasses,
          className
        )}
      >
        <img
          src={photoUrl}
          alt={name ? `${name}'s profile photo` : "Patient profile photo"}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  const initials = getInitials(name);

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-teal-100 text-teal-800 border border-teal-200 shadow-xs shrink-0 font-medium select-none",
        sizeClasses,
        className
      )}
      aria-label={name ? `${name}'s avatar` : "Patient avatar"}
    >
      {initials ? initials : <UserIcon className="h-1/2 w-1/2 text-teal-700" />}
    </div>
  );
}
