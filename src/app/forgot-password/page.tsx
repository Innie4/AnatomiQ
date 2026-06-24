"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, CheckCircle, Loader2, Mail, MessageSquareText, Phone } from "lucide-react";

import { APP_NAME } from "@/lib/constants";

type ResetChannel = "email" | "phone";

export default function ForgotPasswordPage() {
  const [channel, setChannel] = useState<ResetChannel>("email");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const identifier = channel === "email" ? email : phoneNumber;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          email: channel === "email" ? email : undefined,
          phoneNumber: channel === "phone" ? phoneNumber : undefined,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to send reset code");
      }

      setSent(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to send reset code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(9,105,218,0.16),transparent_34%),linear-gradient(135deg,#f8fafc,#ecfdf5)] px-4 py-12 dark:from-slate-950">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <Image src="/academiQ.png" alt={APP_NAME} width={52} height={52} className="object-contain" priority />
            <h1 className="text-3xl font-black text-slate-950 dark:text-white">{APP_NAME}</h1>
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700 dark:text-sky-300">Account recovery</p>
        </div>

        <section className="glass-panel rounded-[2rem] border border-white/80 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.14)] sm:p-8">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <CheckCircle className="h-8 w-8" />
              </div>
              <h2 className="mt-5 text-3xl font-black text-slate-950 dark:text-white">Code sent</h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">
                If an account matches <span className="font-semibold">{identifier}</span>, a 6-digit reset code is on the way.
              </p>
              <Link
                href={`/reset-password?channel=${channel}&identifier=${encodeURIComponent(identifier)}`}
                className="mt-6 inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#0969da] to-[#0ca678] px-6 py-3 text-sm font-bold text-white shadow-lg"
              >
                Enter OTP
              </Link>
            </div>
          ) : (
            <>
              <div>
                <h2 className="text-3xl font-black text-slate-950 dark:text-white">Reset your password</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Choose where you want to receive your one-time password.
                </p>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 rounded-2xl bg-slate-100 p-1 dark:bg-slate-900">
                {[
                  { value: "email" as const, label: "Email", icon: Mail },
                  { value: "phone" as const, label: "Phone", icon: Phone },
                ].map((option) => {
                  const Icon = option.icon;
                  const active = channel === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setChannel(option.value)}
                      className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold ${
                        active ? "bg-white text-[#0969da] shadow-sm dark:bg-slate-800" : "text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {option.label}
                    </button>
                  );
                })}
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div>
                  <label htmlFor="reset-target" className="mb-2 block text-sm font-bold text-slate-800 dark:text-slate-100">
                    {channel === "email" ? "Email address" : "Phone number"}
                  </label>
                  <div className="relative">
                    {channel === "email" ? (
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    ) : (
                      <MessageSquareText className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    )}
                    <input
                      id="reset-target"
                      type={channel === "email" ? "email" : "tel"}
                      value={identifier}
                      onChange={(event) => (channel === "email" ? setEmail(event.target.value) : setPhoneNumber(event.target.value))}
                      placeholder={channel === "email" ? "you@university.edu" : "+2348012345678"}
                      className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-4 text-slate-950 outline-none ring-[#0969da]/20 focus:border-[#0969da] focus:ring-4 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      required
                    />
                  </div>
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
                  Send OTP
                </button>
              </form>
            </>
          )}

          <div className="mt-6 text-center">
            <Link href="/signin" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-950 dark:text-slate-300">
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
