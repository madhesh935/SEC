import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/components/layout/QueryProvider";
import { NotificationCenter } from "@/components/layout/NotificationCenter";

export const metadata: Metadata = {
  title: "GeriCare AI — Caregiver & Family Portal",
  description:
    "Production-quality healthcare portal supporting caregivers and authorized family members of dementia patients.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-warm-50 text-navy-900 antialiased selection:bg-teal-100 selection:text-teal-900">
        <QueryProvider>
          {children}
          <NotificationCenter />
        </QueryProvider>
      </body>
    </html>
  );
}
