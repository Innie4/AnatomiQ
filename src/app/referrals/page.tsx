"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Copy, Gift, TrendingUp, Award, Share2, CheckCircle } from "lucide-react";
import QRCode from "qrcode";

type ReferralStats = {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  referralCode: string;
};

type ReferralUser = {
  id: string;
  fullName: string;
  email: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
};

export default function ReferralsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<ReferralUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [qrCode, setQrCode] = useState("");

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/auth/signin");
        return;
      }

      const response = await fetch("/api/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch referral data");
      }

      const data = await response.json();
      const user = data.user;

      setStats({
        totalReferrals: user.referralCount || 0,
        completedReferrals: user.referrals?.filter((r: any) => r.status === "COMPLETED").length || 0,
        pendingReferrals: user.referrals?.filter((r: any) => r.status === "PENDING").length || 0,
        referralCode: user.referralCode || "",
      });

      setReferrals(
        (user.referrals || []).map((r: any) => ({
          id: r.id,
          fullName: r.referredUser.fullName,
          email: r.referredUser.email,
          status: r.status,
          createdAt: r.createdAt,
          completedAt: r.completedAt,
        }))
      );

      // Generate QR code
      if (user.referralCode) {
        const referralUrl = `${window.location.origin}/auth/signup?ref=${user.referralCode}`;
        const qr = await QRCode.toDataURL(referralUrl, {
          width: 200,
          margin: 1,
          color: {
            dark: "#0969da",
            light: "#ffffff",
          },
        });
        setQrCode(qr);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    if (!stats?.referralCode) return;

    const referralUrl = `${window.location.origin}/auth/signup?ref=${stats.referralCode}`;
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferral = async () => {
    if (!stats?.referralCode) return;

    const referralUrl = `${window.location.origin}/auth/signup?ref=${stats.referralCode}`;
    const text = `Join me on AnatomiQ! Use my referral code: ${stats.referralCode}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join AnatomiQ",
          text,
          url: referralUrl,
        });
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      copyReferralLink();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-700";
      case "PENDING":
        return "bg-yellow-100 text-yellow-700";
      case "EXPIRED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading referral dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 py-16 px-4">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <Gift className="h-16 w-16 text-purple-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Referral Dashboard</h1>
          <p className="text-lg text-slate-600">
            Share AnatomiQ with friends and earn rewards
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 mb-8">
            {error}
          </div>
        )}

        {stats && (
          <>
            {/* Stats Overview */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="h-6 w-6 text-blue-600" />
                  <h3 className="font-semibold text-slate-900">Total Referrals</h3>
                </div>
                <p className="text-3xl font-bold text-slate-900">{stats.totalReferrals}</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Award className="h-6 w-6 text-green-600" />
                  <h3 className="font-semibold text-slate-900">Completed</h3>
                </div>
                <p className="text-3xl font-bold text-green-600">{stats.completedReferrals}</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="h-6 w-6 text-yellow-600" />
                  <h3 className="font-semibold text-slate-900">Pending</h3>
                </div>
                <p className="text-3xl font-bold text-yellow-600">{stats.pendingReferrals}</p>
              </div>
            </div>

            {/* Referral Code Section */}
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-8 mb-8 shadow-xl text-white">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h2 className="text-2xl font-bold mb-4">Your Referral Code</h2>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-4">
                    <p className="text-3xl font-bold text-center tracking-wider">
                      {stats.referralCode}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={copyReferralLink}
                      className="flex-1 px-4 py-3 rounded-xl bg-white text-purple-600 font-semibold hover:scale-105 transition-transform flex items-center justify-center gap-2"
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="h-5 w-5" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-5 w-5" />
                          Copy Link
                        </>
                      )}
                    </button>
                    <button
                      onClick={shareReferral}
                      className="flex-1 px-4 py-3 rounded-xl bg-white text-purple-600 font-semibold hover:scale-105 transition-transform flex items-center justify-center gap-2"
                    >
                      <Share2 className="h-5 w-5" />
                      Share
                    </button>
                  </div>
                </div>

                {qrCode && (
                  <div className="flex flex-col items-center justify-center">
                    <div className="bg-white p-4 rounded-2xl shadow-lg">
                      <img src={qrCode} alt="Referral QR Code" className="w-48 h-48" />
                    </div>
                    <p className="text-sm mt-3 opacity-90">Scan to sign up with your code</p>
                  </div>
                )}
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-8 shadow-lg">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">How It Works</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-blue-600">1</span>
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">Share Your Code</h3>
                  <p className="text-slate-600 text-sm">
                    Send your unique referral code to friends via link, QR code, or social media
                  </p>
                </div>
                <div className="text-center">
                  <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-green-600">2</span>
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">They Sign Up</h3>
                  <p className="text-slate-600 text-sm">
                    Your friend creates an account using your referral code
                  </p>
                </div>
                <div className="text-center">
                  <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-purple-600">3</span>
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">Earn Rewards</h3>
                  <p className="text-slate-600 text-sm">
                    Both you and your friend benefit from the referral program
                  </p>
                </div>
              </div>
            </div>

            {/* Referral List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Your Referrals</h2>
              {referrals.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">No referrals yet. Start sharing your code!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                          User
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                          Referred On
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                          Completed On
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {referrals.map((referral) => (
                        <tr key={referral.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <div>
                              <div className="font-semibold text-slate-900">
                                {referral.fullName}
                              </div>
                              <div className="text-sm text-slate-600">{referral.email}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                referral.status
                              )}`}
                            >
                              {referral.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700">
                            {formatDate(referral.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700">
                            {referral.completedAt ? formatDate(referral.completedAt) : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
