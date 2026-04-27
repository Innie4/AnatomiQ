import Link from "next/link";

import { APP_NAME } from "@/lib/constants";

const links = [
  { href: "/", label: "Overview" },
  { href: "/topics", label: "Topic explorer" },
  { href: "/exam", label: "Exam mode" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/50 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#2d8cff,#18b08f)] text-sm font-semibold tracking-[0.24em] text-white shadow-lg shadow-cyan-200/60">
            AQ
          </div>
          <div>
            <div className="text-sm font-semibold tracking-[0.22em] text-slate-500">{APP_NAME}</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-slate-600 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-slate-950">
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/exam"
          className="rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-700 shadow-sm shadow-sky-100 hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-50"
        >
          Start practice
        </Link>
      </div>
    </header>
  );
}
