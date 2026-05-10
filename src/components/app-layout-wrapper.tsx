"use client";

import { usePathname } from "next/navigation";
import { AppNavigation } from "./app-navigation";

export function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Don't apply layout wrapper to upload pages and exam sessions (fullscreen)
  if (pathname?.startsWith("/upload") || pathname?.startsWith("/exam-session")) {
    return <>{children}</>;
  }

  return (
    <>
      <AppNavigation />

      {/* Main content with sidebar offset on desktop */}
      <div className="lg:pl-72">
        {/* Bottom padding for mobile navigation bar */}
        <div className="min-h-screen pb-20 lg:pb-0">
          {children}
        </div>
      </div>
    </>
  );
}
