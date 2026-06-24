"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Copy, Check, Users, Gift } from "lucide-react";

type ReferralStats = {
  referralCode: string;
  totalReferrals: number;
  referrals: Array<{
    id: string;
    status: string;
    createdAt: string;
    referredUser: {
      fullName: string;
      email: string;
    };
  }>;
};

export function ReferralCard() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchReferralStats = useCallback(async () => {
    try {
      const token = localStorage.getItem("academiq:auth-token");
      if (!token) return;

      const response = await fetch("/api/referral", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching referral stats:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReferralStats();
  }, [fetchReferralStats]);

  const copyReferralCode = () => {
    if (stats?.referralCode) {
      navigator.clipboard.writeText(stats.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyReferralLink = () => {
    if (stats?.referralCode) {
      const link = `${window.location.origin}/signup?ref=${stats.referralCode}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/3"></div>
          <div className="h-20 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  if (!stats.referralCode) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="bg-gradient-to-br from-[#0969da] to-[#0ca678] p-6 text-white">
          <div className="mb-2 flex items-center gap-3">
            <Gift className="h-6 w-6" />
            <h3 className="text-xl font-bold">Refer & Earn</h3>
          </div>
          <p className="text-sm text-blue-100">Create an account to unlock your referral code and reward trail.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 p-6">
          <Link href="/signin" className="rounded-xl border border-slate-300 px-4 py-3 text-center text-sm font-black text-slate-800 dark:border-slate-700 dark:text-white">
            Log in
          </Link>
          <Link href="/signup" className="rounded-xl bg-gradient-to-br from-[#0969da] to-[#0ca678] px-4 py-3 text-center text-sm font-black text-white">
            Sign up
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0969da] to-[#0ca678] p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Gift className="h-6 w-6" />
          <h3 className="text-xl font-bold">Refer & Earn</h3>
        </div>
        <p className="text-blue-100 text-sm">
          Share your referral code and help others discover AcademIQ
        </p>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Referral Code */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Your Referral Code
          </label>
          <div className="flex gap-2">
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono text-lg font-bold text-slate-900">
              {stats.referralCode}
            </div>
            <button
              onClick={copyReferralCode}
              className="px-4 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 transition-colors"
              title="Copy code"
            >
              {copied ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <Copy className="h-5 w-5 text-slate-600" />
              )}
            </button>
          </div>
        </div>

        {/* Referral Link */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Your Referral Link
          </label>
          <div className="flex gap-2">
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-600 overflow-hidden text-ellipsis whitespace-nowrap">
              {`${window.location.origin}/signup?ref=${stats.referralCode}`}
            </div>
            <button
              onClick={copyReferralLink}
              className="px-4 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 transition-colors"
              title="Copy link"
            >
              {copied ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <Copy className="h-5 w-5 text-slate-600" />
              )}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">
                {stats.totalReferrals}
              </div>
              <div className="text-sm text-slate-600">
                {stats.totalReferrals === 1 ? "Referral" : "Referrals"}
              </div>
            </div>
          </div>
        </div>

        {/* Referral List */}
        {stats.referrals.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">
              Recent Referrals
            </h4>
            <div className="space-y-2">
              {stats.referrals.slice(0, 5).map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-slate-900 text-sm">
                      {referral.referredUser.fullName}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(referral.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      referral.status === "COMPLETED"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {referral.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
