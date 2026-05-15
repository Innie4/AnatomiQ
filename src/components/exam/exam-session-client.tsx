"use client";

import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle, Circle, Clock3, LoaderCircle } from "lucide-react";
import { startTransition, useEffect, useEffectEvent, useState } from "react";
import { toFriendlyError } from "@/lib/friendly-errors";

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

type ExamData = {
  selection: {
    courseSlug: string;
    topicName: string;
    subtopicName?: string | null;
  };
  questions: ExamQuestion[];
  config: {
    topicSlug: string;
    subtopicSlug: string;
    type: string;
    count: number;
    durationMinutes: number;
  };
};

type GradeResponse = {
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

export function ExamSessionClient() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gracePeriod, setGracePeriod] = useState(false);
  const [graceTimeLeft, setGraceTimeLeft] = useState(180); // 3 minutes in seconds
  const [showGraceModal, setShowGraceModal] = useState(false);

  // Load exam from sessionStorage
  useEffect(() => {
    setMounted(true);
    const stored = sessionStorage.getItem("anatomiq:active-exam");
    if (!stored) {
      router.push("/exam");
      return;
    }

    try {
      const data = JSON.parse(stored) as ExamData;
      setExamData(data);
      if (data.config.durationMinutes > 0) {
        setTimeLeft(data.config.durationMinutes * 60);
      }
    } catch {
      router.push("/exam");
    }
  }, [router]);

  // Show grace period timer if active, otherwise show main timer
  const displayTimeLeft = gracePeriod ? graceTimeLeft : timeLeft;
  const formattedTimer =
    displayTimeLeft === null
      ? null
      : `${String(Math.floor(displayTimeLeft / 60)).padStart(2, "0")}:${String(displayTimeLeft % 60).padStart(2, "0")}`;

  const autoSubmit = useEffectEvent(async () => {
    if (!examData || submitting) return;
    await handleSubmitExam(true);
  });

  // Main timer countdown
  useEffect(() => {
    if (timeLeft === null || gracePeriod) return;

    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (typeof current !== "number") return current;
        if (current <= 1) {
          window.clearInterval(timer);
          // Trigger grace period instead of auto-submit
          setGracePeriod(true);
          setShowGraceModal(true);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [timeLeft, gracePeriod]);

  // Grace period countdown
  useEffect(() => {
    if (!gracePeriod) return;

    const timer = window.setInterval(() => {
      setGraceTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          void autoSubmit();
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [gracePeriod, autoSubmit]);

  async function handleSubmitExam(timedOut = false) {
    if (!examData) return;

    setSubmitting(true);
    setError(null);

    try {
      const gradeResponse = await fetch("/api/grade-exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: examData.questions.map((question) => ({
            questionId: question.id,
            response: answers[question.id] ?? "",
          })),
        }),
      });

      const gradePayload = (await gradeResponse.json()) as GradeResponse & { error?: string };

      if (!gradeResponse.ok) {
        throw new Error(gradePayload.error || "Could not grade this exam.");
      }

      const token = localStorage.getItem("anatomiq:auth-token");
      const duration =
        examData.config.durationMinutes > 0 && typeof timeLeft === "number"
          ? examData.config.durationMinutes * 60 - timeLeft
          : 0;
      let savedResult = false;

      if (token) {
        const saveResponse = await fetch("/api/exam-results", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            courseSlug: examData.selection.courseSlug,
            topicSlug: examData.config.topicSlug,
            subtopicSlug: examData.config.subtopicSlug || null,
            type: examData.config.type,
            score: gradePayload.percentage,
            totalQuestions: gradePayload.total,
            correctAnswers: gradePayload.score,
            duration,
          }),
        });
        savedResult = saveResponse.ok;
      }

      sessionStorage.setItem(
        "anatomiq:last-result",
        JSON.stringify({
          submittedAt: new Date().toISOString(),
          timedOut,
          savedResult,
          config: examData.config,
          selection: examData.selection,
          questions: examData.questions,
          answers,
          grade: gradePayload,
        }),
      );

      // Clear active exam
      sessionStorage.removeItem("anatomiq:active-exam");

      startTransition(() => {
        router.push("/results");
      });
    } catch (submitError) {
      setError(toFriendlyError(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  function setAnswer(questionId: string, value: string) {
    setAnswers((current) => ({
      ...current,
      [questionId]: value,
    }));
  }

  function goToQuestion(index: number) {
    setCurrentQuestionIndex(index);
  }

  function nextQuestion() {
    if (examData && currentQuestionIndex < examData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  }

  function previousQuestion() {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  }

  if (!mounted || !examData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const currentQuestion = examData.questions[currentQuestionIndex];
  const answeredQuestions = new Set(Object.keys(answers).filter((id) => answers[id]?.trim()));
  const progress = Math.round((answeredQuestions.size / examData.questions.length) * 100);

  // Grace Period Modal (only show if modal flag is true)
  if (gracePeriod && showGraceModal) {
    const graceMinutes = Math.floor(graceTimeLeft / 60);
    const graceSeconds = graceTimeLeft % 60;
    const gracePercentage = (graceTimeLeft / 180) * 100;
    const isUrgent = graceTimeLeft <= 60;
    const isCritical = graceTimeLeft <= 30;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-rose-950 via-rose-900 to-orange-900">
        {/* Pulsing background effect */}
        <div
          className={`absolute inset-0 opacity-30 ${isCritical ? "animate-pulse" : ""}`}
          style={{
            background: `radial-gradient(circle at 50% 50%, rgba(239, 68, 68, ${gracePercentage / 100}), transparent)`,
          }}
        />

        <div className="relative z-10 mx-4 max-w-2xl text-center">
          {/* Warning Icon with pulse */}
          <div className="mx-auto mb-8 flex h-32 w-32 items-center justify-center">
            <div
              className={`absolute h-32 w-32 rounded-full bg-rose-500/20 ${isCritical ? "animate-ping" : isUrgent ? "animate-pulse" : ""}`}
            />
            <AlertCircle className={`relative h-24 w-24 text-rose-400 ${isCritical ? "animate-bounce" : ""}`} />
          </div>

          {/* Title */}
          <h1 className="mb-4 text-5xl font-black text-white drop-shadow-2xl sm:text-6xl">
            TIME&apos;S UP!
          </h1>

          {/* Countdown Timer */}
          <div className="mb-6">
            <div
              className={`inline-flex items-center gap-2 rounded-2xl border-4 px-8 py-4 ${
                isCritical
                  ? "animate-pulse border-rose-300 bg-rose-500/30"
                  : isUrgent
                  ? "border-rose-400 bg-rose-500/20"
                  : "border-rose-500 bg-rose-600/20"
              }`}
            >
              <Clock3 className={`h-12 w-12 text-white ${isCritical ? "animate-spin" : ""}`} />
              <div className="text-8xl font-black tabular-nums text-white drop-shadow-xl">
                {String(graceMinutes).padStart(2, "0")}:{String(graceSeconds).padStart(2, "0")}
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="mb-8 space-y-4">
            <p className="text-2xl font-bold text-rose-200">
              {isCritical
                ? "⚠️ FINAL SECONDS! ⚠️"
                : isUrgent
                ? "🚨 ONE MINUTE LEFT! 🚨"
                : "Grace Period: 3 Minutes"}
            </p>
            <p className="text-lg text-rose-100">
              {isCritical
                ? "Your exam will be submitted automatically in seconds!"
                : "Complete your remaining answers quickly!"}
            </p>
            <p className="text-base text-rose-200/80">
              Unanswered questions will be marked incorrect.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="mx-auto h-4 w-full max-w-md overflow-hidden rounded-full bg-rose-950/50">
              <div
                className={`h-full transition-all duration-1000 ${
                  isCritical
                    ? "bg-gradient-to-r from-rose-400 to-orange-400"
                    : "bg-gradient-to-r from-rose-500 to-orange-500"
                }`}
                style={{ width: `${gracePercentage}%` }}
              />
            </div>
            <p className="mt-2 text-sm font-medium text-rose-300">
              {answeredQuestions.size} of {examData.questions.length} questions answered
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <button
              onClick={() => setShowGraceModal(false)}
              disabled={submitting}
              className="rounded-2xl border-2 border-white bg-white px-8 py-4 text-lg font-bold text-rose-900 shadow-2xl transition-all hover:scale-105 hover:shadow-rose-500/50 disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none"
            >
              Continue Answering
            </button>
            <button
              onClick={() => void handleSubmitExam(true)}
              disabled={submitting}
              className="rounded-2xl border-2 border-rose-400 bg-rose-500/20 px-8 py-4 text-lg font-bold text-white shadow-2xl transition-all hover:scale-105 hover:bg-rose-500/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none"
            >
              {submitting ? "Submitting..." : "Submit Now"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50/30">
      {/* Header with Timer and Progress */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-lg font-semibold text-slate-950">
              {examData.selection.topicName}
              {examData.selection.subtopicName ? ` / ${examData.selection.subtopicName}` : ""}
            </h1>
            <p className="text-sm text-slate-500">
              Question {currentQuestionIndex + 1} of {examData.questions.length} · {progress}% answered
            </p>
          </div>

          {formattedTimer && (
            <div
              className={`flex items-center gap-3 rounded-xl border-2 px-6 py-3 transition-all ${
                gracePeriod
                  ? graceTimeLeft <= 30
                    ? "animate-pulse border-rose-400 bg-rose-500 shadow-2xl shadow-rose-500/50"
                    : graceTimeLeft <= 60
                    ? "border-rose-400 bg-rose-500 shadow-xl shadow-rose-500/30"
                    : "border-rose-300 bg-rose-500 shadow-lg"
                  : "border-emerald-100 bg-emerald-50"
              }`}
            >
              <Clock3
                className={`${gracePeriod ? "h-8 w-8 text-white" : "h-5 w-5 text-emerald-700"} ${graceTimeLeft <= 30 && gracePeriod ? "animate-spin" : ""}`}
              />
              <span
                className={`font-mono font-black ${gracePeriod ? "text-4xl text-white drop-shadow-lg" : "text-lg text-emerald-700"}`}
              >
                {formattedTimer}
              </span>
              {gracePeriod && (
                <div className="ml-2 flex flex-col">
                  <span className="text-xs font-bold uppercase text-rose-100">Grace</span>
                  <span className="text-xs font-bold uppercase text-rose-100">Period</span>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Question Number Grid */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-slate-700">Question Navigator</p>
          <div className="grid grid-cols-10 gap-2 sm:grid-cols-15 md:grid-cols-20">
            {examData.questions.map((question, index) => {
              const isAnswered = answeredQuestions.has(question.id);
              const isCurrent = index === currentQuestionIndex;

              return (
                <button
                  key={question.id}
                  onClick={() => goToQuestion(index)}
                  className={`
                    flex h-10 w-10 items-center justify-center rounded-lg border-2 text-sm font-semibold transition-all
                    ${isCurrent ? "border-sky-500 bg-sky-500 text-white shadow-md" : ""}
                    ${!isCurrent && isAnswered ? "border-emerald-500 bg-emerald-500 text-white" : ""}
                    ${!isCurrent && !isAnswered ? "border-amber-300 bg-amber-50 text-amber-700 hover:border-amber-400" : ""}
                  `}
                  aria-label={`Go to question ${index + 1}${isAnswered ? " (answered)" : " (unanswered)"}`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Question */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Question {currentQuestionIndex + 1} · {currentQuestion.type.replaceAll("_", " ")}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">{currentQuestion.stem}</h2>
            </div>
            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sky-700">
              {currentQuestion.difficulty}
            </span>
          </div>

          {/* Answer Input */}
          {currentQuestion.type === "MCQ" ? (
            <div className="space-y-3">
              {currentQuestion.options?.map((option) => (
                <label
                  key={option}
                  className={`
                    flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all
                    ${
                      answers[currentQuestion.id] === option
                        ? "border-sky-500 bg-sky-50"
                        : "border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50/50"
                    }
                  `}
                >
                  <input
                    type="radio"
                    name={currentQuestion.id}
                    checked={answers[currentQuestion.id] === option}
                    onChange={() => setAnswer(currentQuestion.id, option)}
                    className="h-5 w-5"
                    aria-label={`Option: ${option}`}
                  />
                  <span className="text-slate-800">{option}</span>
                </label>
              ))}
            </div>
          ) : (
            <textarea
              value={answers[currentQuestion.id] ?? ""}
              onChange={(event) => setAnswer(currentQuestion.id, event.target.value)}
              rows={currentQuestion.type === "THEORY" ? 8 : 5}
              placeholder={
                currentQuestion.type === "THEORY"
                  ? "Write your structured theory response..."
                  : "Write a concise answer..."
              }
              className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-sky-500"
              aria-label={`Answer for ${currentQuestion.type === "THEORY" ? "theory" : "short answer"} question`}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={previousQuestion}
            disabled={currentQuestionIndex === 0}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft className="h-5 w-5" />
            Previous
          </button>

          <div className="flex gap-3">
            {currentQuestionIndex === examData.questions.length - 1 ? (
              <button
                onClick={() => void handleSubmitExam(false)}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-8 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
                Submit Exam
              </button>
            ) : (
              <button
                onClick={nextQuestion}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white hover:bg-sky-700"
              >
                Next
                <ArrowRight className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </main>
    </div>
  );
}
