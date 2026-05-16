"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, FileQuestion, LoaderCircle, Shuffle } from "lucide-react";
import { startTransition, useEffect, useState } from "react";

import { QUESTION_COUNT_OPTIONS, TIMER_OPTIONS } from "@/lib/constants";
import { toFriendlyError } from "@/lib/friendly-errors";

type CourseCard = {
  id: string;
  code: string;
  name: string;
  slug: string;
};

type TopicCard = {
  id: string;
  name: string;
  slug: string;
  childTopics: Array<{ id: string; name: string; slug: string }>;
};

type QuestionTypeAvailability = {
  availableTypes: Array<"MCQ" | "SHORT_ANSWER" | "THEORY">;
  counts: {
    MCQ: number;
    SHORT_ANSWER: number;
    THEORY: number;
  };
};

export function ExamClient({
  courses,
  topics,
  initialCourse,
  initialTopic,
  initialSubtopic,
}: {
  courses: CourseCard[];
  topics: TopicCard[];
  initialCourse?: string;
  initialTopic?: string;
  initialSubtopic?: string;
}) {
  const router = useRouter();
  const [courseSlug, setCourseSlug] = useState(initialCourse ?? courses[0]?.slug ?? "");
  const [topicSlug, setTopicSlug] = useState(initialTopic ?? topics[0]?.slug ?? "");
  const [subtopicSlug, setSubtopicSlug] = useState(initialSubtopic ?? "");
  const [type, setType] = useState<"MCQ" | "SHORT_ANSWER" | "THEORY" | "MIXED">("MCQ");
  const [count, setCount] = useState(12);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<QuestionTypeAvailability>({
    availableTypes: [],
    counts: { MCQ: 0, SHORT_ANSWER: 0, THEORY: 0 },
  });

  const selectedTopic = topics.find((topic) => topic.slug === topicSlug) ?? topics[0];
  const availableSubtopics = selectedTopic?.childTopics ?? [];
  const resolvedSubtopicSlug = availableSubtopics.some((subtopic) => subtopic.slug === subtopicSlug)
    ? subtopicSlug
    : "";

  // Fetch available question types when topic/subtopic changes
  useEffect(() => {
    async function fetchAvailability() {
      try {
        const params = new URLSearchParams({ topicSlug });
        if (resolvedSubtopicSlug) {
          params.set("subtopicSlug", resolvedSubtopicSlug);
        }

        const response = await fetch(`/api/topic-question-types?${params}`);
        const data = (await response.json()) as QuestionTypeAvailability;

        setAvailability(data);

        // Auto-select first available type if current type is not available
        if (type !== "MIXED" && !data.availableTypes.includes(type)) {
          if (data.availableTypes.length > 0) {
            setType(data.availableTypes[0]);
          }
        }
      } catch {
        setAvailability({
          availableTypes: [],
          counts: { MCQ: 0, SHORT_ANSWER: 0, THEORY: 0 },
        });
      }
    }

    void fetchAvailability();
  }, [topicSlug, resolvedSubtopicSlug]);

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

      // Store exam in sessionStorage and navigate to exam session page
      sessionStorage.setItem(
        "anatomiq:active-exam",
        JSON.stringify({
          ...data,
          config: {
            courseSlug,
            topicSlug,
            subtopicSlug: resolvedSubtopicSlug,
            type,
            count,
            durationMinutes,
          },
        }),
      );

      // Navigate to exam session page
      startTransition(() => {
        router.push("/exam-session");
      });
    } catch (requestError) {
      setError(toFriendlyError(requestError));
    } finally {
      setLoading(false);
    }
  }

  async function startRandomExam() {
    setLoading(true);
    setError(null);

    try {
      // Pick random course
      const randomCourse = courses[Math.floor(Math.random() * courses.length)];

      // Pick random topic
      const randomTopic = topics[Math.floor(Math.random() * topics.length)];

      // Pick random type
      const types: Array<"MCQ" | "SHORT_ANSWER" | "THEORY" | "MIXED"> = ["MCQ", "SHORT_ANSWER", "THEORY", "MIXED"];
      const randomType = types[Math.floor(Math.random() * types.length)];

      // Pick random count between 8 and 20
      const randomCount = Math.floor(Math.random() * 13) + 8;

      // Pick random timer
      const timerOptions = [0, 15, 30, 45, 60];
      const randomTimer = timerOptions[Math.floor(Math.random() * timerOptions.length)];

      const response = await fetch("/api/start-exam", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topicSlug: randomTopic.slug,
          subtopicSlug: undefined,
          type: randomType,
          count: randomCount,
          durationMinutes: randomTimer,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not start random exam.");
      }

      // Store exam in sessionStorage and navigate to exam session page
      sessionStorage.setItem(
        "anatomiq:active-exam",
        JSON.stringify({
          ...data,
          config: {
            courseSlug: randomCourse.slug,
            topicSlug: randomTopic.slug,
            subtopicSlug: undefined,
            type: randomType,
            count: randomCount,
            durationMinutes: randomTimer,
          },
        }),
      );

      // Navigate to exam session page
      startTransition(() => {
        router.push("/exam-session");
      });
    } catch (requestError) {
      setError(toFriendlyError(requestError));
    } finally {
      setLoading(false);
    }
  }

  const isMixedModeAvailable = availability.availableTypes.length > 1;

  // Check if all required fields are selected
  const isFormValid = courseSlug && topicSlug && type && count > 0;

  return (
    <div suppressHydrationWarning className="space-y-8">
      <section className="glass-panel rounded-[2rem] border border-white/80 p-6 shadow-[0_20px_70px_rgba(31,78,126,0.1)] sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">Exam mode</p>
            <h1 className="display-title mt-2 text-4xl text-slate-950 sm:text-5xl">
              Build a topic-grounded exam in seconds
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Questions are generated only from processed course materials and never tied to student accounts.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Course</span>
            <select
              value={courseSlug}
              onChange={(event) => setCourseSlug(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none"
            >
              {courses.map((course) => (
                <option key={course.id} value={course.slug}>
                  {course.code} - {course.name}
                </option>
              ))}
            </select>
          </label>

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
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="MCQ" disabled={!availability.availableTypes.includes("MCQ")}>
                MCQ {availability.counts.MCQ > 0 ? `(${availability.counts.MCQ})` : "(0)"}
              </option>
              <option value="SHORT_ANSWER" disabled={!availability.availableTypes.includes("SHORT_ANSWER")}>
                Short answer {availability.counts.SHORT_ANSWER > 0 ? `(${availability.counts.SHORT_ANSWER})` : "(0)"}
              </option>
              <option value="THEORY" disabled={!availability.availableTypes.includes("THEORY")}>
                Theory {availability.counts.THEORY > 0 ? `(${availability.counts.THEORY})` : "(0)"}
              </option>
              <option value="MIXED" disabled={!isMixedModeAvailable}>
                Mixed mode {isMixedModeAvailable ? "" : "(Requires 2+ types)"}
              </option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Questions</span>
            <select
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none"
            >
              {QUESTION_COUNT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Timer</span>
            <select
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(Number(event.target.value))}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none"
              aria-label="Exam timer"
            >
              {TIMER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              onClick={() => void startExam()}
              disabled={loading || !isFormValid}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#0969da] to-[#0ca678] px-6 py-4 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <FileQuestion className="h-5 w-5" />}
              {loading ? "Building exam..." : "Generate exam"}
            </button>

            <button
              onClick={() => void startRandomExam()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white border-2 border-[#0969da] px-6 py-4 text-sm font-semibold text-[#0969da] shadow-md hover:bg-[#f0f6ff] hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Shuffle className="h-5 w-5" />}
              {loading ? "Randomizing..." : "Randomize exam"}
            </button>

            <Link href="/topics" className="text-sm font-semibold text-sky-700 hover:text-sky-800">
              Need a better topic fit? Open explorer
            </Link>
          </div>

          {!isFormValid && !loading && (
            <p className="text-sm text-slate-500">
              Please select all fields to generate an exam
            </p>
          )}
        </div>

        {error ? (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}
      </section>
    </div>
  );
}
