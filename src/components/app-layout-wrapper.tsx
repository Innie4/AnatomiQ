"use client";

import { usePathname } from "next/navigation";
import { AppNavigation } from "./app-navigation";
import { FeedbackButton } from "./feedback-button";

export function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Pages that should not have navigation (fullscreen/auth pages)
  const noLayoutPages = [
    "/upload",
    "/admin",
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

      <div className="lg:pl-72">
        <div className="min-h-screen pt-16 pb-20 lg:pt-0 lg:pb-0">
          {children}
        </div>
      </div>
      <FeedbackButton />
    </>
  );
}
