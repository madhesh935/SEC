import type { Metadata } from "next";
import "./globals.css";
import "./portal.css";
import { QueryProvider } from "@/components/layout/QueryProvider";
import { AuthProvider } from "@/components/portal/AuthProvider";

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
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-warm-50 text-navy-900 antialiased selection:bg-teal-100 selection:text-teal-900">
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>

        </QueryProvider>
      </body>
    </html>
  );
}


