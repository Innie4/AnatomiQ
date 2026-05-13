"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { APP_NAME } from "@/lib/constants";
import { AUTH_DEPARTMENTS, AUTH_FACULTIES } from "@/lib/auth-options";

type SocialUserPayload = {
  id: string;
  email: string;
  fullName: string;
  department: string;
  faculty?: string | null;
  avatarUrl?: string | null;
  requiresProfileCompletion: boolean;
};

type ExchangeResponse =
  | {
      requiresProfileCompletion: false;
      token: string;
      user: SocialUserPayload;
    }
  | {
      requiresProfileCompletion: true;
      user: SocialUserPayload;
    };

function normalizeNextPath(nextValue: string | null) {
  if (!nextValue || !nextValue.startsWith("/")) {
    return "/";
  }

  return nextValue;
}

export default function SocialAuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const requestedReferral = searchParams.get("ref")?.toUpperCase() || "";
  const nextPath = useMemo(() => normalizeNextPath(searchParams.get("next")), [searchParams]);
  const mode = searchParams.get("mode") === "signup" ? "signup" : "signin";
  const hasStartedExchange = useRef(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    department: "",
    faculty: "",
    referralCode: requestedReferral,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      setLoading(false);
      setError("Your social session could not be verified. Please try again.");
      return;
    }

    if (status !== "authenticated" || hasStartedExchange.current) {
      return;
    }

    hasStartedExchange.current = true;

    void (async () => {
      try {
        const response = await fetch("/api/auth/social/exchange", {
          method: "POST",
        });
        const payload = (await response.json()) as ExchangeResponse | { error?: string };

        if (!response.ok) {
          throw new Error(("error" in payload && payload.error) || "Unable to complete social sign-in");
        }

        if ("requiresProfileCompletion" in payload && payload.requiresProfileCompletion) {
          setNeedsProfileCompletion(true);
          setFormData({
            fullName: payload.user.fullName || "",
            department:
              payload.user.department && payload.user.department !== "Human Anatomy"
                ? payload.user.department
                : "",
            faculty: payload.user.faculty || "",
            referralCode: requestedReferral,
          });
          return;
        }

        if (!("token" in payload) || !payload.token) {
          throw new Error("Unable to create an app session");
        }

        localStorage.setItem("anatomiq:auth-token", payload.token);
        localStorage.setItem("anatomiq:user", JSON.stringify(payload.user));
        router.replace(nextPath);
      } catch (exchangeError) {
        setError(exchangeError instanceof Error ? exchangeError.message : "Unable to continue");
      } finally {
        setLoading(false);
      }
    })();
  }, [nextPath, requestedReferral, router, status]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/social/complete-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          department: formData.department,
          faculty: formData.faculty,
          referralCode: formData.referralCode,
        }),
      });

      const payload = (await response.json()) as { error?: string; token?: string; user?: SocialUserPayload };

      if (!response.ok || !payload.token || !payload.user) {
        throw new Error(payload.error || "Unable to save your profile");
      }

      localStorage.setItem("anatomiq:auth-token", payload.token);
      localStorage.setItem("anatomiq:user", JSON.stringify(payload.user));
      router.replace(nextPath);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save your profile");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 px-4 py-8">
      <div className="w-full max-w-2xl rounded-[2rem] border border-white/80 bg-white/95 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="relative h-12 w-12">
            <Image src="/anatomiQ.png" alt={APP_NAME} fill className="object-contain" priority />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">ANATOMIQ</p>
            <h1 className="text-2xl font-bold text-slate-900">
              {mode === "signup" ? "Finish your signup" : "Finishing your sign-in"}
            </h1>
          </div>
        </div>

        {loading && !needsProfileCompletion && (
          <div className="flex min-h-48 flex-col items-center justify-center gap-4 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <div>
              <p className="text-lg font-semibold text-slate-900">Preparing your account</p>
              <p className="mt-1 text-sm text-slate-600">We are linking your social account to your ANATOMIQ session.</p>
            </div>
          </div>
        )}

        {!loading && error && !needsProfileCompletion && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5" />
              <div>
                <p className="font-semibold">We could not complete that social login.</p>
                <p className="mt-1 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {needsProfileCompletion && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Profile completion</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">Choose your department and faculty</h2>
              <p className="mt-2 text-sm text-slate-600">
                Your social account is connected. We just need the academic details that keep your experience properly organised.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="fullName" className="mb-2 block text-sm font-semibold text-slate-700">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(event) => setFormData((prev) => ({ ...prev, fullName: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="department" className="mb-2 block text-sm font-semibold text-slate-700">
                  Department
                </label>
                <select
                  id="department"
                  value={formData.department}
                  onChange={(event) => setFormData((prev) => ({ ...prev, department: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  required
                >
                  <option value="">Select your department</option>
                  {AUTH_DEPARTMENTS.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="faculty" className="mb-2 block text-sm font-semibold text-slate-700">
                  Faculty <span className="text-slate-400">(Optional)</span>
                </label>
                <select
                  id="faculty"
                  value={formData.faculty}
                  onChange={(event) => setFormData((prev) => ({ ...prev, faculty: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select your faculty</option>
                  {AUTH_FACULTIES.map((faculty) => (
                    <option key={faculty} value={faculty}>
                      {faculty}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="referralCode" className="mb-2 block text-sm font-semibold text-slate-700">
                  Referral Code <span className="text-slate-400">(Optional)</span>
                </label>
                <input
                  id="referralCode"
                  type="text"
                  value={formData.referralCode}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, referralCode: event.target.value.toUpperCase() }))
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 uppercase text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#0969da] to-[#0ca678] px-6 py-3 font-semibold text-white shadow-lg transition-all hover:scale-[1.01] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving your profile...
                </>
              ) : (
                <>
                  Continue to ANATOMIQ
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
