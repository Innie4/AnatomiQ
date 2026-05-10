"use client";

import { UploadNavigation } from "./upload-navigation";

export function UploadLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <UploadNavigation />

      {/* Main Content */}
      <main className="pb-20 lg:pl-72 lg:pb-0">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
