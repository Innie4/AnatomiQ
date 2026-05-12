"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";

type SignupStep = 1 | 2 | 3 | 4;

type SignupData = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  department: string;
  faculty: string;
  referralCode: string;
};

const departments = [
  "Human Anatomy",
  "Physiology",
  "Biochemistry",
  "Pharmacology",
  "Pathology",
  "Microbiology",
  "Other",
];

const faculties = [
  "Medicine",
  "Dentistry",
  "Nursing",
  "Pharmacy",
  "Allied Health Sciences",
  "Veterinary Medicine",
  "Other",
];

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
    referralCode: "",
  });

  // Pre-fill referral code from URL
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setData((prev) => ({ ...prev, referralCode: ref.toUpperCase() }));
    }
  }, [searchParams]);

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
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
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
        if (!data.confirmPassword) {
          setError("Please confirm your password");
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
        return true;

      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      if (step < 4) {
        setStep((prev) => (prev + 1) as SignupStep);
      } else {
        handleSubmit();
      }
    }
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
          faculty: data.faculty || undefined,
          referralCode: data.referralCode || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create account");
      }

      // Store token
      localStorage.setItem("anatomiq:auth-token", result.token);
      localStorage.setItem("anatomiq:user", JSON.stringify(result.user));

      // Redirect to home
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      e.preventDefault();
      handleNext();
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold transition-all ${
                  s < step
                    ? "bg-gradient-to-br from-[#0969da] to-[#0ca678] text-white"
                    : s === step
                    ? "bg-gradient-to-br from-[#0969da] to-[#0ca678] text-white ring-4 ring-blue-100"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {s < step ? <Check className="h-5 w-5" /> : s}
              </div>
              {s < 4 && (
                <div
                  className={`h-1 flex-1 mx-2 rounded-full transition-all ${
                    s < step ? "bg-gradient-to-r from-[#0969da] to-[#0ca678]" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between px-1 text-xs font-medium text-slate-600">
          <span>Name</span>
          <span>Email</span>
          <span>Password</span>
          <span>Details</span>
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-lg">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            {step === 1 && "What's your name?"}
            {step === 2 && "Your email address"}
            {step === 3 && "Create a password"}
            {step === 4 && "Almost there!"}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {step === 1 && "Let us know what to call you"}
            {step === 2 && "We'll use this for your account"}
            {step === 3 && "Make it strong and memorable"}
            {step === 4 && "Just a few more details"}
          </p>
        </div>

        {/* Step 1: Name */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-slate-700 mb-2">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={data.fullName}
                onChange={(e) => updateData("fullName", e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="John Doe"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Step 2: Email */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={data.email}
                onChange={(e) => updateData("email", e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="john@university.edu"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Step 3: Password */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={data.password}
                onChange={(e) => updateData("password", e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="At least 8 characters"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={data.confirmPassword}
                onChange={(e) => updateData("confirmPassword", e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Re-enter your password"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        )}

        {/* Step 4: Department, Faculty & Referral */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <label htmlFor="department" className="block text-sm font-semibold text-slate-700 mb-2">
                Department
              </label>
              <select
                id="department"
                value={data.department}
                onChange={(e) => updateData("department", e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                autoFocus
              >
                <option value="">Select your department</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="faculty" className="block text-sm font-semibold text-slate-700 mb-2">
                Faculty <span className="text-slate-400">(Optional)</span>
              </label>
              <select
                id="faculty"
                value={data.faculty}
                onChange={(e) => updateData("faculty", e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Select your faculty</option>
                {faculties.map((fac) => (
                  <option key={fac} value={fac}>
                    {fac}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="referralCode" className="block text-sm font-semibold text-slate-700 mb-2">
                Referral Code <span className="text-slate-400">(Optional)</span>
              </label>
              <input
                id="referralCode"
                type="text"
                value={data.referralCode}
                onChange={(e) => updateData("referralCode", e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                placeholder="Enter referral code if you have one"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 uppercase"
              />
              <p className="mt-1 text-xs text-slate-500">
                Have a referral code? Enter it to support your referrer!
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-6 flex gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#0969da] to-[#0ca678] px-6 py-3 font-semibold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none"
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
  );
}
