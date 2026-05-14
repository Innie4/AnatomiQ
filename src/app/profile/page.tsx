"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Building2, GraduationCap, CreditCard, Edit2, Loader2, Crown, ArrowLeft, Settings, Save, Lock, Trash2 } from "lucide-react";
import { ReferralCard } from "@/components/referral/referral-card";

type UserProfile = {
  id: string;
  email: string;
  fullName: string;
  department: string;
  faculty?: string;
  avatarUrl?: string | null;
  isGuest: boolean;
  preferences?: {
    theme: "light" | "dark" | "system";
    emailNotifications: boolean;
    referralNotifications: boolean;
    subscriptionNotifications: boolean;
  };
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
    avatarUrl: "",
  });
  const [preferences, setPreferences] = useState({
    theme: "system" as "light" | "dark" | "system",
    emailNotifications: true,
    referralNotifications: true,
    subscriptionNotifications: true,
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [avatarUploading, setAvatarUploading] = useState(false);

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
        avatarUrl: data.avatarUrl || "",
      });
      setPreferences(data.preferences || preferences);
      localStorage.setItem("anatomiq:user", JSON.stringify(data));
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

  const handleAvatarUpload = async (file: File | null) => {
    if (!file) {
      return;
    }

    setAvatarUploading(true);
    try {
      const token = localStorage.getItem("anatomiq:auth-token");
      const form = new FormData();
      form.append("file", file);

      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload profile picture");
      }

      setFormData((value) => ({ ...value, avatarUrl: data.avatarUrl }));
      await loadProfile();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to upload profile picture");
    } finally {
      setAvatarUploading(false);
    }
  };

  const applyTheme = (theme: "light" | "dark" | "system") => {
    const resolvedTheme =
      theme === "dark" ||
      (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
        ? "dark"
        : "light";
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
    localStorage.setItem("anatomiq:theme", theme);
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("anatomiq:auth-token");
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          themePreference: preferences.theme,
          emailNotifications: preferences.emailNotifications,
          referralNotifications: preferences.referralNotifications,
          subscriptionNotifications: preferences.subscriptionNotifications,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      applyTheme(preferences.theme);
      await loadProfile();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("anatomiq:auth-token");
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to change password");
      }

      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      alert("Password changed successfully.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return;
    }

    const confirmation = prompt('Type "DELETE" to confirm account deletion:');
    if (confirmation !== "DELETE") {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("anatomiq:auth-token");
      const response = await fetch("/api/auth/delete-account", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to delete account");
      }

      localStorage.clear();
      router.push("/signin");
    } catch {
      alert("Failed to delete account");
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

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Profile picture <span className="text-slate-400">(Optional)</span>
                    </label>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => void handleAvatarUpload(e.target.files?.[0] ?? null)}
                      className="mb-3 w-full rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-slate-900"
                    />
                    {avatarUploading ? <p className="mb-3 text-sm text-slate-500">Uploading profile picture...</p> : null}
                    <input
                      type="url"
                      value={formData.avatarUrl}
                      onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
                      placeholder="https://..."
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
                          avatarUrl: profile.avatarUrl || "",
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

                  {profile.avatarUrl && (
                    <div className="flex items-center gap-3">
                      <img src={profile.avatarUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
                      <div>
                        <div className="text-sm font-semibold text-slate-600">Profile Picture</div>
                        <div className="text-base text-slate-900">Shown in mobile navigation</div>
                      </div>
                    </div>
                  )}

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

            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-lg">
              <div className="mb-6 flex items-center gap-2">
                <Settings className="h-5 w-5 text-slate-600" />
                <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Theme</label>
                  <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-1">
                    {(["system", "light", "dark"] as const).map((theme) => (
                      <button
                        key={theme}
                        type="button"
                        onClick={() => setPreferences({ ...preferences, theme })}
                        className={`rounded-lg px-3 py-2 text-sm font-semibold capitalize ${
                          preferences.theme === theme ? "bg-white text-blue-600 shadow-sm" : "text-slate-600"
                        }`}
                      >
                        {theme}
                      </button>
                    ))}
                  </div>
                </div>

                {[
                  ["emailNotifications", "Email notifications"],
                  ["referralNotifications", "Referral updates"],
                  ["subscriptionNotifications", "Subscription reminders"],
                ].map(([key, label]) => (
                  <label key={key} className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                    <span className="font-semibold text-slate-900">{label}</span>
                    <input
                      type="checkbox"
                      checked={preferences[key as keyof typeof preferences] as boolean}
                      onChange={(event) =>
                        setPreferences({ ...preferences, [key]: event.target.checked })
                      }
                      className="h-5 w-5"
                    />
                  </label>
                ))}

                <button
                  onClick={() => void handleSaveSettings()}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#0969da] to-[#0ca678] px-5 py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  Save settings
                </button>
              </div>

              <form onSubmit={handleChangePassword} className="mt-8 border-t border-slate-200 pt-6">
                <div className="mb-4 flex items-center gap-2">
                  <Lock className="h-5 w-5 text-slate-600" />
                  <h3 className="text-lg font-bold text-slate-900">Change Password</h3>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <input type="password" value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} className="rounded-xl border border-slate-300 px-4 py-3" placeholder="Current password" required />
                  <input type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} className="rounded-xl border border-slate-300 px-4 py-3" placeholder="New password" minLength={8} required />
                  <input type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} className="rounded-xl border border-slate-300 px-4 py-3" placeholder="Confirm password" required />
                </div>
                <button type="submit" disabled={loading} className="mt-4 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Update password
                </button>
              </form>

              <div className="mt-8 border-t border-slate-200 pt-6">
                <button onClick={handleDeleteAccount} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                  <Trash2 className="h-4 w-4" />
                  Delete account
                </button>
              </div>
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
