"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { ArrowLeft, ArrowRight, Check, GraduationCap, Loader2, Sparkles, Users } from "lucide-react";

import { AcademicProfileSelector } from "@/components/academic/academic-profile-selector";

type SignupStep = 1 | 2 | 3 | 4;

type SignupData = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  department: string;
  faculty: string;
  course: string;
  referralCode: string;
};

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className="h-5 w-5" fill="#1877F2" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const initialReferralCode = searchParams.get("ref")?.toUpperCase() || "";
  const [step, setStep] = useState<SignupStep>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SignupData>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    department: "",
    faculty: "",
    course: "",
    referralCode: initialReferralCode,
  });

  const socialSignupCallbackUrl = useMemo(() => {
    const params = new URLSearchParams({
      next: callbackUrl,
      mode: "signup",
    });

    if (data.referralCode || initialReferralCode) {
      params.set("ref", (data.referralCode || initialReferralCode).toUpperCase());
    }

    return `/auth/social?${params.toString()}`;
  }, [callbackUrl, data.referralCode, initialReferralCode]);

  const updateData = (field: keyof SignupData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateStep = (): boolean => {
    setError(null);

    switch (step) {
      case 1:
        if (!data.fullName.trim()) {
          setError("Please enter your full name");
          return false;
        }
        if (data.fullName.trim().length < 2) {
          setError("Name must be at least 2 characters");
          return false;
        }
        return true;
      case 2:
        if (!data.email.trim()) {
          setError("Please enter your email");
          return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
          setError("Please enter a valid email address");
          return false;
        }
        return true;
      case 3:
        if (!data.password) {
          setError("Please enter a password");
          return false;
        }
        if (data.password.length < 8) {
          setError("Password must be at least 8 characters");
          return false;
        }
        if (data.password !== data.confirmPassword) {
          setError("Passwords do not match");
          return false;
        }
        return true;
      case 4:
        if (!data.department) {
          setError("Please select your department");
          return false;
        }
        if (!data.faculty) {
          setError("Please select your faculty");
          return false;
        }
        if (!data.course) {
          setError("Please select your course");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep()) {
      return;
    }

    if (step === 4) {
      void handleSubmit();
      return;
    }

    setStep((prev) => (prev + 1) as SignupStep);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as SignupStep);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: data.fullName,
          email: data.email,
          password: data.password,
          department: data.department,
          faculty: data.faculty,
          course: data.course,
          referralCode: data.referralCode || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create account");
      }

      localStorage.setItem("academiq:auth-token", result.token);
      localStorage.setItem("academiq:user", JSON.stringify(result.user));
      router.push(callbackUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !loading) {
      event.preventDefault();
      handleNext();
    }
  };

  return (
    <div className="w-full max-w-5xl">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
        <aside className="rounded-[2rem] border border-white/80 bg-[linear-gradient(160deg,rgba(9,105,218,0.92),rgba(12,166,120,0.82))] p-6 text-white shadow-[0_30px_80px_rgba(14,116,144,0.18)]">
          <div className="inline-flex rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/90">
            New account
          </div>
          <h2 className="mt-6 text-3xl font-bold leading-tight">Join AcademIQ with a setup that stays organised.</h2>
          <p className="mt-4 text-sm leading-6 text-white/85">
            Create your account with email or social, then keep your department, course, faculty, and referral details in one clean flow.
          </p>

          <div className="mt-8 space-y-4">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5" />
                <div>
                  <p className="font-semibold">Smart onboarding</p>
                  <p className="text-sm text-white/80">Social signup still ends with your academic profile complete.</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
              <div className="flex items-center gap-3">
                <GraduationCap className="h-5 w-5" />
                <div>
                  <p className="font-semibold">Department first</p>
                  <p className="text-sm text-white/80">Every account carries the right faculty, department, and course context.</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5" />
                <div>
                  <p className="font-semibold">Referral ready</p>
                  <p className="text-sm text-white/80">Pass a referral code now or bring one in from a shared invite link.</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="space-y-5">
          <div className="rounded-[2rem] border border-white/80 bg-white/95 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Social signup</p>
                <h3 className="mt-2 text-xl font-bold text-slate-900">Create your account with one tap</h3>
                <p className="mt-1 text-sm text-slate-600">
                  After social signup, we’ll still collect your department, course, faculty, and referral code.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => signIn("google", { callbackUrl: socialSignupCallbackUrl })}
                  className="flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50"
                >
                  <GoogleIcon />
                  Google
                </button>
                <button
                  type="button"
                  onClick={() => signIn("facebook", { callbackUrl: socialSignupCallbackUrl })}
                  className="flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50"
                >
                  <FacebookIcon />
                  Facebook
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/80 bg-white/95 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl">
            <div className="mb-8">
              <div className="mb-4 flex items-center justify-between gap-3">
                {[1, 2, 3, 4].map((currentStep) => (
                  <div key={currentStep} className="flex flex-1 items-center last:flex-none">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-full font-semibold transition-all ${
                        currentStep < step
                          ? "bg-gradient-to-br from-[#0969da] to-[#0ca678] text-white"
                          : currentStep === step
                            ? "bg-gradient-to-br from-[#0969da] to-[#0ca678] text-white ring-4 ring-blue-100"
                            : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {currentStep < step ? <Check className="h-5 w-5" /> : currentStep}
                    </div>
                    {currentStep < 4 && (
                      <div
                        className={`mx-2 h-1 flex-1 rounded-full transition-all ${
                          currentStep < step ? "bg-gradient-to-r from-[#0969da] to-[#0ca678]" : "bg-slate-200"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                <span>Name</span>
                <span>Email</span>
                <span>Password</span>
                <span>Details</span>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900">
                {step === 1 && "Tell us your name"}
                {step === 2 && "Add your email"}
                {step === 3 && "Create your password"}
                {step === 4 && "Finish your academic profile"}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                {step === 1 && "We’ll use this name across your profile and exam results."}
                {step === 2 && "This email is how you’ll sign in and receive important updates."}
                {step === 3 && "Use a password you can remember but others can’t guess."}
                {step === 4 && "Choose your faculty, department, and course, then add any referral code you were given."}
              </p>
            </div>

            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="mb-2 block text-sm font-semibold text-slate-700">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={data.fullName}
                    onChange={(event) => updateData("fullName", event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="John Doe"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={data.email}
                    onChange={(event) => updateData("email", event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="john@university.edu"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={data.password}
                    onChange={(event) => updateData("password", event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="At least 8 characters"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    autoFocus
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold text-slate-700">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={data.confirmPassword}
                    onChange={(event) => updateData("confirmPassword", event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Re-enter your password"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="grid gap-4">
                <AcademicProfileSelector
                  value={{
                    faculty: data.faculty,
                    department: data.department,
                    course: data.course,
                  }}
                  onChange={(selection) => {
                    setData((prev) => ({ ...prev, ...selection }));
                    setError(null);
                  }}
                />
                <div>
                  <label htmlFor="referralCode" className="mb-2 block text-sm font-semibold text-slate-700">
                    Referral Code <span className="text-slate-400">(Optional)</span>
                  </label>
                  <input
                    id="referralCode"
                    type="text"
                    value={data.referralCode}
                    onChange={(event) => updateData("referralCode", event.target.value.toUpperCase())}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter a referral code"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 uppercase text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                {error}
              </div>
            )}

            <div className="mt-8 flex gap-3">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#0969da] to-[#0ca678] px-6 py-3 font-semibold text-white shadow-lg transition-all hover:scale-[1.01] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : step === 4 ? (
                  <>
                    Create Account
                    <Check className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
