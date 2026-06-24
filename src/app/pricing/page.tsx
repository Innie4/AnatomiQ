"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Zap } from "lucide-react";
import { PricingCard } from "@/components/pricing/pricing-card";
import { PRICING, calculateAnnualSavings } from "@/lib/pricing";
import { APP_NAME } from "@/lib/constants";

export default function PricingPage() {
  const router = useRouter();
  const [billingPeriod, setBillingPeriod] = useState<"MONTHLY" | "ANNUAL">("MONTHLY");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (
    tier: string,
    period: "MONTHLY" | "ANNUAL",
    provider: "paystack" | "flutterwave" = "paystack"
  ) => {
    if (tier === "FREE") {
      router.push("/signup");
      return;
    }

    setLoading(true);

    try {
      // Check if user is logged in
      const token = localStorage.getItem("academiq:auth-token");
      if (!token) {
        // Redirect to signin with callback
        router.push(`/signin?callbackUrl=/pricing&tier=${tier}&period=${period}`);
        return;
      }

      // Choose endpoint based on provider
      const endpoint = provider === "flutterwave"
        ? "/api/payment/initialize-flutterwave"
        : "/api/payment/initialize";

      // Initialize payment
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tier, billingPeriod: period }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to initialize payment");
      }

      // Redirect to payment gateway
      window.location.href = data.authorizationUrl;
    } catch (error) {
      console.error("Payment initialization error:", error);
      alert(error instanceof Error ? error.message : "Failed to start payment");
    } finally {
      setLoading(false);
    }
  };

  const starterSavings = calculateAnnualSavings("STARTER");
  const proSavings = calculateAnnualSavings("PRO");
  const premiumSavings = calculateAnnualSavings("PREMIUM");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 py-16 px-4">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

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
            <h1 className="text-4xl font-bold text-slate-900">{APP_NAME} Pricing</h1>
          </div>
          <p className="mx-auto max-w-2xl text-lg text-slate-600">
            Choose the perfect plan for your anatomy learning journey. Cancel anytime.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="mb-12 flex items-center justify-center gap-4">
          <button
            onClick={() => setBillingPeriod("MONTHLY")}
            className={`rounded-xl px-6 py-3 font-semibold transition-all ${
              billingPeriod === "MONTHLY"
                ? "bg-gradient-to-br from-[#0969da] to-[#0ca678] text-white shadow-lg"
                : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod("ANNUAL")}
            className={`relative rounded-xl px-6 py-3 font-semibold transition-all ${
              billingPeriod === "ANNUAL"
                ? "bg-gradient-to-br from-[#0969da] to-[#0ca678] text-white shadow-lg"
                : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Annual
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-bold text-slate-900">
              <Zap className="h-3 w-3" />
              Save 16%
            </span>
          </button>
        </div>

        {/* Annual Savings Banner */}
        {billingPeriod === "ANNUAL" && (
          <div className="mb-8 mx-auto max-w-2xl rounded-2xl bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 p-4 text-center">
            <p className="text-sm font-semibold text-slate-900">
              🎉 Save up to ₦{Math.max(starterSavings, proSavings, premiumSavings).toLocaleString()} per year with annual billing!
            </p>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid gap-8 md:grid-cols-4 max-w-7xl mx-auto">
          <PricingCard
            name={PRICING.FREE.name}
            tier={PRICING.FREE.tier}
            monthlyPrice={PRICING.FREE.monthly}
            annualPrice={PRICING.FREE.annual}
            features={PRICING.FREE.features}
            billingPeriod={billingPeriod}
            onSubscribe={handleSubscribe}
            loading={loading}
            showPaymentOptions={false}
          />

          <PricingCard
            name={PRICING.STARTER.name}
            tier={PRICING.STARTER.tier}
            monthlyPrice={PRICING.STARTER.monthly}
            annualPrice={PRICING.STARTER.annual}
            features={PRICING.STARTER.features}
            popular={PRICING.STARTER.popular}
            billingPeriod={billingPeriod}
            onSubscribe={handleSubscribe}
            loading={loading}
            showPaymentOptions={true}
          />

          <PricingCard
            name={PRICING.PRO.name}
            tier={PRICING.PRO.tier}
            monthlyPrice={PRICING.PRO.monthly}
            annualPrice={PRICING.PRO.annual}
            features={PRICING.PRO.features}
            badge={PRICING.PRO.badge}
            billingPeriod={billingPeriod}
            onSubscribe={handleSubscribe}
            loading={loading}
            showPaymentOptions={true}
          />

          <PricingCard
            name={PRICING.PREMIUM.name}
            tier={PRICING.PREMIUM.tier}
            monthlyPrice={PRICING.PREMIUM.monthly}
            annualPrice={PRICING.PREMIUM.annual}
            features={PRICING.PREMIUM.features}
            billingPeriod={billingPeriod}
            onSubscribe={handleSubscribe}
            loading={loading}
            showPaymentOptions={true}
          />
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-16 text-center">
          <p className="text-sm text-slate-600">
            All plans include access to our core anatomy learning platform.{" "}
            <Link href="/signin" className="font-semibold text-blue-600 hover:text-blue-700">
              Sign in
            </Link>{" "}
            to see your current plan.
          </p>
        </div>
      </div>
    </div>
  );
}
