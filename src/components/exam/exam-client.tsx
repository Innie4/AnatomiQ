"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Clock3, FileQuestion, LoaderCircle } from "lucide-react";
import { startTransition, useEffect, useEffectEvent, useState } from "react";

type TopicCard = {
  id: string;
  name: string;
  slug: string;
  childTopics: Array<{ id: string; name: string; slug: string }>;
};

type ExamQuestion = {
  id: string;
  type: "MCQ" | "SHORT_ANSWER" | "THEORY";
  stem: string;
  options: string[] | null;
  difficulty: string;
  sourceSnippet: string;
  answer: string;
  explanation?: string | null;
};

type ExamResponse = {
  selection: {
    topicName: string;
    subtopicName?: string | null;
  };
  questions: ExamQuestion[];
};

type GradeResponse = {
  score: number;
  total: number;
  percentage: number;
  breakdown: Array<{
    questionId: string;
    selectedOption: string;
    correctAnswer: string;
    correct: boolean;
    explanation?: string | null;
    sourceSnippet: string;
  }>;
};

export function ExamClient({
  topics,
  initialTopic,
  initialSubtopic,
}: {
  topics: TopicCard[];
  initialTopic?: string;
  initialSubtopic?: string;
}) {
  const router = useRouter();
  const [topicSlug, setTopicSlug] = useState(initialTopic ?? topics[0]?.slug ?? "");
  const [subtopicSlug, setSubtopicSlug] = useState(initialSubtopic ?? "");
  const [type, setType] = useState<"MCQ" | "SHORT_ANSWER" | "THEORY" | "MIXED">("MIXED");
  const [count, setCount] = useState(12);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exam, setExam] = useState<ExamResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const selectedTopic = topics.find((topic) => topic.slug === topicSlug) ?? topics[0];
  const availableSubtopics = selectedTopic?.childTopics ?? [];
  const resolvedSubtopicSlug = availableSubtopics.some((subtopic) => subtopic.slug === subtopicSlug)
    ? subtopicSlug
    : "";
  const formattedTimer =
    timeLeft === null
      ? null
      : `${String(Math.floor(timeLeft / 60)).padStart(2, "0")}:${String(timeLeft % 60).padStart(2, "0")}`;

  const autoSubmit = useEffectEvent(async () => {
    if (!exam || submitting) {
      return;
    }

    await handleSubmitExam(true);
  });

  useEffect(() => {
    if (timeLeft === null) {
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (typeof current !== "number") {
          return current;
        }

        if (current <= 1) {
          window.clearInterval(timer);
          void autoSubmit();
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [timeLeft]);

  async function startExam() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/start-exam", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topicSlug,
          subtopicSlug: resolvedSubtopicSlug || undefined,
          type,
          count,
          durationMinutes,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not start exam.");
      }

      setExam(data);
      setAnswers({});
      setTimeLeft(durationMinutes > 0 ? durationMinutes * 60 : null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not start exam.");
    } finally {
      setLoading(false);
    }
  }

  function setAnswer(questionId: string, value: string) {
    setAnswers((current) => ({
      ...current,
      [questionId]: value,
    }));
  }

  async function handleSubmitExam(timedOut = false) {
    if (!exam) {
      return;
    }

    setSubmitting(true);

    try {
      const mcqAnswers = exam.questions
        .filter((question) => question.type === "MCQ")
        .map((question) => ({
          questionId: question.id,
          selectedOption: answers[question.id] ?? "",
        }));

      let grade: GradeResponse | null = null;

      if (mcqAnswers.length) {
        const gradeResponse = await fetch("/api/grade-mcq", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ answers: mcqAnswers }),
        });
        const gradePayload = await gradeResponse.json();

        if (!gradeResponse.ok) {
          throw new Error(gradePayload.error || "Could not grade the MCQ section.");
        }

        grade = gradePayload;
      }

      sessionStorage.setItem(
        "anatomiq:last-result",
        JSON.stringify({
          submittedAt: new Date().toISOString(),
          timedOut,
          config: {
            topicSlug,
            subtopicSlug: resolvedSubtopicSlug,
            type,
            count,
            durationMinutes,
          },
          selection: exam.selection,
          questions: exam.questions,
          answers,
          grade,
        }),
      );

      startTransition(() => {
        router.push("/results");
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not submit exam.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div suppressHydrationWarning className="space-y-8">
      <section className="glass-panel rounded-[2rem] border border-white/80 p-6 shadow-[0_20px_70px_rgba(31,78,126,0.1)] sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">Exam mode</p>
            <h1 className="display-title mt-2 text-4xl text-slate-950 sm:text-5xl">
              Build a grounded anatomy exam in seconds
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Questions are generated only from processed Human Anatomy materials and never tied to student accounts.
            </p>
          </div>
          {formattedTimer ? (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-emerald-700">
              <Clock3 className="h-5 w-5" />
              <span className="font-mono text-lg font-semibold">{formattedTimer}</span>
            </div>
          ) : null}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Topic</span>
            <select
              value={topicSlug}
              onChange={(event) => setTopicSlug(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none"
            >
              {topics.map((topic) => (
                <option key={topic.id} value={topic.slug}>
                  {topic.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Subtopic</span>
            <select
              value={resolvedSubtopicSlug}
              onChange={(event) => setSubtopicSlug(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none"
            >
              <option value="">All subtopics</option>
              {availableSubtopics.map((subtopic) => (
                <option key={subtopic.id} value={subtopic.slug}>
                  {subtopic.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Question type</span>
            <select
              value={type}
              onChange={(event) => setType(event.target.value as typeof type)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none"
            >
              <option value="MCQ">MCQ</option>
              <option value="SHORT_ANSWER">Short answer</option>
              <option value="THEORY">Theory</option>
              <option value="MIXED">Mixed mode</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Questions</span>
            <input
              type="number"
              min={1}
              max={30}
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Timer (minutes)</span>
            <input
              type="number"
              min={0}
              max={180}
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(Number(event.target.value))}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none"
            />
          </label>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            onClick={() => void startExam()}
            disabled={loading || !topicSlug}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#2d8cff,#18b08f)] px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-cyan-200/60 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <FileQuestion className="h-5 w-5" />}
            {loading ? "Building exam..." : "Generate exam"}
          </button>
          <Link href="/topics" className="text-sm font-semibold text-sky-700 hover:text-sky-800">
            Need a better topic fit? Open explorer
          </Link>
        </div>

        {error ? (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}
      </section>

      {exam ? (
        <section className="space-y-5">
          <div className="glass-panel rounded-[2rem] border border-white/80 p-6">
            <h2 className="text-2xl font-semibold text-slate-950">
              {exam.selection.topicName}
              {exam.selection.subtopicName ? ` / ${exam.selection.subtopicName}` : ""}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {exam.questions.length} questions ready. Answers stay in your current browser session only.
            </p>
          </div>

          {exam.questions.map((question, index) => (
            <article key={question.id} className="glass-panel rounded-[1.75rem] border border-white/80 p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Question {index + 1} · {question.type.replaceAll("_", " ")}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-950">{question.stem}</h3>
                </div>
                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
                  {question.difficulty}
                </span>
              </div>

              {question.type === "MCQ" ? (
                <div className="mt-5 grid gap-3">
                  {question.options?.map((option) => (
                    <label
                      key={option}
                      className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 hover:border-sky-200 hover:bg-sky-50/50"
                    >
                      <input
                        type="radio"
                        name={question.id}
                        checked={answers[question.id] === option}
                        onChange={() => setAnswer(question.id, option)}
                      />
                      <span className="text-slate-700">{option}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <textarea
                  value={answers[question.id] ?? ""}
                  onChange={(event) => setAnswer(question.id, event.target.value)}
                  rows={question.type === "THEORY" ? 7 : 4}
                  placeholder={
                    question.type === "THEORY"
                      ? "Write your structured theory response..."
                      : "Write a concise answer..."
                  }
                  className="mt-5 w-full rounded-[1.5rem] border border-slate-200 bg-white/90 px-4 py-4 text-slate-900 outline-none placeholder:text-slate-400"
                />
              )}

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                Source trace: {question.sourceSnippet}
              </div>
            </article>
          ))}

          <div className="flex justify-end">
            <button
              onClick={() => void handleSubmitExam(false)}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-semibold text-white hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? <LoaderCircle className="h-5 w-5 animate-spin" /> : null}
              Submit exam
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
