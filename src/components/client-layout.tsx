"use client";

import { useEffect, useState } from "react";
import { SplashScreen } from "./splash-screen";
import { AppLayoutWrapper } from "./app-layout-wrapper";
import { PWAInstall } from "./pwa-install";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);
  const [hasShownSplash, setHasShownSplash] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if splash has been shown in this session
    const splashShown = sessionStorage.getItem("anatomiq:splash-shown");
    if (splashShown === "true") {
      setShowSplash(false);
      setHasShownSplash(true);
    }
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
    setHasShownSplash(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("anatomiq:splash-shown", "true");
    }
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-white">
        <AppLayoutWrapper>{children}</AppLayoutWrapper>
      </div>
    );
  }

  return (
    <>
      {showSplash && !hasShownSplash && (
        <SplashScreen onComplete={handleSplashComplete} />
      )}
      <div
        className={`transition-opacity duration-500 ${
          showSplash ? "opacity-0" : "opacity-100"
        }`}
      >
        <AppLayoutWrapper>{children}</AppLayoutWrapper>
        <PWAInstall />
      </div>
    </>
  );
}
