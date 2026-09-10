import * as React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNavbar } from "@/components/layout/TopNavbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#FAF9F6]">
      {/* Collapsible, responsive sidebar */}
      <Sidebar />

      {/* Main Content Viewport */}
      <div className="flex flex-1 flex-col min-w-0">
        <TopNavbar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
