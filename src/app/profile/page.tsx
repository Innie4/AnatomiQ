"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Building2, GraduationCap, CreditCard, Edit2, Loader2, Crown, ArrowLeft } from "lucide-react";
import { formatNaira } from "@/lib/pricing";
import { ReferralCard } from "@/components/referral/referral-card";
import { CourseSelector } from "@/components/courses/course-selector";

type UserProfile = {
  id: string;
  email: string;
  fullName: string;
  department: string;
  faculty?: string;
  isGuest: boolean;
  subscription?: {
    tier: string;
    billingPeriod: string;
    status: string;
    endDate: string;
    nextPaymentDate?: string;
  };
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    department: "",
    faculty: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem("anatomiq:auth-token");
      if (!token) {
        router.push("/signin");
        return;
      }

      const response = await fetch("/api/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load profile");
      }

      const data = await response.json();
      setProfile(data);
      setFormData({
        fullName: data.fullName,
        department: data.department,
        faculty: data.faculty || "",
      });
    } catch (error) {
      console.error("Profile load error:", error);
      alert("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("anatomiq:auth-token");
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      await loadProfile();
      setEditing(false);
    } catch (error) {
      console.error("Profile update error:", error);
      alert("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "PRO":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 px-3 py-1 text-xs font-bold text-slate-900">
            <Crown className="h-3 w-3" />
            PRO
          </span>
        );
      case "STARTER":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-500 to-green-500 px-3 py-1 text-xs font-bold text-white">
            STARTER
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700">
            FREE
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 py-16 px-4">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">My Profile</h1>
          <p className="mt-2 text-slate-600">Manage your account settings and subscription</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Profile & Courses */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Profile Information</h2>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </button>
                )}
              </div>

              {editing ? (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Faculty <span className="text-slate-400">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.faculty}
                      onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 rounded-xl bg-gradient-to-br from-[#0969da] to-[#0ca678] px-6 py-3 font-semibold text-white shadow-lg hover:scale-[1.02] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none"
                    >
                      {loading ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(false);
                        setFormData({
                          fullName: profile.fullName,
                          department: profile.department,
                          faculty: profile.faculty || "",
                        });
                      }}
                      className="rounded-xl border-2 border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-slate-400 mt-0.5" />
                    <div>
                      <div className="text-sm font-semibold text-slate-600">Full Name</div>
                      <div className="text-base text-slate-900">{profile.fullName}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-slate-400 mt-0.5" />
                    <div>
                      <div className="text-sm font-semibold text-slate-600">Email</div>
                      <div className="text-base text-slate-900">{profile.email}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-slate-400 mt-0.5" />
                    <div>
                      <div className="text-sm font-semibold text-slate-600">Department</div>
                      <div className="text-base text-slate-900">{profile.department}</div>
                    </div>
                  </div>

                  {profile.faculty && (
                    <div className="flex items-start gap-3">
                      <GraduationCap className="h-5 w-5 text-slate-400 mt-0.5" />
                      <div>
                        <div className="text-sm font-semibold text-slate-600">Faculty</div>
                        <div className="text-base text-slate-900">{profile.faculty}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* My Courses Section */}
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">My Courses</h2>
              <CourseSelector />
            </div>
          </div>

          {/* Right Column - Subscription & Referrals */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="h-5 w-5 text-slate-600" />
                <h3 className="text-lg font-bold text-slate-900">Subscription</h3>
              </div>

              {profile.subscription ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-slate-600 mb-2">Current Plan</div>
                    {getTierBadge(profile.subscription.tier)}
                  </div>

                  <div>
                    <div className="text-sm text-slate-600">Billing Period</div>
                    <div className="text-base font-semibold text-slate-900">
                      {profile.subscription.billingPeriod === "MONTHLY" ? "Monthly" : "Annual"}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-slate-600">Status</div>
                    <div className="text-base font-semibold text-green-600">
                      {profile.subscription.status}
                    </div>
                  </div>

                  {profile.subscription.nextPaymentDate && (
                    <div>
                      <div className="text-sm text-slate-600">Next Payment</div>
                      <div className="text-base font-semibold text-slate-900">
                        {new Date(profile.subscription.nextPaymentDate).toLocaleDateString()}
                      </div>
                    </div>
                  )}

                  <Link
                    href="/pricing"
                    className="block w-full text-center rounded-xl border-2 border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Change Plan
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {getTierBadge("FREE")}
                  <p className="text-sm text-slate-600">
                    Upgrade to unlock premium features and unlimited access.
                  </p>
                  <Link
                    href="/pricing"
                    className="block w-full text-center rounded-xl bg-gradient-to-br from-[#0969da] to-[#0ca678] px-4 py-3 font-semibold text-white shadow-lg hover:scale-[1.02] hover:shadow-xl"
                  >
                    View Plans
                  </Link>
                </div>
              )}
            </div>

            {/* Referral Card */}
            <ReferralCard />
          </div>
        </div>
      </div>
    </div>
  );
}
