"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

type StoredResult = {
  submittedAt: string;
  timedOut: boolean;
  selection: {
    topicName: string;
    subtopicName?: string | null;
  };
  config: {
    type: string;
  };
  questions: Array<{
    id: string;
    type: "MCQ" | "SHORT_ANSWER" | "THEORY";
    stem: string;
    answer: string;
    explanation?: string | null;
    sourceSnippet: string;
  }>;
  answers: Record<string, string>;
  grade: null | {
    score: number;
    total: number;
    percentage: number;
    breakdown: Array<{
      questionId: string;
      questionType: "MCQ" | "SHORT_ANSWER" | "THEORY";
      submittedAnswer: string;
      correctAnswer: string;
      correct: boolean;
      explanation?: string | null;
      sourceSnippet: string;
    }>;
  };
};

function subscribe(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const listener = () => callback();
  window.addEventListener("storage", listener);
  return () => window.removeEventListener("storage", listener);
}

function getSnapshot() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem("anatomiq:last-result");
  return raw ? (JSON.parse(raw) as StoredResult) : null;
}

export function ResultsClient() {
  const result = useSyncExternalStore(subscribe, getSnapshot, () => null);

  if (!result) {
    return (
      <div className="glass-panel rounded-[2rem] border border-white/80 p-8 text-center">
        <h1 className="display-title text-4xl text-slate-950">No active session result</h1>
        <p className="mt-3 text-slate-600">Start an exam first, then come back here to review the session-only output.</p>
        <Link
          href="/exam"
          className="mt-6 inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:-translate-y-0.5"
        >
          Open exam mode
        </Link>
      </div>
    );
  }

  const breakdownMap = new Map(result.grade?.breakdown.map((item) => [item.questionId, item]) ?? []);

  return (
    <div suppressHydrationWarning className="space-y-8">
      <section className="glass-panel rounded-[2rem] border border-white/80 p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">Session results</p>
        <h1 className="display-title mt-2 text-4xl text-slate-950 sm:text-5xl">
          {result.selection.topicName}
          {result.selection.subtopicName ? ` / ${result.selection.subtopicName}` : ""}
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Submitted {new Date(result.submittedAt).toLocaleString()}. This review lives only in your current browser session.
        </p>

        {result.grade ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Score</p>
              <p className="mt-3 text-4xl font-semibold text-slate-950">
                {result.grade.score}/{result.grade.total}
              </p>
            </div>
            <div className="rounded-3xl border border-sky-100 bg-sky-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">Percentage</p>
              <p className="mt-3 text-4xl font-semibold text-slate-950">{result.grade.percentage}%</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Mode</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">{result.config.type.replaceAll("_", " ")}</p>
            </div>
          </div>
        ) : null}
      </section>

      <section className="space-y-5">
        {result.questions.map((question, index) => {
          const review = breakdownMap.get(question.id);
          const userAnswer = result.answers[question.id] ?? "";

          return (
            <article key={question.id} className="glass-panel rounded-[1.75rem] border border-white/80 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                Question {index + 1} · {question.type.replaceAll("_", " ")}
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">{question.stem}</h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Your response</p>
                  <p className="mt-2 whitespace-pre-wrap text-slate-800">
                    {review?.submittedAnswer || userAnswer || "No answer submitted."}
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Reference answer</p>
                  <p className="mt-2 text-slate-800">{review?.correctAnswer ?? question.answer}</p>
                </div>
              </div>

              {review ? (
                <div
                  className={`mt-4 rounded-2xl px-4 py-3 text-sm font-medium ${
                    review.correct
                      ? "border border-emerald-100 bg-emerald-50 text-emerald-700"
                      : "border border-amber-100 bg-amber-50 text-amber-700"
                  }`}
                >
                  {review.correct ? "Marked correct." : "Marked incorrect."}
                </div>
              ) : null}

              {question.explanation ? (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                  {question.explanation}
                </div>
              ) : null}

              <div className="mt-4 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-600">
                Source trace: {question.sourceSnippet}
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
