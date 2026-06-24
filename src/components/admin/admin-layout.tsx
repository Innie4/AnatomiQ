"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  ChevronDown,
  Database,
  FileText,
  LayoutDashboard,
  LogOut,
  Upload,
  UploadCloud,
  Users,
} from "lucide-react";

import { APP_NAME } from "@/lib/constants";

const primaryItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/courses", label: "Courses", icon: BookOpen },
  { href: "/admin/users", label: "Users", icon: Users },
];

const uploadItems = [
  { href: "/admin/upload", label: "Overview", icon: BarChart3 },
  { href: "/admin/upload/new", label: "Upload Material", icon: UploadCloud },
  { href: "/admin/upload/materials", label: "Materials", icon: Database },
  { href: "/admin/upload/questions", label: "Questions", icon: FileText },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [uploadExpanded, setUploadExpanded] = useState(false);

  const isActive = (href: string) => pathname === href;
  const isUploadActive = pathname?.startsWith("/admin/upload");

  function logout() {
    sessionStorage.removeItem("academiq:admin-key");
    localStorage.removeItem("academiq:admin-key");
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-6">
          <Image src="/academiQ.png" alt={APP_NAME} width={36} height={36} className="object-contain" />
          <div>
            <div className="text-sm font-bold text-slate-900">Admin Dashboard</div>
            <div className="text-xs text-slate-500">{APP_NAME} operations</div>
          </div>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {primaryItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                    active
                      ? "bg-gradient-to-r from-[#0969da] to-[#0ca678] text-white shadow-md"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div>
            <div className="flex items-center">
              <Link
                href="/admin/upload"
                onClick={(e) => {
                  if (isUploadActive) {
                    e.preventDefault();
                    setUploadExpanded((prev) => !prev);
                  }
                }}
                className={`flex flex-1 items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                  isUploadActive
                    ? "bg-slate-900 text-white shadow-md"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Upload className="h-5 w-5" />
                Upload
                <ChevronDown
                  className={`ml-auto h-4 w-4 transition-transform ${
                    uploadExpanded || isUploadActive ? "rotate-180" : ""
                  }`}
                />
              </Link>
            </div>
            <div
              className={`mt-2 space-y-1 border-l border-slate-200 pl-3 overflow-hidden transition-all duration-200 ${
                uploadExpanded || isUploadActive ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              {uploadItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                      active
                        ? "bg-[#f0f6ff] text-[#0969da]"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        <div className="border-t border-slate-200 p-4">
          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      <header className="fixed top-0 z-40 w-full border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2 font-bold text-slate-900">
            <Image src="/academiQ.png" alt={APP_NAME} width={32} height={32} className="object-contain" />
            Admin
          </Link>
          <button onClick={logout} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
            Log out
          </button>
        </div>
      </header>

      <main className="pb-24 pt-16 lg:pl-72 lg:pt-0">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 gap-1 border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur lg:hidden">
        {[...primaryItems.slice(0, 2), ...uploadItems.slice(0, 2), uploadItems[3]].map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-[11px] font-semibold ${
                active ? "text-[#0969da]" : "text-slate-500"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
