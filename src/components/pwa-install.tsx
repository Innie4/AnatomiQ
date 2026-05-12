"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

export function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registered:", registration);
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
    }

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
    }

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
  };

  if (!showInstallPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-white rounded-2xl border-2 border-blue-600 p-4 shadow-2xl">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-start gap-3 pr-6">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Download className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-900 mb-1">Install AnatomiQ</h3>
            <p className="text-sm text-slate-600 mb-3">
              Install our app for faster access and offline support
            </p>
            <button
              onClick={handleInstallClick}
              className="w-full px-4 py-2 rounded-xl bg-gradient-to-br from-[#0969da] to-[#0ca678] font-semibold text-white hover:scale-105 transition-transform text-sm"
            >
              Install Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
