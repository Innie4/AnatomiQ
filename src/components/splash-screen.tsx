"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [stage, setStage] = useState<"logo" | "name" | "done">("logo");

  useEffect(() => {
    // Logo pop-up animation
    const logoTimer = setTimeout(() => {
      setStage("name");
    }, 1800);

    // Fade and show name
    const nameTimer = setTimeout(() => {
      setStage("done");
      onComplete();
    }, 3200);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(nameTimer);
    };
  }, [onComplete]);

  if (stage === "done") {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0969da]">
      <div className="relative">
        {/* Logo */}
        <div
          className={`transition-all duration-700 ${
            stage === "logo"
              ? "scale-100 opacity-100"
              : "scale-90 opacity-0"
          }`}
          style={{
            animation: stage === "logo" ? "popIn 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)" : undefined,
          }}
        >
          <div className="relative h-32 w-32 sm:h-40 sm:w-40">
            <Image
              src="/anatomiQ.png"
              alt="AnatomiQ"
              fill
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>
        </div>

        {/* Name */}
        <div
          className={`absolute inset-x-0 -bottom-16 flex flex-col items-center transition-all duration-1000 ${
            stage === "name"
              ? "translate-y-0 opacity-100"
              : "translate-y-8 opacity-0"
          }`}
        >
          <h1 className="text-4xl font-bold text-white sm:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
            AnatomiQ
          </h1>
        </div>
      </div>

      <style jsx>{`
        @keyframes popIn {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
