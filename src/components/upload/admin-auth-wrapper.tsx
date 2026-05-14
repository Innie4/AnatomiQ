"use client";

import { useState, useEffect, ReactNode } from "react";
import { LoaderCircle, AlertCircle } from "lucide-react";

export function AdminAuthWrapper({ children }: { children: (adminKey: string) => ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [inputKey, setInputKey] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedKey =
      sessionStorage.getItem("anatomiq:admin-key") ||
      localStorage.getItem("anatomiq:admin-key");
    const wasCleared = sessionStorage.getItem("anatomiq:key-cleared");

    if (wasCleared) {
      setError("Invalid admin key. Please enter a valid key.");
      sessionStorage.removeItem("anatomiq:key-cleared");
    } else if (savedKey) {
      void verifyKey(savedKey);
    }
  }, []);

  async function verifyKey(key: string) {
    setChecking(true);
    try {
      const response = await fetch("/api/admin/verify-key", {
        headers: { "x-admin-upload-key": key },
      });

      if (!response.ok) {
        throw new Error("Invalid admin key. Please enter a valid key.");
      }

      sessionStorage.setItem("anatomiq:admin-key", key);
      localStorage.removeItem("anatomiq:admin-key");
      setAdminKey(key);
      setError("");
    } catch (verificationError) {
      sessionStorage.removeItem("anatomiq:admin-key");
      localStorage.removeItem("anatomiq:admin-key");
      setAdminKey("");
      setError(verificationError instanceof Error ? verificationError.message : "Invalid admin key.");
    } finally {
      setChecking(false);
    }
  }

  function handleSubmit() {
    if (inputKey.trim()) {
      void verifyKey(inputKey.trim());
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

          {error && (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <input
            type="password"
            value={inputKey}
            onChange={(e) => {
              setInputKey(e.target.value);
              setError("");
            }}
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
            disabled={!inputKey || checking}
            className="mt-4 w-full rounded-xl bg-gradient-to-r from-[#0969da] to-[#0ca678] px-4 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none"
          >
            {checking ? "Checking..." : "Continue"}
          </button>
        </div>
      </div>
    );
  }

  return <>{children(adminKey)}</>;
}
