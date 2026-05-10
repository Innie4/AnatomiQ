"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Upload, Database, Settings, FileText } from "lucide-react";

const navItems = [
  {
    name: "Overview",
    href: "/upload/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Upload Material",
    href: "/upload/dashboard/upload",
    icon: Upload,
  },
  {
    name: "Manage Materials",
    href: "/upload/dashboard/materials",
    icon: Database,
  },
  {
    name: "Manage Questions",
    href: "/upload/dashboard/questions",
    icon: FileText,
  },
];

export function UploadNavigation() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 flex-col border-r border-slate-200 bg-white lg:flex">
        {/* Header */}
        <div className="flex h-16 items-center border-b border-slate-200 px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0969da] to-[#0ca678]">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">Admin Panel</div>
              <div className="text-xs text-slate-500">Upload Dashboard</div>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-[#0969da] to-[#0ca678] text-white shadow-md"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
                {isActive && (
                  <div className="ml-auto h-2 w-2 rounded-full bg-white" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="space-y-2 border-t border-slate-200 p-4">
          <Link
            href="/"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:border-slate-400 hover:bg-slate-50"
          >
            Back to Home
          </Link>
          <button
            onClick={() => {
              if (confirm("Are you sure you want to log out?")) {
                localStorage.removeItem("anatomiq:admin-key");
                window.location.reload();
              }
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition-all hover:border-rose-400 hover:bg-rose-100"
          >
            Log Out
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition-colors"
              >
                {isActive && (
                  <div className="absolute -top-1 left-1/2 h-1 w-12 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#0969da] to-[#0ca678]" />
                )}
                <Icon
                  className={`h-5 w-5 ${
                    isActive ? "text-[#0969da]" : "text-slate-600"
                  }`}
                />
                <span
                  className={`text-xs font-medium ${
                    isActive ? "text-[#0969da]" : "text-slate-600"
                  }`}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
