import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-teal-100 text-teal-800 hover:bg-teal-200/80",
        secondary:
          "border-transparent bg-slate-100 text-slate-900 hover:bg-slate-200/80",
        destructive:
          "border-transparent bg-red-100 text-red-800 hover:bg-red-200/80",
        outline: "text-slate-700 border-slate-200",
        teal: "border-teal-200 bg-teal-50 text-teal-700",
        mint: "border-emerald-200 bg-emerald-50 text-emerald-700",
        blue: "border-sky-200 bg-sky-50 text-sky-700",
        amber: "border-amber-200 bg-amber-50 text-amber-700",
        lavender: "border-purple-200 bg-purple-50 text-purple-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
