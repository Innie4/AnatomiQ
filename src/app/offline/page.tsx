"use client";

import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xl max-w-md">
        <WifiOff className="h-24 w-24 text-slate-400 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-slate-900 mb-4">You&apos;re Offline</h1>
        <p className="text-lg text-slate-600 mb-6">
          It looks like you&apos;ve lost your internet connection. Some features may not be available until you&apos;re back online.
        </p>
        <div className="space-y-3 text-left bg-slate-50 rounded-xl p-4">
          <h2 className="font-semibold text-slate-900">Available offline:</h2>
          <ul className="space-y-2 text-slate-600 text-sm">
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Cached exam questions
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Previously viewed materials
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Profile information
            </li>
          </ul>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-6 py-3 rounded-xl bg-gradient-to-br from-[#0969da] to-[#0ca678] font-semibold text-white hover:scale-105 transition-transform"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
