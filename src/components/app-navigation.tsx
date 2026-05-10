"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Home, BookOpen, FileQuestion } from "lucide-react";

import { APP_NAME } from "@/lib/constants";

const navigationLinks = [
  {
    href: "/",
    label: "Overview",
    icon: Home,
    description: "Home dashboard"
  },
  {
    href: "/topics",
    label: "Topics",
    icon: BookOpen,
    description: "Explore anatomy topics"
  },
  {
    href: "/exam",
    label: "Exam",
    icon: FileQuestion,
    description: "Start practice exam"
  },
];

export function AppNavigation() {
  const pathname = usePathname();

  // Don't show navigation on upload pages and exam sessions
  if (pathname?.startsWith("/upload") || pathname?.startsWith("/exam-session")) {
    return null;
  }

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-5">
            <div className="relative h-10 w-10">
              <Image
                src="/anatomiQ.png"
                alt={APP_NAME}
                width={40}
                height={40}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <div className="text-lg font-bold text-slate-900">{APP_NAME}</div>
              <div className="text-xs text-slate-500">Anatomy Learning</div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1 p-4">
            {navigationLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                    active
                      ? "bg-gradient-to-br from-[#0969da] to-[#0ca678] text-white shadow-lg"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${active ? "text-white" : "text-slate-400 group-hover:text-slate-600"}`} />
                  <div className="flex-1">
                    <div className={`text-sm font-semibold ${active ? "text-white" : ""}`}>
                      {link.label}
                    </div>
                    <div className={`text-xs ${active ? "text-white/80" : "text-slate-500"}`}>
                      {link.description}
                    </div>
                  </div>
                  {active && (
                    <div className="h-2 w-2 rounded-full bg-white shadow-lg" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Quick Action Button */}
          <div className="border-t border-slate-200 p-4">
            <Link
              href="/exam"
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#0969da] to-[#0ca678] px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl"
            >
              <FileQuestion className="h-4 w-4" />
              Quick Start Exam
            </Link>
          </div>
        </div>
      </aside>


      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 z-40 w-full border-t border-slate-200 bg-white/95 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-around px-2 py-3">
          {navigationLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex flex-1 flex-col items-center gap-1 rounded-xl px-4 py-2 transition-all ${
                  active
                    ? "text-[#0969da]"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {active && (
                  <div className="absolute -top-1 left-1/2 h-1 w-12 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#0969da] to-[#0ca678]" />
                )}
                <Icon className={`h-6 w-6 ${active ? "scale-110" : ""} transition-transform`} />
                <span className={`text-xs font-semibold ${active ? "text-[#0969da]" : ""}`}>
                  {link.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
