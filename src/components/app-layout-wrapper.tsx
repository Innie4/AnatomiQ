"use client";

import { usePathname } from "next/navigation";
import { AppNavigation } from "./app-navigation";

export function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Pages that should not have navigation (fullscreen/auth pages)
  const noLayoutPages = [
    "/upload",
    "/exam-session",
    "/signin",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
  ];

  // Don't apply layout wrapper to specified pages
  if (noLayoutPages.some(page => pathname?.startsWith(page))) {
    return <>{children}</>;
  }

  return (
    <>
      <AppNavigation />

      {/* Main content with sidebar offset on desktop */}
      <div className="lg:pl-72">
        {/* Padding for mobile header and bottom navigation */}
        <div className="min-h-screen pt-16 pb-20 lg:pt-0 lg:pb-0">
          {children}
        </div>
      </div>
    </>
  );
}
