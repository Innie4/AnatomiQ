export default function Loading() {
  return (
    <div className="shell flex min-h-screen items-center justify-center px-4">
      <div className="glass-panel rounded-[2rem] border border-white/80 px-8 py-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">ANATOMIQ</p>
        <p className="mt-3 text-lg text-slate-700">Preparing the anatomy workspace...</p>
      </div>
    </div>
  );
}
