"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Gift, QrCode, Trophy, Users } from "lucide-react";

import { ReferralCard } from "@/components/referral/referral-card";

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

export default function ReferralsPage() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [qrCode, setQrCode] = useState("");

  const loadStats = useCallback(async () => {
    const token = localStorage.getItem("academiq:auth-token");
    if (!token) return;

    const response = await fetch("/api/referral", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      setStats(await response.json());
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const referralLink = useMemo(() => {
    if (!stats?.referralCode || typeof window === "undefined") return "";
    return `${window.location.origin}/signup?ref=${stats.referralCode}`;
  }, [stats?.referralCode]);

  useEffect(() => {
    async function generateQrCode() {
      if (!referralLink) return;
      const QRCode = await import("qrcode");
      setQrCode(await QRCode.toDataURL(referralLink, { margin: 1, width: 240 }));
    }

    void generateQrCode();
  }, [referralLink]);

  const completed = stats?.referrals.filter((referral) => referral.status === "COMPLETED").length || 0;
  const pending = Math.max(0, (stats?.totalReferrals || 0) - completed);
  const rewardProgress = Math.min(100, completed * 20);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 px-4 py-16">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-3 text-slate-900">
              <Gift className="h-9 w-9 text-blue-600" />
              <h1 className="text-4xl font-bold">Referrals</h1>
            </div>
            <p className="mt-2 text-slate-600">Share your referral link, track rewards, and invite classmates with a QR code.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow">
            <p className="text-sm font-semibold text-slate-500">Reward progress</p>
            <div className="mt-2 h-3 w-56 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full bg-gradient-to-r from-blue-600 to-green-600" style={{ width: `${rewardProgress}%` }} />
            </div>
            <p className="mt-2 text-xs text-slate-500">{completed}/5 completed referrals toward the next reward</p>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow">
            <Users className="h-8 w-8 text-blue-600" />
            <p className="mt-4 text-3xl font-bold text-slate-900">{stats?.totalReferrals || 0}</p>
            <p className="text-sm text-slate-600">Total referrals</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow">
            <Trophy className="h-8 w-8 text-emerald-600" />
            <p className="mt-4 text-3xl font-bold text-slate-900">{completed}</p>
            <p className="text-sm text-slate-600">Completed</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow">
            <QrCode className="h-8 w-8 text-slate-700" />
            <p className="mt-4 text-3xl font-bold text-slate-900">{pending}</p>
            <p className="text-sm text-slate-600">Pending</p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <ReferralCard />
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow">
            <h2 className="text-lg font-bold text-slate-900">Referral QR</h2>
            <p className="mt-2 text-sm text-slate-600">Let classmates scan this code to sign up with your referral.</p>
            {qrCode ? (
              <Image src={qrCode} alt="Referral QR code" width={240} height={240} className="mx-auto mt-5 rounded-xl border border-slate-200" unoptimized />
            ) : (
              <div className="mx-auto mt-5 flex h-60 w-60 items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-500">
                Sign in to generate QR
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
