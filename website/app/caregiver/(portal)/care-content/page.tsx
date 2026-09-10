"use client";

import { Suspense } from "react";
import { CareContent } from "@/components/portal/CareContent";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-500">Loading care content…</div>}>
      <CareContent />
    </Suspense>
  );
}
