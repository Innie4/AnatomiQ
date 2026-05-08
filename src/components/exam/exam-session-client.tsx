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
      setTimeLeft(data.config.durationMinutes > 0 ? data.config.durationMinutes * 60 : null);
    } catch {
      router.push("/exam");
    }
  }, [router]);

  const formattedTimer =
    timeLeft === null
      ? null
      : `${String(Math.floor(timeLeft / 60)).padStart(2, "0")}:${String(timeLeft % 60).padStart(2, "0")}`;

  const autoSubmit = useEffectEvent(async () => {
    if (!examData || submitting) return;
    await handleSubmitExam(true);
  });

  useEffect(() => {
    if (timeLeft === null) return;

    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (typeof current !== "number") return current;
        if (current <= 1) {
          window.clearInterval(timer);
          void autoSubmit();
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [timeLeft, autoSubmit]);

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

      sessionStorage.setItem(
        "anatomiq:last-result",
        JSON.stringify({
          submittedAt: new Date().toISOString(),
          timedOut,
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
            <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-emerald-700">
              <Clock3 className="h-5 w-5" />
              <span className="font-mono text-lg font-semibold">{formattedTimer}</span>
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

          {/* Source Trace */}
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <span className="font-semibold">Source trace:</span> {currentQuestion.sourceSnippet}
          </div>
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
