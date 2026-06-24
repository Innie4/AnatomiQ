"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2, CheckCircle, XCircle, Mail } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(!!token);
  const [success, setSuccess] = useState(false);
  const [alreadyVerified, setAlreadyVerified] = useState(false);
  const [error, setError] = useState<string | null>(token ? null : "Invalid verification link");

  const verifyEmail = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Verification failed");
      }

      setSuccess(true);
      setAlreadyVerified(data.alreadyVerified || false);

      // Redirect to signin after a delay
      setTimeout(() => {
        router.push("/signin");
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }, [router, token]);

  useEffect(() => {
    verifyEmail();
  }, [verifyEmail]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative h-12 w-12">
              <Image
                src="/academiQ.png"
                alt={APP_NAME}
                width={48}
                height={48}
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">{APP_NAME}</h1>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-lg text-center">
          {loading ? (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Verifying Email</h2>
              <p className="text-slate-600">Please wait while we verify your email address...</p>
            </>
          ) : success ? (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                {alreadyVerified ? "Already Verified!" : "Email Verified!"}
              </h2>
              <p className="text-slate-600 mb-6">
                {alreadyVerified
                  ? "Your email was already verified."
                  : "Your email has been successfully verified. You can now sign in."}
              </p>
              <p className="text-sm text-slate-500">Redirecting to sign in...</p>
            </>
          ) : (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Verification Failed</h2>
              <p className="text-slate-600 mb-6">{error}</p>
              <div className="space-y-3">
                <Link
                  href="/signin"
                  className="block w-full rounded-xl bg-gradient-to-br from-[#0969da] to-[#0ca678] px-6 py-3 font-semibold text-white shadow-lg hover:scale-[1.02] hover:shadow-xl transition-all"
                >
                  Go to Sign In
                </Link>
                <Link
                  href="/signup"
                  className="block w-full text-sm font-semibold text-slate-600 hover:text-slate-900"
                >
                  Create New Account
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
