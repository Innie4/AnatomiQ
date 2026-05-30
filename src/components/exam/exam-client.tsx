"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  FileQuestion,
  Layers3,
  LoaderCircle,
  Search,
  Target,
  Trophy,
  X,
} from "lucide-react";
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

type DepartmentCard = {
  name: string;
  courseCount: number;
  topicCount: number;
  readyMaterialCount: number;
  bg: string;
  text: string;
  ring: string;
  shape: string;
};

const departmentStyles = [
  {
    bg: "from-teal-50 via-white to-cyan-50",
    text: "text-teal-950",
    ring: "border-teal-200 hover:border-teal-400 hover:shadow-teal-100",
    shape: "bg-teal-500",
  },
  {
    bg: "from-rose-50 via-white to-pink-50",
    text: "text-rose-950",
    ring: "border-rose-200 hover:border-rose-400 hover:shadow-rose-100",
    shape: "bg-rose-500",
  },
  {
    bg: "from-violet-50 via-white to-fuchsia-50",
    text: "text-violet-950",
    ring: "border-violet-200 hover:border-violet-400 hover:shadow-violet-100",
    shape: "bg-violet-500",
  },
  {
    bg: "from-amber-50 via-white to-yellow-50",
    text: "text-amber-950",
    ring: "border-amber-200 hover:border-amber-400 hover:shadow-amber-100",
    shape: "bg-amber-500",
  },
  {
    bg: "from-blue-50 via-white to-sky-50",
    text: "text-blue-950",
    ring: "border-blue-200 hover:border-blue-400 hover:shadow-blue-100",
    shape: "bg-blue-500",
  },
  {
    bg: "from-emerald-50 via-white to-lime-50",
    text: "text-emerald-950",
    ring: "border-emerald-200 hover:border-emerald-400 hover:shadow-emerald-100",
    shape: "bg-emerald-500",
  },
  {
    bg: "from-orange-50 via-white to-red-50",
    text: "text-orange-950",
    ring: "border-orange-200 hover:border-orange-400 hover:shadow-orange-100",
    shape: "bg-orange-500",
  },
  {
    bg: "from-cyan-50 via-white to-indigo-50",
    text: "text-cyan-950",
    ring: "border-cyan-200 hover:border-cyan-400 hover:shadow-cyan-100",
    shape: "bg-cyan-500",
  },
];

const steps = [
  { id: 1, label: "Course", icon: BookOpenCheck },
  { id: 2, label: "Topic", icon: Target },
  { id: 3, label: "Format", icon: Layers3 },
  { id: 4, label: "Launch", icon: Trophy },
] as const;

function typeLabel(value: "MCQ" | "SHORT_ANSWER" | "THEORY" | "MIXED") {
  switch (value) {
    case "SHORT_ANSWER":
      return "Short answer";
    case "THEORY":
      return "Theory";
    case "MIXED":
      return "Mixed mode";
    default:
      return "MCQ";
  }
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
  const inferredCourse =
    courses.find((course) => course.slug === initialCourse) ??
    courses.find((course) => course.topics.some((topic) => topic.slug === initialTopic)) ??
    null;
  const initialDepartment = inferredCourse?.department ?? "";
  const initialStep = inferredCourse ? 2 : 1;
  const [department, setDepartment] = useState(initialDepartment);
  const [courseSlug, setCourseSlug] = useState(inferredCourse?.slug ?? "");
  const [courseSearch, setCourseSearch] = useState("");
  const [topicSlug, setTopicSlug] = useState(initialTopic ?? inferredCourse?.topics[0]?.slug ?? "");
  const [subtopicSlug, setSubtopicSlug] = useState(initialSubtopic ?? "");
  const [type, setType] = useState<"MCQ" | "SHORT_ANSWER" | "THEORY" | "MIXED">("MCQ");
  const [count, setCount] = useState(12);
  const [durationMinutes, setDurationMinutes] = useState<number | "">("");
  const [step, setStep] = useState(initialStep);
  const [isModalOpen, setIsModalOpen] = useState(Boolean(inferredCourse));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<QuestionTypeAvailability>({
    availableTypes: [],
    counts: { MCQ: 0, SHORT_ANSWER: 0, THEORY: 0 },
  });

  const hasExamCatalog = courses.length > 0;
  const departmentCards = useMemo<DepartmentCard[]>(() => {
    const grouped = new Map<string, CourseCard[]>();

    for (const course of courses) {
      const current = grouped.get(course.department) ?? [];
      current.push(course);
      grouped.set(course.department, current);
    }

    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, departmentCourses], index) => {
        const style = departmentStyles[index % departmentStyles.length];
        return {
          name,
          courseCount: departmentCourses.length,
          topicCount: departmentCourses.reduce((total, course) => total + course.topics.length, 0),
          readyMaterialCount: departmentCourses.reduce((total, course) => total + course.readyMaterialCount, 0),
          ...style,
        };
      });
  }, [courses]);

  const filteredCourses = useMemo(() => {
    const search = courseSearch.trim().toLowerCase();

    return courses.filter((course) => {
      const matchesDepartment = course.department === department;
      const matchesSearch = search
        ? `${course.code} ${course.name} ${course.department}`.toLowerCase().includes(search)
        : true;

      return matchesDepartment && matchesSearch;
    });
  }, [courseSearch, courses, department]);
  const selectedCourse = filteredCourses.find((course) => course.slug === courseSlug) ?? null;
  const topics = selectedCourse?.topics ?? [];
  const selectedTopic = topics.find((topic) => topic.slug === topicSlug) ?? topics[0] ?? null;
  const availableSubtopics = selectedTopic?.childTopics ?? [];
  const resolvedSubtopicSlug = availableSubtopics.some((subtopic) => subtopic.slug === subtopicSlug)
    ? subtopicSlug
    : "";
  const isMixedModeAvailable = availability.availableTypes.length > 1;
  const hasTimer = typeof durationMinutes === "number" && durationMinutes > 0;
  const isFormValid = Boolean(hasExamCatalog && selectedCourse && selectedTopic && type && count > 0 && hasTimer);

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }

    if (!filteredCourses.some((course) => course.slug === courseSlug)) {
      setCourseSlug("");
      setTopicSlug("");
      setSubtopicSlug("");
      setStep(1);
    }
  }, [courseSlug, filteredCourses, isModalOpen]);

  useEffect(() => {
    if (!selectedCourse) {
      return;
    }

    const nextTopic = selectedCourse.topics.find((topic) => topic.slug === topicSlug) ?? selectedCourse.topics[0] ?? null;
    setTopicSlug(nextTopic?.slug ?? "");
    setSubtopicSlug((current) =>
      nextTopic?.childTopics.some((subtopic) => subtopic.slug === current) ? current : "",
    );
  }, [selectedCourse, topicSlug]);

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

  function openDepartment(nextDepartment: string) {
    setDepartment(nextDepartment);
    setCourseSlug("");
    setCourseSearch("");
    setTopicSlug("");
    setSubtopicSlug("");
    setError(null);
    setStep(1);
    setIsModalOpen(true);
  }

  function selectCourse(course: CourseCard) {
    setCourseSlug(course.slug);
    setTopicSlug(course.topics[0]?.slug ?? "");
    setSubtopicSlug("");
    setError(null);
    setStep(2);
  }

  function goNext() {
    if (step === 1 && !selectedCourse) {
      setError("Choose an uploaded course before moving on.");
      return;
    }

    if (step === 2 && !selectedTopic) {
      setError("Choose a topic before choosing the exam format.");
      return;
    }

    setError(null);
    setStep((current) => Math.min(4, current + 1));
  }

  function goBack() {
    setError(null);
    setStep((current) => Math.max(1, current - 1));
  }

  async function startExamWithConfig(config: {
    course: CourseCard;
    topicSlug: string;
    subtopicSlug?: string;
    type: "MCQ" | "SHORT_ANSWER" | "THEORY" | "MIXED";
    count: number;
    durationMinutes: number;
  }) {
    if (!config.course || !config.topicSlug) {
      setError("Choose a course and topic before generating an exam.");
      return;
    }

    if (config.durationMinutes <= 0) {
      setError("Choose a timer before generating an exam.");
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
          topicSlug: config.topicSlug,
          subtopicSlug: config.subtopicSlug || undefined,
          type: config.type,
          count: config.count,
          durationMinutes: config.durationMinutes,
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
            courseSlug: config.course.slug,
            department: config.course.department,
            topicSlug: config.topicSlug,
            subtopicSlug: config.subtopicSlug,
            type: config.type,
            count: config.count,
            durationMinutes: config.durationMinutes,
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

  async function startExam() {
    if (!selectedCourse || !selectedTopic) {
      setError("Choose a course and topic before generating an exam.");
      return;
    }

    if (!hasTimer) {
      setError("Choose a timer before generating an exam.");
      return;
    }

    await startExamWithConfig({
      course: selectedCourse,
      topicSlug,
      subtopicSlug: resolvedSubtopicSlug || undefined,
      type,
      count,
      durationMinutes,
    });
  }

  return (
    <div suppressHydrationWarning className="w-full space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white px-5 py-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:px-8 lg:px-10">
        <div
          className="absolute -right-10 top-8 h-40 w-56 rotate-6 bg-sky-100"
          style={{ clipPath: "polygon(0 18%, 100% 0, 82% 100%, 12% 78%)" }}
        />
        <div
          className="absolute -left-16 bottom-4 h-36 w-64 -rotate-6 bg-emerald-100"
          style={{ clipPath: "polygon(12% 0, 100% 18%, 76% 100%, 0 82%)" }}
        />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">Exam mode</p>
            <h1 className="display-title mt-2 max-w-3xl text-4xl text-slate-950 sm:text-5xl">
              Pick your department arena
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Courses appear only after material has been uploaded and processed for that department.
            </p>
          </div>
          <Link href="/topics" className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700 hover:text-sky-900">
            Open topic explorer
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {!hasExamCatalog ? (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No processed course material is available for exams yet. Upload and process material from the dashboard to populate departments, courses, and topics.
        </div>
      ) : null}

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {departmentCards.map((card, index) => (
          <button
            key={card.name}
            type="button"
            onClick={() => openDepartment(card.name)}
            className={`group relative min-h-56 overflow-hidden rounded-2xl border bg-gradient-to-br ${card.bg} p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl ${card.ring}`}
          >
            <div
              className={`absolute right-0 top-0 h-24 w-36 opacity-90 ${card.shape}`}
              style={{ clipPath: index % 2 === 0 ? "polygon(24% 0, 100% 0, 100% 100%, 0 72%)" : "polygon(0 0, 100% 0, 76% 100%, 16% 76%)" }}
            />
            <div
              className="absolute bottom-4 right-5 h-16 w-28 border-2 border-white/70 opacity-70"
              style={{ clipPath: "polygon(0 20%, 80% 0, 100% 70%, 20% 100%)" }}
            />
            <div className="relative flex h-full min-h-44 flex-col justify-between">
              <div>
                <h2 className={`text-2xl font-black ${card.text}`}>{card.name}</h2>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-white/75 px-2 py-3">
                  <p className="text-lg font-black text-slate-950">{card.courseCount}</p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Courses</p>
                </div>
                <div className="rounded-xl bg-white/75 px-2 py-3">
                  <p className="text-lg font-black text-slate-950">{card.topicCount}</p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Topics</p>
                </div>
                <div className="rounded-xl bg-white/75 px-2 py-3">
                  <p className="text-lg font-black text-slate-950">{card.readyMaterialCount}</p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Ready</p>
                </div>
              </div>
            </div>
          </button>
        ))}
      </section>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="exam-wizard-title"
            className="relative max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_120px_rgba(15,23,42,0.35)]"
          >
            <div
              className="absolute left-0 top-0 h-28 w-52 bg-sky-100"
              style={{ clipPath: "polygon(0 0, 100% 0, 70% 100%, 0 72%)" }}
            />
            <div
              className="absolute bottom-0 right-0 h-32 w-64 bg-emerald-100"
              style={{ clipPath: "polygon(32% 0, 100% 24%, 100% 100%, 0 100%)" }}
            />

            <div className="relative flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-7">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-700">{department}</p>
                <h2 id="exam-wizard-title" className="mt-1 text-2xl font-black text-slate-950">
                  Build your exam quest
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setError(null);
                }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                aria-label="Close exam setup"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative max-h-[calc(92vh-88px)] overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
              <div className="grid gap-2 sm:grid-cols-4">
                {steps.map((item) => {
                  const StepIcon = item.icon;
                  const active = step === item.id;
                  const complete = step > item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (item.id === 1 || selectedCourse) {
                          setStep(item.id);
                          setError(null);
                        }
                      }}
                      className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-left text-sm font-bold ${
                        active
                          ? "border-sky-300 bg-sky-50 text-sky-950"
                          : complete
                            ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                            : "border-slate-200 bg-white text-slate-500"
                      }`}
                    >
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm">
                        {complete ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <StepIcon className="h-5 w-5" />}
                      </span>
                      {item.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 min-h-[24rem]">
                {step === 1 ? (
                  <div className="space-y-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Stage one</p>
                        <h3 className="mt-1 text-2xl font-black text-slate-950">Pick an uploaded course</h3>
                      </div>
                      <div className="relative w-full lg:max-w-sm">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <input
                          value={courseSearch}
                          onChange={(event) => setCourseSearch(event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm outline-none"
                          placeholder="Search course code or name"
                          aria-label="Search courses"
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      {filteredCourses.map((course) => {
                        const active = course.slug === selectedCourse?.slug;

                        return (
                          <button
                            key={course.id}
                            type="button"
                            onClick={() => selectCourse(course)}
                            className={`relative min-h-36 overflow-hidden rounded-2xl border p-5 text-left transition-all ${
                              active
                                ? "border-emerald-300 bg-emerald-50 shadow-lg"
                                : "border-slate-200 bg-white hover:border-sky-200 hover:bg-sky-50/70"
                            }`}
                          >
                            <div
                              className="absolute right-0 top-0 h-16 w-28 bg-sky-100"
                              style={{ clipPath: "polygon(20% 0, 100% 0, 82% 100%, 0 76%)" }}
                            />
                            <div className="relative flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-black uppercase tracking-[0.14em] text-sky-700">{course.code}</p>
                                <h4 className="mt-2 text-lg font-black text-slate-950">{course.name}</h4>
                              </div>
                              {active ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : null}
                            </div>
                            <p className="relative mt-4 text-sm text-slate-500">
                              {course.topics.length} topic{course.topics.length === 1 ? "" : "s"} / {course.readyMaterialCount} ready material{course.readyMaterialCount === 1 ? "" : "s"}
                            </p>
                          </button>
                        );
                      })}
                    </div>

                    {filteredCourses.length === 0 ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                        No uploaded courses match this department and search.
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {step === 2 ? (
                  <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
                    <div className="space-y-5">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Stage two</p>
                        <h3 className="mt-1 text-2xl font-black text-slate-950">Choose your challenge area</h3>
                      </div>
                      <div className="grid gap-3">
                        {topics.map((topic) => {
                          const active = topic.slug === selectedTopic?.slug;

                          return (
                            <button
                              key={topic.id}
                              type="button"
                              onClick={() => {
                                setTopicSlug(topic.slug);
                                setSubtopicSlug("");
                              }}
                              className={`rounded-2xl border p-4 text-left ${
                                active ? "border-sky-300 bg-sky-50" : "border-slate-200 bg-white hover:bg-slate-50"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <h4 className="font-black text-slate-950">{topic.name}</h4>
                                  <p className="mt-1 text-sm text-slate-500">
                                    {topic.materialCount} ready material{topic.materialCount === 1 ? "" : "s"}
                                  </p>
                                </div>
                                {active ? <CheckCircle2 className="h-5 w-5 text-sky-700" /> : null}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <label htmlFor="exam-subtopic" className="block text-sm font-bold text-slate-700">
                        Subtopic
                      </label>
                      <select
                        id="exam-subtopic"
                        value={resolvedSubtopicSlug}
                        onChange={(event) => setSubtopicSlug(event.target.value)}
                        className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none"
                      >
                        <option value="">All subtopics</option>
                        {availableSubtopics.map((subtopic) => (
                          <option key={subtopic.id} value={subtopic.slug}>
                            {subtopic.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : null}

                {step === 3 ? (
                  <div className="space-y-5">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Stage three</p>
                      <h3 className="mt-1 text-2xl font-black text-slate-950">Set the rules</h3>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-3">
                      <label className="rounded-2xl border border-slate-200 bg-white p-4">
                        <span className="block text-sm font-bold text-slate-700">Question type</span>
                        <select
                          value={type}
                          onChange={(event) => setType(event.target.value as typeof type)}
                          className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none"
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

                      <label className="rounded-2xl border border-slate-200 bg-white p-4">
                        <span className="block text-sm font-bold text-slate-700">Question number</span>
                        <select
                          value={count}
                          onChange={(event) => setCount(Number(event.target.value))}
                          className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none"
                        >
                          {QUESTION_COUNT_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="rounded-2xl border border-slate-200 bg-white p-4">
                        <span className="block text-sm font-bold text-slate-700">Timer</span>
                        <select
                          value={durationMinutes}
                          onChange={(event) =>
                            setDurationMinutes(event.target.value ? Number(event.target.value) : "")
                          }
                          className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none"
                          aria-label="Exam timer"
                          required
                        >
                          <option value="">Select timer</option>
                          {TIMER_OPTIONS.filter((option) => option.value > 0).map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>
                ) : null}

                {step === 4 ? (
                  <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
                    <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
                      <div
                        className="absolute right-0 top-0 h-24 w-40 bg-emerald-200"
                        style={{ clipPath: "polygon(18% 0, 100% 0, 100% 100%, 0 70%)" }}
                      />
                      <div className="relative">
                        <Trophy className="h-10 w-10 text-emerald-700" />
                        <h3 className="mt-4 text-2xl font-black text-emerald-950">Ready to launch</h3>
                        <p className="mt-2 text-sm leading-6 text-emerald-800">
                          {selectedCourse?.code} / {selectedTopic?.name} / {typeLabel(type)} / {count} questions
                          {hasTimer ? ` / ${durationMinutes} minutes` : " / timer not selected"}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3">
                      <button
                        onClick={() => void startExam()}
                        disabled={loading || !isFormValid}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#0969da] to-[#0ca678] px-6 py-4 text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none"
                      >
                        {loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <FileQuestion className="h-5 w-5" />}
                        {loading ? "Building exam..." : "Generate exam"}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              {error ? (
                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}

              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={goBack}
                  disabled={step === 1 || loading}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 disabled:opacity-40"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
                    <Clock3 className="h-4 w-4" />
                    {step} of 4
                  </span>
                  {step < 4 ? (
                    <button
                      type="button"
                      onClick={goNext}
                      disabled={loading || (step === 1 && !selectedCourse) || (step === 2 && !selectedTopic)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-40"
                    >
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
