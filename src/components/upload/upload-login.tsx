"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Eye, EyeOff, LockKeyhole, ShieldCheck, LoaderCircle } from "lucide-react";
import { useState } from "react";

export function UploadLogin() {
  const router = useRouter();
  const [adminKey, setAdminKey] = useState("");
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUnlock() {
    if (!adminKey.trim()) {
      setError("Please enter your access key.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Verify the key by trying to fetch admin overview
      const response = await fetch("/api/admin/verify-key", {
        headers: { "x-admin-upload-key": adminKey },
      });

      if (!response.ok) {
        throw new Error("Invalid admin key.");
      }

      // Store the key in sessionStorage
      sessionStorage.setItem("anatomiq:admin-key", adminKey);

      // Navigate to dashboard
      router.push("/admin/upload");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="glass-panel rounded-[2rem] border border-white/80 p-6 sm:p-8">
        <div className="mx-auto max-w-2xl">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">Faculty operations</p>
            <h1 className="display-title mt-2 text-4xl text-slate-950 sm:text-5xl">
              Material upload and processing dashboard
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Manage anatomy source files, grounded knowledge chunks, and faculty-authored question banks from one workspace.
            </p>
          </div>

          <div className="mt-8 rounded-[1.75rem] border border-sky-100 bg-[linear-gradient(160deg,rgba(45,140,255,0.12),rgba(24,176,143,0.08))] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-700">Access gate</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">Unlock dashboard controls</h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-sky-700">
                <LockKeyhole className="h-6 w-6" />
              </div>
            </div>

            <label className="mt-5 block space-y-2">
              <span className="text-sm font-semibold text-slate-700">Admin upload key</span>
              <div className="relative">
                <input
                  type={showAdminKey ? "text" : "password"}
                  value={adminKey}
                  onChange={(event) => setAdminKey(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      void handleUnlock();
                    }
                  }}
                  className="w-full rounded-2xl border border-white/80 bg-white px-4 py-3 pr-12 outline-none"
                  placeholder="Enter ADMIN_UPLOAD_KEY"
                  aria-label="Admin upload key"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminKey(!showAdminKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showAdminKey ? "Hide admin key" : "Show admin key"}
                >
                  {showAdminKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </label>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => void handleUnlock()}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#0969da] to-[#0ca678] px-5 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Unlock dashboard
              </button>
              <Link
                href="/topics"
                className="inline-flex items-center justify-center rounded-2xl border border-white/80 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
              >
                Review topic map
              </Link>
            </div>

            {error ? (
              <div className="mt-4 flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
