"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, Bell, Trash2, Loader2, Save } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"password" | "preferences" | "danger">("password");

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
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

      alert("Password changed successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
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
      alert("Account deletion cancelled");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("anatomiq:auth-token");
      const response = await fetch("/api/auth/delete-account", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete account");
      }

      localStorage.clear();
      router.push("/signin");
    } catch (error) {
      alert("Failed to delete account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 py-16 px-4">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Settings</h1>
        <p className="text-slate-600 mb-8">Manage your account preferences and security</p>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab("password")}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === "password"
                  ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Lock className="inline h-5 w-5 mr-2" />
              Password
            </button>
            <button
              onClick={() => setActiveTab("preferences")}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === "preferences"
                  ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Bell className="inline h-5 w-5 mr-2" />
              Preferences
            </button>
            <button
              onClick={() => setActiveTab("danger")}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === "danger"
                  ? "bg-red-50 text-red-600 border-b-2 border-red-600"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Trash2 className="inline h-5 w-5 mr-2" />
              Danger Zone
            </button>
          </div>

          <div className="p-8">
            {/* Password Tab */}
            {activeTab === "password" && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Change Password</h2>
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, currentPassword: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 px-4 py-3"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, newPassword: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 px-4 py-3"
                      required
                      minLength={8}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 px-4 py-3"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={
                      loading ||
                      passwordData.newPassword !== passwordData.confirmPassword ||
                      passwordData.newPassword.length < 8
                    }
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#0969da] to-[#0ca678] px-6 py-3 font-semibold text-white shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Change Password
                  </button>
                </form>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === "preferences" && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Notification Preferences</h2>
                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
                    <div>
                      <div className="font-semibold text-slate-900">Email Notifications</div>
                      <div className="text-sm text-slate-600">Receive exam results and updates</div>
                    </div>
                    <input type="checkbox" className="h-5 w-5" defaultChecked />
                  </label>
                  <label className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
                    <div>
                      <div className="font-semibold text-slate-900">Referral Updates</div>
                      <div className="text-sm text-slate-600">Get notified when someone uses your referral</div>
                    </div>
                    <input type="checkbox" className="h-5 w-5" defaultChecked />
                  </label>
                  <label className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
                    <div>
                      <div className="font-semibold text-slate-900">Subscription Reminders</div>
                      <div className="text-sm text-slate-600">Payment and renewal notifications</div>
                    </div>
                    <input type="checkbox" className="h-5 w-5" defaultChecked />
                  </label>
                </div>
              </div>
            )}

            {/* Danger Zone Tab */}
            {activeTab === "danger" && (
              <div>
                <h2 className="text-2xl font-bold text-red-600 mb-4">Danger Zone</h2>
                <div className="border-2 border-red-200 rounded-xl p-6 bg-red-50">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Account</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Once you delete your account, there is no going back. All your data including exam history,
                    referrals, and subscription will be permanently deleted.
                  </p>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={loading}
                    className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    Delete Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
