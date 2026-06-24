"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle, KeyRound, Loader2, Lock } from "lucide-react";

import { APP_NAME } from "@/lib/constants";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const channel = searchParams.get("channel") === "phone" ? "phone" : "email";
  const initialIdentifier = searchParams.get("identifier") || "";

  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(token || initialIdentifier ? null : "Enter the email or phone number used for your reset code.");

  const modeLabel = useMemo(() => (token ? "secure link" : `${channel} OTP`), [channel, token]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!token && (!identifier || otp.length !== 6)) {
      setError("Enter your account contact and 6-digit reset code.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token || undefined,
          channel: token ? undefined : channel,
          identifier: token ? undefined : identifier,
          otp: token ? undefined : otp,
          password,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to reset password");
      }

      setSuccess(true);
      window.setTimeout(() => router.push("/signin"), 1600);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(12,166,120,0.2),transparent_34%),linear-gradient(135deg,#f8fafc,#eef2ff)] px-4">
        <section className="glass-panel w-full max-w-md rounded-[2rem] border border-white/80 p-8 text-center shadow-[0_30px_90px_rgba(15,23,42,0.14)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <CheckCircle className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-3xl font-black text-slate-950 dark:text-white">Password reset</h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">You can sign in with your new password now.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(9,105,218,0.16),transparent_34%),linear-gradient(135deg,#f8fafc,#ecfdf5)] px-4 py-12">
      <section className="glass-panel w-full max-w-xl rounded-[2rem] border border-white/80 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.14)] sm:p-8">
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <Image src="/academiQ.png" alt={APP_NAME} width={52} height={52} className="object-contain" priority />
            <h1 className="text-3xl font-black text-slate-950 dark:text-white">{APP_NAME}</h1>
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700 dark:text-sky-300">Reset by {modeLabel}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!token ? (
            <>
              <div>
                <label htmlFor="identifier" className="mb-2 block text-sm font-bold text-slate-800 dark:text-slate-100">
                  {channel === "email" ? "Email address" : "Phone number"}
                </label>
                <input
                  id="identifier"
                  type={channel === "email" ? "email" : "tel"}
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-slate-950 outline-none ring-[#0969da]/20 focus:border-[#0969da] focus:ring-4 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  required
                />
              </div>

              <div>
                <label htmlFor="otp" className="mb-2 block text-sm font-bold text-slate-800 dark:text-slate-100">
                  6-digit OTP
                </label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="otp"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-4 text-center font-mono text-2xl font-black tracking-[0.35em] text-slate-950 outline-none ring-[#0969da]/20 focus:border-[#0969da] focus:ring-4 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    required
                  />
                </div>
              </div>
            </>
          ) : null}

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-bold text-slate-800 dark:text-slate-100">New password</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-4 text-slate-950 outline-none ring-[#0969da]/20 focus:border-[#0969da] focus:ring-4 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="confirm-password" className="mb-2 block text-sm font-bold text-slate-800 dark:text-slate-100">Confirm password</label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              minLength={8}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-slate-950 outline-none ring-[#0969da]/20 focus:border-[#0969da] focus:ring-4 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              required
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700" role="alert">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#0969da] to-[#0ca678] px-6 py-4 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Change password
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <Link href="/forgot-password" className="font-bold text-sky-700 hover:text-sky-900 dark:text-sky-300">Request another code</Link>
        </div>
      </section>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#0969da]" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
