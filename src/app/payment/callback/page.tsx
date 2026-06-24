"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function PaymentCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") || searchParams.get("trxref");
  const [status, setStatus] = useState<"loading" | "success" | "failed">(
    reference ? "loading" : "failed"
  );
  const [message, setMessage] = useState(
    reference ? "Verifying your payment..." : "No payment reference found"
  );

  const verifyPayment = useCallback(async (ref: string) => {
    try {
      const token = localStorage.getItem("academiq:auth-token");
      const response = await fetch(`/api/payment/verify?reference=${ref}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus("success");
        setMessage("Payment successful! Redirecting to your dashboard...");
        setTimeout(() => {
          router.push("/profile");
        }, 2000);
      } else {
        setStatus("failed");
        setMessage(data.error || "Payment verification failed");
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      setStatus("failed");
      setMessage("Failed to verify payment. Please contact support.");
    }
  }, [router]);

  useEffect(() => {
    if (reference) {
      verifyPayment(reference);
    }
  }, [reference, verifyPayment]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-lg max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Processing Payment</h2>
            <p className="text-slate-600">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful!</h2>
            <p className="text-slate-600">{message}</p>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Payment Failed</h2>
            <p className="text-slate-600 mb-6">{message}</p>
            <button
              onClick={() => router.push("/pricing")}
              className="w-full rounded-xl bg-gradient-to-br from-[#0969da] to-[#0ca678] px-6 py-3 font-semibold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
