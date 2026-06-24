"use client";

import { useCallback, useEffect, useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  Check,
  CreditCard,
  Edit2,
  Fingerprint,
  Gift,
  Loader2,
  Lock,
  Mail,
  Phone,
  Save,
  ShieldAlert,
  Trash2,
  User,
  X,
} from "lucide-react";

import { ReferralCard } from "@/components/referral/referral-card";

type PreferenceKey = "emailNotifications" | "referralNotifications" | "subscriptionNotifications";
type ThemePreference = "light" | "dark";

type UserProfile = {
  id: string;
  email: string;
  phoneNumber?: string | null;
  fullName: string;
  avatarUrl?: string | null;
  isGuest: boolean;
  biometricsEnabled: boolean;
  preferences: {
    theme: ThemePreference;
    emailNotifications: boolean;
    referralNotifications: boolean;
    subscriptionNotifications: boolean;
  };
  subscription?: {
    tier: string;
    billingPeriod: string;
    status: string;
    nextPaymentDate?: string;
  } | null;
};

const preferenceLabels: Array<[PreferenceKey, string, string]> = [
  ["emailNotifications", "Email notifications", "Exam results and important account messages."],
  ["subscriptionNotifications", "Subscription reminders", "Plan renewals, expirations, and payment nudges."],
  ["referralNotifications", "Referral updates", "Rewards and invite progress alerts."],
];

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

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [guestModal, setGuestModal] = useState(false);
  const [passwordModal, setPasswordModal] = useState(false);
  const [passwordStep, setPasswordStep] = useState<1 | 2 | 3>(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ fullName: "", phoneNumber: "", avatarUrl: "" });
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  const showGuestModal = () => {
    setGuestModal(true);
    setSaving(false);
  };

  const applyTheme = (theme: ThemePreference) => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("academiq:theme", theme);
  };

  const loadProfile = useCallback(async () => {
    const token = localStorage.getItem("academiq:auth-token");
    if (!token) {
      router.push("/signin");
      return;
    }

    try {
      const response = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to load profile");
      }

      const data = (await response.json()) as UserProfile;
      const preferences: UserProfile["preferences"] = {
        ...data.preferences,
        theme: data.preferences?.theme === "dark" ? "dark" : "light",
      };
      const normalized = { ...data, preferences };
      setProfile(normalized);
      setFormData({
        fullName: data.fullName,
        phoneNumber: data.phoneNumber || "",
        avatarUrl: data.avatarUrl || "",
      });
      applyTheme(preferences.theme);
      localStorage.setItem("academiq:user", JSON.stringify(normalized));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const patchProfile = async (body: Record<string, unknown>) => {
    if (!profile) return null;
    if (profile.isGuest) {
      showGuestModal();
      return null;
    }

    const token = localStorage.getItem("academiq:auth-token");
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
      if (data.code === "GUEST_REQUIRES_ACCOUNT") showGuestModal();
      throw new Error(data.error || "Unable to save changes");
    }

    return data;
  };

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      await patchProfile(formData);
      await loadProfile();
      setEditing(false);
      setMessage("Profile updated.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save profile");
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (file: File | null) => {
    if (!file || !profile) return;
    if (profile.isGuest) {
      showGuestModal();
      return;
    }

    setSaving(true);
    setError("");
    const token = localStorage.getItem("academiq:auth-token");
    const form = new FormData();
    form.append("file", file);

    try {
      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Unable to upload profile picture");
      setFormData((value) => ({ ...value, avatarUrl: data.avatarUrl }));
      await loadProfile();
      setMessage("Profile picture updated.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload profile picture");
    } finally {
      setSaving(false);
    }
  };

  const updateTheme = async (theme: ThemePreference) => {
    if (!profile) return;
    if (profile.isGuest) {
      showGuestModal();
      return;
    }

    const previous = profile;
    const updated = { ...profile, preferences: { ...profile.preferences, theme } };
    setProfile(updated);
    applyTheme(theme);

    try {
      await patchProfile({ themePreference: theme });
      localStorage.setItem("academiq:user", JSON.stringify(updated));
    } catch (themeError) {
      setProfile(previous);
      applyTheme(previous.preferences.theme);
      setError(themeError instanceof Error ? themeError.message : "Unable to update theme");
    }
  };

  const updatePreference = async (key: PreferenceKey, value: boolean) => {
    if (!profile) return;
    if (profile.isGuest) {
      showGuestModal();
      return;
    }

    const previous = profile;
    const updated = { ...profile, preferences: { ...profile.preferences, [key]: value } };
    setProfile(updated);

    try {
      await patchProfile({ [key]: value });
      localStorage.setItem("academiq:user", JSON.stringify(updated));
    } catch (preferenceError) {
      setProfile(previous);
      setError(preferenceError instanceof Error ? preferenceError.message : "Unable to update notification preference");
    }
  };

  const toggleBiometrics = async (enabled: boolean) => {
    if (!profile) return;
    if (profile.isGuest) {
      showGuestModal();
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (enabled) {
        const token = localStorage.getItem("academiq:auth-token");
        const optionsResponse = await fetch("/api/auth/biometric/register-options", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        const options = await optionsResponse.json();
        if (!optionsResponse.ok) throw new Error(options.error || "Unable to start biometric setup");

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
        if (!verifyResponse.ok) throw new Error(result.error || "Unable to verify biometrics");
      } else {
        await patchProfile({ biometricsEnabled: false });
      }

      setProfile((value) => (value ? { ...value, biometricsEnabled: enabled } : value));
      setMessage(enabled ? "Biometric login is ready on this device." : "Biometric login is turned off.");
    } catch (biometricError) {
      setError(biometricError instanceof Error ? biometricError.message : "Unable to update biometric login");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!profile) return;
    if (profile.isGuest) {
      showGuestModal();
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const token = localStorage.getItem("academiq:auth-token");
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
      const data = await response.json();

      if (!response.ok) {
        if (data.code === "GUEST_REQUIRES_ACCOUNT") showGuestModal();
        throw new Error(data.error || "Unable to change password");
      }

      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordStep(1);
      setPasswordModal(false);
      setMessage("Password changed.");
    } catch (passwordError) {
      setError(passwordError instanceof Error ? passwordError.message : "Unable to change password");
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async () => {
    if (!profile) return;
    if (profile.isGuest) {
      showGuestModal();
      return;
    }
    if (!confirm("Delete your account permanently?")) return;
    if (prompt('Type "DELETE" to confirm.') !== "DELETE") return;

    const token = localStorage.getItem("academiq:auth-token");
    const response = await fetch("/api/auth/delete-account", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      localStorage.clear();
      router.push("/signin");
    } else {
      setError("Unable to delete account.");
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0969da]" />
      </main>
    );
  }

  if (!profile) return null;

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-950 dark:text-slate-300">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <section className="glass-panel overflow-hidden rounded-[2rem] border border-white/80 shadow-[0_30px_90px_rgba(31,78,126,0.12)]">
          <div className="bg-gradient-to-br from-[#0969da] via-[#0f7bdc] to-[#0ca678] p-8 text-white">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-5">
                <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.5rem] bg-white/15 ring-4 ring-white/20">
                  {profile.avatarUrl ? (
                    <Image src={profile.avatarUrl} alt="" fill className="object-cover" />
                  ) : (
                    <User className="h-9 w-9" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/75">Player profile</p>
                  <h1 className="mt-1 text-4xl font-black">{profile.fullName}</h1>
                  <p className="mt-2 text-sm text-white/80">{profile.isGuest ? "Guest mode" : "Registered account"}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => (profile.isGuest ? showGuestModal() : setEditing((value) => !value))}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-lg"
              >
                {editing ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
                {editing ? "Close editor" : "Edit profile"}
              </button>
            </div>
          </div>
        </section>

        {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{message}</div> : null}
        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div> : null}

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-950 dark:text-white">Account</h2>
                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-sky-700 dark:bg-sky-950 dark:text-sky-300">Level settings</span>
              </div>

              {editing ? (
                <form onSubmit={saveProfile} className="space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">Full name</span>
                    <input value={formData.fullName} onChange={(event) => setFormData((value) => ({ ...value, fullName: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none focus:border-[#0969da] dark:border-slate-700 dark:bg-slate-950 dark:text-white" required />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">Phone number for OTP recovery</span>
                    <input value={formData.phoneNumber} onChange={(event) => setFormData((value) => ({ ...value, phoneNumber: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none focus:border-[#0969da] dark:border-slate-700 dark:bg-slate-950 dark:text-white" placeholder="+2348012345678" />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">Profile picture</span>
                    <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void uploadAvatar(event.target.files?.[0] ?? null)} className="w-full rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950" />
                  </label>
                  <button disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-[#0969da] to-[#0ca678] px-5 py-3 text-sm font-black text-white shadow-lg disabled:opacity-60">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save profile
                  </button>
                </form>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                    <User className="h-5 w-5 text-sky-700" />
                    <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Name</p>
                    <p className="mt-1 font-bold text-slate-950 dark:text-white">{profile.fullName}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                    <Mail className="h-5 w-5 text-sky-700" />
                    <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Email</p>
                    <p className="mt-1 break-all font-bold text-slate-950 dark:text-white">{profile.email}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                    <Phone className="h-5 w-5 text-sky-700" />
                    <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Recovery phone</p>
                    <p className="mt-1 font-bold text-slate-950 dark:text-white">{profile.phoneNumber || "Not set"}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                    <Camera className="h-5 w-5 text-sky-700" />
                    <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Avatar</p>
                    <p className="mt-1 font-bold text-slate-950 dark:text-white">{profile.avatarUrl ? "Active" : "Default"}</p>
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-2xl font-black text-slate-950 dark:text-white">Preferences</h2>
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                  <div>
                    <p className="font-black text-slate-950 dark:text-white">Theme</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Toggle between light and dark mode across AcademIQ.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Light</span>
                    <Toggle checked={profile.preferences.theme === "dark"} disabled={saving} onChange={(checked) => void updateTheme(checked ? "dark" : "light")} />
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Dark</span>
                  </div>
                </div>

                {preferenceLabels.map(([key, title, description]) => (
                  <div key={key} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                    <div>
                      <p className="font-black text-slate-950 dark:text-white">{title}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{description}</p>
                    </div>
                    <Toggle checked={profile.preferences[key]} disabled={saving} onChange={(checked) => void updatePreference(key, checked)} />
                  </div>
                ))}

                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                  <div>
                    <p className="flex items-center gap-2 font-black text-slate-950 dark:text-white"><Fingerprint className="h-5 w-5 text-sky-700" /> Biometric login</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Use your device fingerprint, face unlock, or screen lock as the first sign-in option.</p>
                  </div>
                  <Toggle checked={profile.biometricsEnabled} disabled={saving} onChange={(checked) => void toggleBiometrics(checked)} />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-200 pt-6 dark:border-slate-800">
                <button type="button" onClick={() => (profile.isGuest ? showGuestModal() : setPasswordModal(true))} className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                  <Lock className="h-4 w-4" />
                  Change password
                </button>
                <button type="button" onClick={() => void deleteAccount()} className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-5 py-3 text-sm font-black text-white hover:bg-rose-700">
                  <Trash2 className="h-4 w-4" />
                  Delete account
                </button>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-sky-700" />
                <h2 className="text-xl font-black text-slate-950 dark:text-white">Subscription</h2>
              </div>
              <div className="mt-5 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-800 p-5 text-white">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">Current plan</p>
                <p className="mt-2 text-3xl font-black">{profile.subscription?.tier || "FREE"}</p>
                <p className="mt-2 text-sm text-white/70">{profile.subscription?.status || "Active starter access"}</p>
              </div>
              <Link href="/pricing" className="mt-4 inline-flex w-full justify-center rounded-2xl bg-gradient-to-br from-[#0969da] to-[#0ca678] px-5 py-3 text-sm font-black text-white">
                Manage plan
              </Link>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-3 flex items-center gap-2 px-2 pt-2">
                <Gift className="h-5 w-5 text-sky-700" />
                <h2 className="text-xl font-black text-slate-950 dark:text-white">Referral quest</h2>
              </div>
              <ReferralCard />
            </section>
          </aside>
        </div>
      </div>

      {guestModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="guest-edit-title" className="w-full max-w-md rounded-[2rem] border border-white/80 bg-white p-6 text-center shadow-[0_30px_90px_rgba(15,23,42,0.22)] dark:bg-slate-900">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <h3 id="guest-edit-title" className="mt-5 text-2xl font-black text-slate-950 dark:text-white">Create an account to edit</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Guest sessions can explore AcademIQ, but saving profile, courses, referrals, biometrics, or passwords needs a real account.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Link href="/signin" className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-black text-slate-800 dark:border-slate-700 dark:text-white">Log in</Link>
              <Link href="/signup" className="rounded-2xl bg-gradient-to-br from-[#0969da] to-[#0ca678] px-4 py-3 text-sm font-black text-white">Sign up</Link>
            </div>
            <button type="button" onClick={() => setGuestModal(false)} className="mt-4 text-sm font-bold text-slate-500">Stay as guest</button>
          </div>
        </div>
      ) : null}

      {passwordModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="password-modal-title" className="w-full max-w-md rounded-[2rem] border border-white/80 bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.22)] dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h3 id="password-modal-title" className="text-2xl font-black text-slate-950 dark:text-white">Change password</h3>
              <button type="button" onClick={() => setPasswordModal(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200" aria-label="Close password modal">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 flex gap-2">
              {[1, 2, 3].map((step) => (
                <div key={step} className={`h-2 flex-1 rounded-full ${passwordStep >= step ? "bg-[#0969da]" : "bg-slate-200 dark:bg-slate-700"}`} />
              ))}
            </div>

            <div className="mt-6 space-y-4">
              {passwordStep === 1 ? (
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">Old password</span>
                  <input type="password" value={passwordData.currentPassword} onChange={(event) => setPasswordData((value) => ({ ...value, currentPassword: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950 dark:text-white" autoFocus />
                </label>
              ) : null}
              {passwordStep === 2 ? (
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">New password</span>
                  <input type="password" value={passwordData.newPassword} minLength={8} onChange={(event) => setPasswordData((value) => ({ ...value, newPassword: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950 dark:text-white" autoFocus />
                </label>
              ) : null}
              {passwordStep === 3 ? (
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">Confirm new password</span>
                  <input type="password" value={passwordData.confirmPassword} minLength={8} onChange={(event) => setPasswordData((value) => ({ ...value, confirmPassword: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950 dark:text-white" autoFocus />
                </label>
              ) : null}
            </div>

            <div className="mt-6 flex justify-between gap-3">
              <button type="button" onClick={() => setPasswordStep((step) => (step === 1 ? 1 : ((step - 1) as 1 | 2 | 3)))} className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-black text-slate-700 dark:border-slate-700 dark:text-white">Back</button>
              {passwordStep < 3 ? (
                <button
                  type="button"
                  onClick={() => setPasswordStep((step) => (step + 1) as 1 | 2 | 3)}
                  disabled={(passwordStep === 1 && !passwordData.currentPassword) || (passwordStep === 2 && passwordData.newPassword.length < 8)}
                  className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:opacity-50"
                >
                  Next
                </button>
              ) : (
                <button type="button" onClick={() => void changePassword()} disabled={saving || !passwordData.confirmPassword} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-[#0969da] to-[#0ca678] px-5 py-3 text-sm font-black text-white disabled:opacity-60">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Save password
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
