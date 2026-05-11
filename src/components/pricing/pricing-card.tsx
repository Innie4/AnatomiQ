"use client";

import { Check, Sparkles } from "lucide-react";
import { useState } from "react";
import { formatNaira } from "@/lib/pricing";

type PricingCardProps = {
  name: string;
  tier: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  popular?: boolean;
  badge?: string;
  billingPeriod: "MONTHLY" | "ANNUAL";
  onSubscribe: (tier: string, billingPeriod: "MONTHLY" | "ANNUAL", provider?: "paystack" | "flutterwave") => void;
  currentTier?: string;
  loading?: boolean;
  showPaymentOptions?: boolean;
};

export function PricingCard({
  name,
  tier,
  monthlyPrice,
  annualPrice,
  features,
  popular,
  badge,
  billingPeriod,
  onSubscribe,
  currentTier,
  loading,
  showPaymentOptions = false,
}: PricingCardProps) {
  const [showOptions, setShowOptions] = useState(false);
  const price = billingPeriod === "MONTHLY" ? monthlyPrice : annualPrice;
  const displayPrice = billingPeriod === "MONTHLY" ? price : Math.floor(price / 12);
  const isCurrentTier = currentTier === tier;
  const isFree = tier === "FREE";

  const handlePrimaryClick = () => {
    if (isFree || isCurrentTier) {
      onSubscribe(tier, billingPeriod);
    } else if (showPaymentOptions) {
      setShowOptions(!showOptions);
    } else {
      onSubscribe(tier, billingPeriod, "paystack");
    }
  };

  return (
    <div
      className={`relative rounded-3xl border-2 p-8 transition-all ${
        popular
          ? "border-blue-500 bg-gradient-to-br from-blue-50 to-green-50 shadow-xl scale-105"
          : "border-slate-200 bg-white shadow-lg hover:shadow-xl"
      }`}
    >
      {badge && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-[#0969da] to-[#0ca678] px-4 py-1 text-xs font-bold text-white shadow-lg">
            <Sparkles className="h-3 w-3" />
            {badge}
          </div>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-2xl font-bold text-slate-900">{name}</h3>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-5xl font-bold text-slate-900">{formatNaira(displayPrice)}</span>
          {!isFree && (
            <span className="text-slate-600">
              /{billingPeriod === "MONTHLY" ? "month" : "month"}
            </span>
          )}
        </div>
        {billingPeriod === "ANNUAL" && !isFree && (
          <p className="mt-2 text-sm text-slate-600">
            {formatNaira(price)} billed annually
          </p>
        )}
      </div>

      <ul className="mb-8 space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0969da] to-[#0ca678]">
              <Check className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm text-slate-700">{feature}</span>
          </li>
        ))}
      </ul>

      <div className="space-y-3">
        <button
          onClick={handlePrimaryClick}
          disabled={loading || isCurrentTier}
          className={`w-full rounded-xl px-6 py-3 font-semibold transition-all ${
            isCurrentTier
              ? "border-2 border-slate-300 bg-slate-100 text-slate-600 cursor-not-allowed"
              : popular
              ? "bg-gradient-to-br from-[#0969da] to-[#0ca678] text-white shadow-lg hover:scale-[1.02] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none"
              : "border-2 border-slate-300 bg-white text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          }`}
        >
          {loading ? (
            "Processing..."
          ) : isCurrentTier ? (
            "Current Plan"
          ) : isFree ? (
            "Get Started"
          ) : showPaymentOptions && !showOptions ? (
            "Choose Payment Method"
          ) : (
            `Upgrade to ${name}`
          )}
        </button>

        {showOptions && showPaymentOptions && !isFree && !isCurrentTier && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
            <button
              onClick={() => onSubscribe(tier, billingPeriod, "paystack")}
              disabled={loading}
              className="w-full rounded-lg border-2 border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span className="text-green-600 font-bold">Paystack</span>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Recommended</span>
            </button>
            <button
              onClick={() => onSubscribe(tier, billingPeriod, "flutterwave")}
              disabled={loading}
              className="w-full rounded-lg border-2 border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="text-orange-600 font-bold">Flutterwave</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
