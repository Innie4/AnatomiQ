"use client";

import { useState, useEffect, ReactNode } from "react";
import { LoaderCircle } from "lucide-react";

export function AdminAuthWrapper({ children }: { children: (adminKey: string) => ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [inputKey, setInputKey] = useState("");

  useEffect(() => {
    setMounted(true);
    const savedKey = localStorage.getItem("anatomiq:admin-key");
    if (savedKey) {
      setAdminKey(savedKey);
    }
  }, []);

  function handleSubmit() {
    if (inputKey) {
      localStorage.setItem("anatomiq:admin-key", inputKey);
      setAdminKey(inputKey);
    }
  }

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!adminKey) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
          <h1 className="text-2xl font-bold text-slate-900">Admin Authentication</h1>
          <p className="mt-2 text-sm text-slate-600">
            Enter your admin key to access the upload dashboard
          </p>
          <input
            type="password"
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSubmit();
              }
            }}
            placeholder="Enter admin key"
            className="mt-6 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition-colors focus:border-[#0969da] focus:ring-2 focus:ring-[#0969da]/20"
            autoFocus
          />
          <button
            onClick={handleSubmit}
            disabled={!inputKey}
            className="mt-4 w-full rounded-xl bg-gradient-to-r from-[#0969da] to-[#0ca678] px-4 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return <>{children(adminKey)}</>;
}
