"use client";

import { useEffect, useState } from "react";
import { SplashScreen } from "./splash-screen";
import { AppLayoutWrapper } from "./app-layout-wrapper";
import { PWAInstall } from "./pwa-install";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [hasShownSplash, setHasShownSplash] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Initialize splash state from sessionStorage on mount
    const splashShown = sessionStorage.getItem("academiq:splash-shown");
    if (splashShown === "true") {
      setShowSplash(false);
      setHasShownSplash(true);
    }

    const applyTheme = (theme: string | null) => {
      document.documentElement.classList.toggle("dark", theme === "dark");
    };

    applyTheme(localStorage.getItem("academiq:theme") || "light");
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
    setHasShownSplash(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("academiq:splash-shown", "true");
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
