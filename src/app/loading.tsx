import Image from "next/image";

export default function Loading() {
  return (
    <div className="shell flex min-h-screen items-center justify-center px-4">
      <div className="glass-panel rounded-[2rem] border border-white/80 px-8 py-6 text-center">
        <div className="mx-auto mb-4 h-16 w-16">
          <Image
            src="/anatomiQ.png"
            alt="AcademIQ"
            width={64}
            height={64}
            className="object-contain"
          />
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">AcademIQ</p>
        <p className="mt-3 text-lg text-slate-700">Preparing the workspace...</p>
      </div>
    </div>
  );
}
