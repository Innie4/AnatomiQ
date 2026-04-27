import Link from "next/link";

import { FadeIn } from "@/components/motion/fade-in";

type TopicCard = {
  id: string;
  name: string;
  slug: string;
  summary?: string | null;
  materialCount: number;
  questionCount: number;
  subtopicCount?: number;
  readyMaterialCount?: number;
  processingMaterialCount?: number;
  failedMaterialCount?: number;
  latestMaterialAt?: string | null;
  childTopics: Array<{ id: string; name: string; slug: string }>;
};

export function TopicExplorer({
  topics,
  search,
}: {
  topics: TopicCard[];
  search?: string;
}) {
  return (
    <div className="space-y-10">
      <section className="glass-panel rounded-[2rem] border border-white/80 p-6 shadow-[0_20px_70px_rgba(31,78,126,0.1)] sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">Topic explorer</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="display-title text-4xl text-slate-950 sm:text-5xl">Regional anatomy, organized for recall</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Browse the live anatomy taxonomy, inspect subtopics, and jump directly into topic-specific exam generation.
            </p>
          </div>
          <form action="/topics" className="flex w-full max-w-xl gap-3">
            <input
              name="q"
              defaultValue={search}
              placeholder="Search thorax, hand, cranial nerves..."
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400"
            />
            <button className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:-translate-y-0.5">
              Search
            </button>
          </form>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {topics.map((topic, index) => (
          <FadeIn key={topic.id} delay={index * 0.05} className="glass-panel rounded-[1.75rem] border border-white/80 p-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-950">{topic.name}</h2>
                <p className="mt-3 text-base leading-7 text-slate-600">{topic.summary}</p>
              </div>
              <div className="rounded-3xl bg-white/85 px-4 py-3 text-right shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Question bank</p>
                <p className="mt-2 text-3xl font-semibold text-sky-700">{topic.questionCount}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {topic.childTopics.map((child) => (
                <div key={child.id} className="rounded-2xl border border-slate-200 bg-white/90 p-4">
                  <p className="text-sm font-semibold text-slate-900">{child.name}</p>
                  <Link href={`/exam?topic=${topic.slug}&subtopic=${child.slug}`} className="mt-3 inline-flex text-sm font-semibold text-sky-700">
                    Launch subtopic exam
                  </Link>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-600">
                {topic.materialCount} uploaded materials
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-600">
                {topic.readyMaterialCount ?? 0} ready · {topic.processingMaterialCount ?? 0} processing
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-600">
                {topic.subtopicCount ?? topic.childTopics.length} mapped subtopics
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                {topic.latestMaterialAt
                  ? `Last updated ${new Date(topic.latestMaterialAt).toLocaleDateString()}`
                  : "No uploaded material yet"}
              </p>
              <Link
                href={`/exam?topic=${topic.slug}`}
                className="rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-700 hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-50"
              >
                Start exam
              </Link>
            </div>
          </FadeIn>
        ))}
      </section>
    </div>
  );
}
