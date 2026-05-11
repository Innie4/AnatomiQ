import Image from "next/image";
import { SignInForm } from "@/components/auth/signin-form";
import { APP_NAME } from "@/lib/constants";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
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
          <p className="text-slate-600">Master human anatomy with confidence</p>
        </div>

        <SignInForm />
      </div>
    </div>
  );
}
