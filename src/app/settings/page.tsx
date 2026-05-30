"use client";

import { useCallback, useEffect, useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Fingerprint, Loader2, Save, Settings, ShieldAlert } from "lucide-react";

type PreferenceKey = "emailNotifications" | "referralNotifications" | "subscriptionNotifications";
type Preferences = {
  theme: "light" | "dark";
  emailNotifications: boolean;
  referralNotifications: boolean;
  subscriptionNotifications: boolean;
};

type SettingsProfile = {
  isGuest: boolean;
  biometricsEnabled: boolean;
  preferences: Preferences;
};

const defaultPreferences: Preferences = {
  theme: "light",
  emailNotifications: true,
  referralNotifications: true,
  subscriptionNotifications: true,
};

function Toggle({ checked, onChange, disabled = false }: { checked: boolean; onChange: (value: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-8 w-14 rounded-full transition ${checked ? "bg-gradient-to-r from-[#0969da] to-[#0ca678]" : "bg-slate-300 dark:bg-slate-700"} disabled:cursor-not-allowed disabled:opacity-60`}
    >
      <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-md transition-transform ${checked ? "translate-x-7" : "translate-x-1"}`} />
    </button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<SettingsProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [guestModal, setGuestModal] = useState(false);

  const applyTheme = (theme: "light" | "dark") => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("anatomiq:theme", theme);
  };

  const loadSettings = useCallback(async () => {
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
      const preferences = {
        ...defaultPreferences,
        ...data.preferences,
        theme: data.preferences?.theme === "dark" ? "dark" : "light",
      };
      setProfile({
        isGuest: data.isGuest,
        biometricsEnabled: data.biometricsEnabled,
        preferences,
      });
      applyTheme(preferences.theme);
    } else {
      setError("Unable to load settings.");
    }

    setLoading(false);
  }, [router]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const patchProfile = async (body: Record<string, unknown>) => {
    if (!profile) return;
    if (profile.isGuest) {
      setGuestModal(true);
      return;
    }

    const token = localStorage.getItem("anatomiq:auth-token");
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();

    if (!response.ok) {
      if (data.code === "GUEST_REQUIRES_ACCOUNT") setGuestModal(true);
      throw new Error(data.error || "Unable to save settings.");
    }
  };

  const updateTheme = async (theme: "light" | "dark") => {
    if (!profile) return;
    const previous = profile;
    setProfile({ ...profile, preferences: { ...profile.preferences, theme } });
    applyTheme(theme);
    setError("");

    try {
      await patchProfile({ themePreference: theme });
      setMessage("Theme updated.");
    } catch (themeError) {
      setProfile(previous);
      applyTheme(previous.preferences.theme);
      setError(themeError instanceof Error ? themeError.message : "Unable to update theme.");
    }
  };

  const updatePreference = async (key: PreferenceKey, checked: boolean) => {
    if (!profile) return;
    const previous = profile;
    setProfile({ ...profile, preferences: { ...profile.preferences, [key]: checked } });
    setError("");

    try {
      await patchProfile({ [key]: checked });
      setMessage("Notification preference updated.");
    } catch (preferenceError) {
      setProfile(previous);
      setError(preferenceError instanceof Error ? preferenceError.message : "Unable to update preference.");
    }
  };

  const toggleBiometrics = async (enabled: boolean) => {
    if (!profile) return;
    if (profile.isGuest) {
      setGuestModal(true);
      return;
    }

    setSaving(true);
    setError("");
    try {
      if (enabled) {
        const token = localStorage.getItem("anatomiq:auth-token");
        const optionsResponse = await fetch("/api/auth/biometric/register-options", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        const options = await optionsResponse.json();
        if (!optionsResponse.ok) throw new Error(options.error || "Unable to start biometric setup.");

        const attestation = await startRegistration(options);
        const verifyResponse = await fetch("/api/auth/biometric/register-verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(attestation),
        });
        const result = await verifyResponse.json();
        if (!verifyResponse.ok) throw new Error(result.error || "Unable to verify biometrics.");
      } else {
        await patchProfile({ biometricsEnabled: false });
      }

      setProfile({ ...profile, biometricsEnabled: enabled });
      setMessage(enabled ? "Biometric login enabled." : "Biometric login disabled.");
    } catch (biometricError) {
      setError(biometricError instanceof Error ? biometricError.message : "Unable to update biometric login.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#0969da]" /></main>;
  }

  if (!profile) return null;

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link href="/profile" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-950 dark:text-slate-300">
          <ArrowLeft className="h-4 w-4" />
          Back to profile
        </Link>

        <section className="glass-panel rounded-[2rem] border border-white/80 p-8 shadow-[0_30px_90px_rgba(31,78,126,0.12)]">
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-[#0969da]" />
            <div>
              <h1 className="text-4xl font-black text-slate-950 dark:text-white">Settings</h1>
              <p className="mt-2 text-slate-600 dark:text-slate-300">Theme, notifications, and biometric login.</p>
            </div>
          </div>
        </section>

        {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{message}</div> : null}
        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div> : null}

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <div>
                <p className="font-black text-slate-950 dark:text-white">Dark mode</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">One switch. Light or dark across the platform.</p>
              </div>
              <Toggle checked={profile.preferences.theme === "dark"} onChange={(checked) => void updateTheme(checked ? "dark" : "light")} />
            </div>

            {[
              ["emailNotifications", "Email notifications"],
              ["subscriptionNotifications", "Subscription reminders"],
              ["referralNotifications", "Referral updates"],
            ].map(([key, label]) => (
              <div key={key} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                <p className="font-black text-slate-950 dark:text-white">{label}</p>
                <Toggle checked={profile.preferences[key as PreferenceKey]} onChange={(checked) => void updatePreference(key as PreferenceKey, checked)} />
              </div>
            ))}

            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <div>
                <p className="flex items-center gap-2 font-black text-slate-950 dark:text-white"><Fingerprint className="h-5 w-5 text-[#0969da]" /> Biometric login</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">Use your device fingerprint, face unlock, or screen lock before password fallback.</p>
              </div>
              <Toggle checked={profile.biometricsEnabled} disabled={saving} onChange={(checked) => void toggleBiometrics(checked)} />
            </div>
          </div>

          <div className="mt-6">
            <Link href="/profile" className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-[#0969da] to-[#0ca678] px-5 py-3 text-sm font-black text-white">
              <Save className="h-4 w-4" />
              Profile controls
            </Link>
          </div>
        </section>
      </div>

      {guestModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="settings-guest-title" className="w-full max-w-md rounded-[2rem] border border-white/80 bg-white p-6 text-center shadow-[0_30px_90px_rgba(15,23,42,0.22)] dark:bg-slate-900">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <h2 id="settings-guest-title" className="mt-5 text-2xl font-black text-slate-950 dark:text-white">Log in or sign up</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Guest sessions cannot save settings.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Link href="/signin" className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-black text-slate-800 dark:border-slate-700 dark:text-white">Log in</Link>
              <Link href="/signup" className="rounded-2xl bg-gradient-to-br from-[#0969da] to-[#0ca678] px-4 py-3 text-sm font-black text-white">Sign up</Link>
            </div>
            <button type="button" onClick={() => setGuestModal(false)} className="mt-4 text-sm font-bold text-slate-500">Stay as guest</button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
