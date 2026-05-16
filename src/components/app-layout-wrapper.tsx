"use client";

import { usePathname } from "next/navigation";
import { AppNavigation } from "./app-navigation";
import { FeedbackButton } from "./feedback-button";

export function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname?.startsWith("/upload") || pathname?.startsWith("/exam-session")) {
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
