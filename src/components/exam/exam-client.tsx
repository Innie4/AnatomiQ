"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Building2, CheckCircle2, FileQuestion, LoaderCircle, Search, Shuffle } from "lucide-react";
import { startTransition, useEffect, useMemo, useState } from "react";

import { QUESTION_COUNT_OPTIONS, TIMER_OPTIONS } from "@/lib/constants";
import { toFriendlyError } from "@/lib/friendly-errors";

type CourseCard = {
  id: string;
  code: string;
  name: string;
  slug: string;
  department: string;
  materialCount: number;
  readyMaterialCount: number;
  topics: Array<{
    id: string;
    name: string;
    slug: string;
    materialCount: number;
    childTopics: Array<{ id: string; name: string; slug: string; materialCount: number }>;
  }>;
};

type QuestionTypeAvailability = {
  availableTypes: Array<"MCQ" | "SHORT_ANSWER" | "THEORY">;
  counts: {
    MCQ: number;
    SHORT_ANSWER: number;
    THEORY: number;
  };
};

function randomIndex(length: number) {
  if (length <= 1) {
    return 0;
  }

  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0] % length;
}

export function ExamClient({
  courses,
  initialCourse,
  initialTopic,
  initialSubtopic,
}: {
  courses: CourseCard[];
  initialCourse?: string;
  initialTopic?: string;
  initialSubtopic?: string;
}) {
  const router = useRouter();
  const departments = useMemo(
    () => Array.from(new Set(courses.map((course) => course.department))).sort((a, b) => a.localeCompare(b)),
    [courses],
  );
  const initialSelectedCourse = courses.find((course) => course.slug === initialCourse) ?? courses[0] ?? null;
  const [department, setDepartment] = useState(initialSelectedCourse?.department ?? departments[0] ?? "");
  const [courseSlug, setCourseSlug] = useState(initialSelectedCourse?.slug ?? "");
  const [courseSearchInput, setCourseSearchInput] = useState("");
  const [activeCourseSearch, setActiveCourseSearch] = useState("");
  const [topicSlug, setTopicSlug] = useState(initialTopic ?? initialSelectedCourse?.topics[0]?.slug ?? "");
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

  const hasExamCatalog = courses.length > 0;
  const filteredCourses = useMemo(
    () =>
      courses.filter((course) => {
        const search = activeCourseSearch.trim().toLowerCase();
        const matchesDepartment = course.department === department;
        const matchesSearch = search
          ? `${course.code} ${course.name} ${course.department}`.toLowerCase().includes(search)
          : true;

        return matchesDepartment && matchesSearch;
      }),
    [activeCourseSearch, courses, department],
  );
  const selectedCourse = courses.find((course) => course.slug === courseSlug) ?? filteredCourses[0] ?? null;
  const topics = selectedCourse?.topics ?? [];
  const selectedTopic = topics.find((topic) => topic.slug === topicSlug) ?? topics[0] ?? null;
  const availableSubtopics = selectedTopic?.childTopics ?? [];
  const resolvedSubtopicSlug = availableSubtopics.some((subtopic) => subtopic.slug === subtopicSlug)
    ? subtopicSlug
    : "";
  const isMixedModeAvailable = availability.availableTypes.length > 1;
  const isFormValid = Boolean(hasExamCatalog && selectedCourse && topicSlug && type && count > 0);

  useEffect(() => {
    const departmentHasCourse = courses.some((course) => course.department === department);
    if (!departmentHasCourse && departments[0]) {
      setDepartment(departments[0]);
    }
  }, [courses, department, departments]);

  useEffect(() => {
    const course = courses.find((item) => item.slug === courseSlug);
    if (course?.department === department) {
      return;
    }

    const nextCourse = filteredCourses[0] ?? null;
    setCourseSlug(nextCourse?.slug ?? "");
    setTopicSlug(nextCourse?.topics[0]?.slug ?? "");
    setSubtopicSlug("");
  }, [activeCourseSearch, courseSlug, department, filteredCourses, courses]);

  useEffect(() => {
    const course = courses.find((item) => item.slug === courseSlug);
    const nextTopic = course?.topics.find((topic) => topic.slug === topicSlug) ?? course?.topics[0] ?? null;
    setTopicSlug(nextTopic?.slug ?? "");
    setSubtopicSlug("");
  }, [courseSlug, courses, topicSlug]);

  useEffect(() => {
    async function fetchAvailability() {
      if (!topicSlug) {
        setAvailability({
          availableTypes: [],
          counts: { MCQ: 0, SHORT_ANSWER: 0, THEORY: 0 },
        });
        return;
      }

      try {
        const params = new URLSearchParams({ topicSlug });
        if (resolvedSubtopicSlug) {
          params.set("subtopicSlug", resolvedSubtopicSlug);
        }

        const response = await fetch(`/api/topic-question-types?${params}`);
        const data = (await response.json()) as QuestionTypeAvailability;

        setAvailability(data);

        if (type !== "MIXED" && !data.availableTypes.includes(type) && data.availableTypes.length > 0) {
          setType(data.availableTypes[0]);
        }
      } catch {
        setAvailability({
          availableTypes: [],
          counts: { MCQ: 0, SHORT_ANSWER: 0, THEORY: 0 },
        });
      }
    }

    void fetchAvailability();
  }, [topicSlug, resolvedSubtopicSlug, type]);

  function selectCourse(course: CourseCard) {
    setCourseSlug(course.slug);
    setTopicSlug(course.topics[0]?.slug ?? "");
    setSubtopicSlug("");
    setError(null);
  }

  async function startExam() {
    if (!isFormValid || !selectedCourse) {
      setError("Choose a department, course, and topic before generating an exam.");
      return;
    }

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

      sessionStorage.setItem(
        "anatomiq:active-exam",
        JSON.stringify({
          ...data,
          config: {
            courseSlug: selectedCourse.slug,
            department,
            topicSlug,
            subtopicSlug: resolvedSubtopicSlug,
            type,
            count,
            durationMinutes,
          },
        }),
      );

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
    const pool = filteredCourses.filter((course) => course.topics.length > 0);
    if (!pool.length) {
      setError("No processed material is available for this department or search.");
      return;
    }

    const randomCourse = pool[randomIndex(pool.length)];
    const randomTopic = randomCourse.topics[randomIndex(randomCourse.topics.length)];
    const types: Array<"MCQ" | "SHORT_ANSWER" | "THEORY" | "MIXED"> = ["MCQ", "SHORT_ANSWER", "THEORY", "MIXED"];
    const randomType = types[randomIndex(types.length)];
    const randomCount = randomIndex(13) + 8;
    const timerOptions = [0, 15, 30, 45, 60];
    const randomTimer = timerOptions[randomIndex(timerOptions.length)];

    setDepartment(randomCourse.department);
    setCourseSlug(randomCourse.slug);
    setTopicSlug(randomTopic.slug);
    setSubtopicSlug("");
    setType(randomType);
    setCount(randomCount);
    setDurationMinutes(randomTimer);
    setLoading(true);
    setError(null);

    try {
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

      sessionStorage.setItem(
        "anatomiq:active-exam",
        JSON.stringify({
          ...data,
          config: {
            courseSlug: randomCourse.slug,
            department: randomCourse.department,
            topicSlug: randomTopic.slug,
            subtopicSlug: undefined,
            type: randomType,
            count: randomCount,
            durationMinutes: randomTimer,
          },
        }),
      );

      startTransition(() => {
        router.push("/exam-session");
      });
    } catch (requestError) {
      setError(toFriendlyError(requestError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div suppressHydrationWarning className="w-full space-y-8">
      <section className="glass-panel rounded-[2rem] border border-white/80 p-6 shadow-[0_20px_70px_rgba(31,78,126,0.1)] sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">Exam mode</p>
            <h1 className="display-title mt-2 text-4xl text-slate-950 sm:text-5xl">
              Choose your department, then your course
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              ANATOMIQ now narrows exams by department and course before revealing topic controls.
            </p>
          </div>
        </div>

        {!hasExamCatalog ? (
          <div className="mt-8 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            No processed course material is available for exams yet. Upload and process material from the dashboard to populate departments, courses, and topics.
          </div>
        ) : null}

        <div className="mt-8 space-y-8">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              <Building2 className="h-4 w-4" />
              Department
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {departments.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setDepartment(item);
                    setActiveCourseSearch("");
                    setCourseSearchInput("");
                  }}
                  className={`min-h-16 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition-all ${
                    item === department
                      ? "border-[#0969da] bg-[#0969da] text-white shadow-lg"
                      : "border-slate-200 bg-white text-slate-700 hover:border-sky-200 hover:bg-sky-50"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Courses</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-950">{department || "Select a department"}</h2>
              </div>
              <form
                className="flex w-full gap-2 lg:max-w-md"
                onSubmit={(event) => {
                  event.preventDefault();
                  setActiveCourseSearch(courseSearchInput);
                }}
              >
                <input
                  value={courseSearchInput}
                  onChange={(event) => setCourseSearchInput(event.target.value)}
                  className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#0969da] focus:ring-2 focus:ring-[#0969da]/20"
                  placeholder="Search course code or name"
                  aria-label="Search courses"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-white"
                  aria-label="Search courses"
                >
                  <Search className="h-5 w-5" />
                </button>
              </form>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filteredCourses.map((course) => {
                const active = course.slug === selectedCourse?.slug;

                return (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => selectCourse(course)}
                    className={`min-h-32 rounded-2xl border p-5 text-left transition-all ${
                      active
                        ? "border-[#0ca678] bg-emerald-50 shadow-lg"
                        : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold uppercase tracking-[0.14em] text-sky-700">{course.code}</p>
                        <h3 className="mt-2 text-lg font-semibold text-slate-950">{course.name}</h3>
                      </div>
                      {active ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : null}
                    </div>
                    <p className="mt-4 text-sm text-slate-500">
                      {course.topics.length} topic{course.topics.length === 1 ? "" : "s"} · {course.readyMaterialCount} ready material{course.readyMaterialCount === 1 ? "" : "s"}
                    </p>
                  </button>
                );
              })}
            </div>

            {filteredCourses.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
                No courses match this department and search.
              </div>
            ) : null}
          </div>

          {selectedCourse ? (
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                <div className="space-y-2 xl:col-span-2">
                  <label htmlFor="exam-topic" className="block text-sm font-semibold text-slate-700">Topic</label>
                  <select
                    id="exam-topic"
                    value={topicSlug}
                    onChange={(event) => setTopicSlug(event.target.value)}
                    className="w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none"
                  >
                    {topics.map((topic) => (
                      <option key={topic.id} value={topic.slug}>
                        {topic.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 xl:col-span-2">
                  <label htmlFor="exam-subtopic" className="block text-sm font-semibold text-slate-700">Subtopic</label>
                  <select
                    id="exam-subtopic"
                    value={resolvedSubtopicSlug}
                    onChange={(event) => setSubtopicSlug(event.target.value)}
                    className="w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none"
                  >
                    <option value="">All subtopics</option>
                    {availableSubtopics.map((subtopic) => (
                      <option key={subtopic.id} value={subtopic.slug}>
                        {subtopic.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 xl:col-span-2">
                  <label htmlFor="exam-type" className="block text-sm font-semibold text-slate-700">Question type</label>
                  <select
                    id="exam-type"
                    value={type}
                    onChange={(event) => setType(event.target.value as typeof type)}
                    className="w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none"
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
                </div>

                <div className="space-y-2 xl:col-span-3">
                  <label htmlFor="exam-question-count" className="block text-sm font-semibold text-slate-700">Question number</label>
                  <select
                    id="exam-question-count"
                    value={count}
                    onChange={(event) => setCount(Number(event.target.value))}
                    className="w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none"
                  >
                    {QUESTION_COUNT_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 xl:col-span-3">
                  <label htmlFor="exam-timer" className="block text-sm font-semibold text-slate-700">Timer</label>
                  <select
                    id="exam-timer"
                    value={durationMinutes}
                    onChange={(event) => setDurationMinutes(Number(event.target.value))}
                    className="w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none"
                    aria-label="Exam timer"
                  >
                    {TIMER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  onClick={() => void startExam()}
                  disabled={loading || !isFormValid}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#0969da] to-[#0ca678] px-6 py-4 text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none"
                >
                  {loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <FileQuestion className="h-5 w-5" />}
                  {loading ? "Building exam..." : "Generate exam"}
                </button>

                <button
                  onClick={() => void startRandomExam()}
                  disabled={loading || !filteredCourses.length}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-[#0969da] bg-white px-6 py-4 text-sm font-semibold text-[#0969da] shadow-md transition-all hover:scale-[1.02] hover:bg-[#f0f6ff] hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none"
                >
                  {loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Shuffle className="h-5 w-5" />}
                  {loading ? "Randomizing..." : "Randomize exam"}
                </button>

                <Link href="/topics" className="text-sm font-semibold text-sky-700 hover:text-sky-800">
                  Open topic explorer
                </Link>
              </div>
            </div>
          ) : null}
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
