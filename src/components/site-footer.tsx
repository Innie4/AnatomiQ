import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200/70 bg-white/80">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-slate-600 sm:px-6 lg:px-8 md:flex-row md:items-center md:justify-between">
        <p>ANATOMIQ is built for the University of Uyo Human Anatomy learning community.</p>
        <div className="flex items-center gap-4">
          <Link href="/topics" className="hover:text-slate-950">
            Browse topics
          </Link>
          <Link href="/exam" className="hover:text-slate-950">
            Exam mode
          </Link>
          <Link href="/upload" className="hover:text-slate-950">
            Faculty upload console
          </Link>
        </div>
      </div>
    </footer>
  );
}
