"use client";

import Image from "next/image";
import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";
import { APP_NAME } from "@/lib/constants";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 px-4 py-10">
      <div className="mx-auto w-full max-w-5xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative h-12 w-12">
              <Image
                src="/anatomiQ.png"
                alt={APP_NAME}
                width={48}
                height={48}
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">{APP_NAME}</h1>
          </div>
          <p className="text-slate-600">Create your account and start learning</p>
        </div>

        <SignupForm />

        <div className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/signin" className="font-semibold text-blue-600 hover:text-blue-700">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
