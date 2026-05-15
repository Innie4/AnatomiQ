"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Save, Settings, Trash2 } from "lucide-react";

type Preferences = {
  theme: "light" | "dark" | "system";
  emailNotifications: boolean;
  referralNotifications: boolean;
  subscriptionNotifications: boolean;
};

const defaultPreferences: Preferences = {
  theme: "system",
  emailNotifications: true,
  referralNotifications: true,
  subscriptionNotifications: true,
};

export default function SettingsPage() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSettings() {
      const token = localStorage.getItem("anatomiq:auth-token");
      if (!token) {
        router.push("/signin");
        return;
      }

      const response = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences || defaultPreferences);
      } else {
        setError("Failed to load settings.");
      }

      setLoading(false);
    }

    void loadSettings();
  }, [router]);

  function applyTheme(theme: Preferences["theme"]) {
    const resolvedTheme =
      theme === "dark" ||
      (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
        ? "dark"
        : "light";
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
    localStorage.setItem("anatomiq:theme", theme);
  }

  async function saveSettings() {
    setMessage("");
    setError("");
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

    if (response.ok) {
      applyTheme(preferences.theme);
      setMessage("Settings saved.");
    } else {
      setError("Failed to save settings.");
    }
  }

  async function changePassword(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

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

    if (response.ok) {
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setMessage("Password changed.");
    } else {
      const data = await response.json();
      setError(data.error || "Failed to change password.");
    }
  }

  async function deleteAccount() {
    if (!confirm("Delete your account permanently?")) return;
    if (prompt('Type "DELETE" to confirm.') !== "DELETE") return;

    const token = localStorage.getItem("anatomiq:auth-token");
    const response = await fetch("/api/auth/delete-account", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      localStorage.clear();
      router.push("/signin");
    } else {
      setError("Failed to delete account.");
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-slate-50 p-8 text-slate-600">Loading settings...</div>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 px-4 py-16">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <div className="flex items-center gap-3 text-slate-900">
            <Settings className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold">Settings</h1>
          </div>
          <p className="mt-2 text-slate-600">Theme, notifications, password, and account controls.</p>
        </div>

        {message ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">{message}</div> : null}
        {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</div> : null}

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-slate-900">Preferences</h2>
          <div className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Theme</label>
              <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-1">
                {(["system", "light", "dark"] as const).map((theme) => (
                  <button
                    key={theme}
                    type="button"
                    onClick={() => setPreferences((value) => ({ ...value, theme }))}
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
                  checked={preferences[key as keyof Preferences] as boolean}
                  onChange={(event) => setPreferences((value) => ({ ...value, [key]: event.target.checked }))}
                  className="h-5 w-5"
                />
              </label>
            ))}

            <button onClick={() => void saveSettings()} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white">
              <Save className="h-4 w-4" />
              Save settings
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
          <div className="mb-5 flex items-center gap-2">
            <Lock className="h-5 w-5 text-slate-600" />
            <h2 className="text-2xl font-bold text-slate-900">Change Password</h2>
          </div>
          <form onSubmit={changePassword} className="grid gap-3 md:grid-cols-3">
            <input type="password" value={passwordData.currentPassword} onChange={(event) => setPasswordData((value) => ({ ...value, currentPassword: event.target.value }))} className="rounded-xl border border-slate-300 px-4 py-3" placeholder="Current password" required />
            <input type="password" value={passwordData.newPassword} onChange={(event) => setPasswordData((value) => ({ ...value, newPassword: event.target.value }))} className="rounded-xl border border-slate-300 px-4 py-3" placeholder="New password" minLength={8} required />
            <input type="password" value={passwordData.confirmPassword} onChange={(event) => setPasswordData((value) => ({ ...value, confirmPassword: event.target.value }))} className="rounded-xl border border-slate-300 px-4 py-3" placeholder="Confirm password" required />
            <button type="submit" className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 md:col-span-3">
              Update password
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-rose-200 bg-white p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-rose-700">Danger Zone</h2>
          <button onClick={() => void deleteAccount()} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white hover:bg-rose-700">
            <Trash2 className="h-4 w-4" />
            Delete account
          </button>
        </section>
      </div>
    </main>
  );
}
