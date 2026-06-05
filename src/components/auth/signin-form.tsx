"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { startAuthentication } from "@simplewebauthn/browser";
import { signIn } from "next-auth/react";
import { Fingerprint, Loader2, Lock, Mail, UserCircle2, X } from "lucide-react";
import { useMemo, useState } from "react";

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className="h-5 w-5" fill="#1877F2" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const socialCallbackUrl = useMemo(
    () => `/auth/social?next=${encodeURIComponent(callbackUrl)}`,
    [callbackUrl],
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [biometricModal, setBiometricModal] = useState<"prompt" | "success" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const closeBiometricModal = () => {
    if (biometricModal === "prompt") {
      setError("Biometric login was cancelled. Use your password to continue.");
    }
    setBiometricModal(null);
  };

  const handleBiometricSignIn = async () => {
    setBiometricLoading(true);
    setBiometricModal("prompt");
    setError(null);

    try {
      const optionsResponse = await fetch("/api/auth/biometric/login-options", { method: "POST" });
      const options = await optionsResponse.json();

      if (!optionsResponse.ok) {
        throw new Error(options.error || "Biometric login is not set up yet.");
      }

      const assertion = await startAuthentication(options);
      const verifyResponse = await fetch("/api/auth/biometric/login-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assertion),
      });
      const result = await verifyResponse.json();

      if (!verifyResponse.ok) {
        throw new Error(result.error || "Biometric login failed.");
      }

      localStorage.setItem("anatomiq:auth-token", result.token);
      localStorage.setItem("anatomiq:user", JSON.stringify(result.user));
      setBiometricModal("success");
      window.setTimeout(() => router.push(callbackUrl), 650);
    } catch (err) {
      setBiometricModal(null);
      setError(err instanceof Error ? err.message : "Use your password to continue.");
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to sign in");
      }

      localStorage.setItem("anatomiq:auth-token", result.token);
      localStorage.setItem("anatomiq:user", JSON.stringify(result.user));

      router.push(callbackUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/guest", {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to sign in as guest");
      }

      localStorage.setItem("anatomiq:auth-token", result.token);
      localStorage.setItem("anatomiq:user", JSON.stringify(result.user));

      router.push(callbackUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="rounded-[2rem] border border-white/80 bg-white/95 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
          <p className="mt-2 text-sm text-slate-600">Sign in to continue your anatomy journey.</p>
        </div>

        <button
          type="button"
          onClick={() => void handleBiometricSignIn()}
          disabled={loading || biometricLoading}
          className="mb-4 flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-950 px-6 py-4 font-bold text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {biometricLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Fingerprint className="h-5 w-5" />}
          Use fingerprint or passkey
        </button>

        <div className="mb-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-700">Continue with social</p>
            <p className="text-xs text-slate-500">Fast access for returning students.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Continue with Google"
              onClick={() => signIn("google", { callbackUrl: socialCallbackUrl })}
              disabled={loading}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <GoogleIcon />
            </button>
            <button
              type="button"
              aria-label="Continue with Facebook"
              onClick={() => signIn("facebook", { callbackUrl: socialCallbackUrl })}
              disabled={loading}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FacebookIcon />
            </button>
          </div>
        </div>

        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                required
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
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#0969da] to-[#0ca678] px-6 py-3 font-semibold text-white shadow-lg transition-all hover:scale-[1.01] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">or</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <button
          type="button"
          onClick={handleGuestSignIn}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <UserCircle2 className="h-5 w-5" />
          <span>Guest</span>
        </button>

        <div className="mt-6 text-center text-sm text-slate-600">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-blue-600 hover:text-blue-700">
            Sign up
          </Link>
        </div>
      </div>

      {biometricModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeBiometricModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="biometric-dialog-title"
            className="w-full max-w-sm rounded-[2rem] border border-white/70 bg-white p-6 text-center shadow-[0_30px_90px_rgba(15,23,42,0.24)]"
          >
            <button
              type="button"
              onClick={closeBiometricModal}
              className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600"
              aria-label="Close biometric login"
            >
              <X className="h-4 w-4" />
            </button>
            <div className={`mx-auto mt-2 flex h-20 w-20 items-center justify-center rounded-[1.5rem] ${biometricModal === "success" ? "bg-emerald-100 text-emerald-700" : "bg-sky-100 text-sky-700"}`}>
              {biometricModal === "success" ? <UserCircle2 className="h-10 w-10" /> : <Fingerprint className="h-10 w-10 animate-pulse" />}
            </div>
            <h3 id="biometric-dialog-title" className="mt-5 text-2xl font-black text-slate-950">
              {biometricModal === "success" ? "Unlocked" : "Fingerprint check"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {biometricModal === "success"
                ? "Taking you into AcademIQ."
                : "Use your device fingerprint, face unlock, or screen lock. Tap outside to fall back to password."}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
