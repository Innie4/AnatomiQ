"use client";

import Link from "next/link";
import { Search, Stethoscope } from "lucide-react";
import { useDeferredValue, useState } from "react";

import { FadeIn } from "@/components/motion/fade-in";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

type TopicCard = {
  id: string;
  name: string;
  slug: string;
  summary?: string | null;
  materialCount: number;
  questionCount: number;
  childTopics: Array<{ id: string; name: string; slug: string }>;
};

type AnalyticsProps = {
  mostStudiedTopics: Array<{ topic: string; count: number }>;
  mostGeneratedAreas: Array<{ topic: string; count: number }>;
  difficultyDistribution: Array<{ difficulty: string; count: number }>;
};

export function HomeDashboard({
  topics,
  analytics,
}: {
  topics: TopicCard[];
  analytics: AnalyticsProps;
}) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const filteredTopics = topics.filter((topic) => {
    if (!deferredQuery) {
      return true;
    }

    const normalized = deferredQuery.toLowerCase();
    return (
      topic.name.toLowerCase().includes(normalized) ||
      topic.summary?.toLowerCase().includes(normalized) ||
      topic.childTopics.some((child) => child.name.toLowerCase().includes(normalized))
    );
  });

  return (
    <div suppressHydrationWarning className="space-y-16 pb-16">
      <section className="relative overflow-hidden px-4 pt-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <FadeIn className="relative">
            <h1 className="display-title max-w-4xl text-5xl leading-none text-slate-950 sm:text-6xl lg:text-7xl">
              {APP_NAME}
            </h1>
            <p className="mt-4 text-xl font-semibold text-sky-800">{APP_TAGLINE}</p>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Public anatomy learning, topic-grounded question generation, and clean exam delivery built to stay
              faithful to uploaded Human Anatomy source material.
            </p>

            <div className="glass-panel mt-8 flex max-w-2xl flex-col gap-3 rounded-[2rem] border border-white/80 p-4 shadow-[0_30px_80px_rgba(31,78,126,0.12)] sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <Search className="h-5 w-5 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search anatomy topics, regions, or subtopics"
                  className="w-full bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
              <Link
                href="/exam"
                className="rounded-2xl bg-[linear-gradient(135deg,#2d8cff,#18b08f)] px-6 py-4 text-center text-sm font-semibold text-white shadow-lg shadow-cyan-200/60 hover:-translate-y-0.5"
              >
                Quick start exam
              </Link>
            </div>
          </FadeIn>

          <FadeIn delay={0.15}>
            <div className="glass-panel relative overflow-hidden rounded-[2rem] border border-white/80 p-6 shadow-[0_30px_80px_rgba(31,78,126,0.12)]">
              <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(45,140,255,0.18),transparent_60%)]" />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Signal board</p>
                  <h2 className="display-title mt-2 text-3xl text-slate-950">What students are drilling most</h2>
                </div>
                <div className="metric-ring flex h-20 w-20 items-center justify-center rounded-full shadow-lg shadow-sky-100">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-sky-700">
                    <Stethoscope className="h-6 w-6" />
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                {(analytics.mostStudiedTopics.length
                  ? analytics.mostStudiedTopics
                  : topics.slice(0, 4).map((topic, index) => ({ topic: topic.name, count: index + 1 }))).map(
                  (item, index) => (
                    <div key={item.topic} className="rounded-2xl border border-white/80 bg-white/75 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{item.topic}</p>
                          <p className="mt-1 text-sm text-slate-500">High-interest anatomy region</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-semibold text-sky-700">{String(item.count).padStart(2, "0")}</p>
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                            {index === 0 ? "leading" : "activity"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">Topic catalog</p>
              <h2 className="display-title mt-2 text-4xl text-slate-950">Explore the anatomy map</h2>
            </div>
            <Link href="/topics" className="text-sm font-semibold text-sky-700 hover:text-sky-800">
              Open full explorer
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredTopics.slice(0, 6).map((topic, index) => (
              <FadeIn key={topic.id} delay={index * 0.06} className="glass-panel rounded-[1.75rem] border border-white/80 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-semibold text-slate-950">{topic.name}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{topic.summary}</p>
                  </div>
                  <div className="rounded-2xl bg-sky-50 px-3 py-2 text-right">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Bank</p>
                    <p className="mt-1 text-lg font-semibold text-slate-950">{topic.questionCount}</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {topic.childTopics.slice(0, 4).map((child) => (
                    <span key={child.id} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600">
                      {child.name}
                    </span>
                  ))}
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <p className="text-sm text-slate-500">{topic.materialCount} uploaded materials</p>
                  <Link
                    href={`/exam?topic=${topic.slug}`}
                    className="rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-700 hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-50"
                  >
                    Generate exam
                  </Link>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
