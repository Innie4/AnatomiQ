"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Clock, Award, Target, TrendingUp, Calendar } from "lucide-react";

type ExamResult = {
  id: string;
  courseSlug: string;
  topicSlug: string;
  subtopicSlug: string | null;
  type: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  duration: number;
  completedAt: string;
};

export default function HistoryPage() {
  const router = useRouter();
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchResults = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/auth/signin");
        return;
      }

      const response = await fetch("/api/exam-results", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch exam history");
      }

      const data = await response.json();
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateStats = () => {
    if (results.length === 0) return null;

    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    const totalQuestions = results.reduce((sum, r) => sum + r.totalQuestions, 0);
    const totalCorrect = results.reduce((sum, r) => sum + r.correctAnswers, 0);
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;

    return {
      avgScore,
      totalQuestions,
      totalCorrect,
      avgDuration,
      totalExams: results.length,
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading exam history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 py-16 px-4">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <Calendar className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Exam History</h1>
          <p className="text-lg text-slate-600">
            Track your progress and performance over time
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 mb-8">
            {error}
          </div>
        )}

        {stats && (
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <Award className="h-6 w-6 text-blue-600" />
                <h3 className="font-semibold text-slate-900">Total Exams</h3>
              </div>
              <p className="text-3xl font-bold text-slate-900">{stats.totalExams}</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="h-6 w-6 text-green-600" />
                <h3 className="font-semibold text-slate-900">Avg Score</h3>
              </div>
              <p className={`text-3xl font-bold ${getScoreColor(stats.avgScore)}`}>
                {stats.avgScore.toFixed(1)}%
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <Target className="h-6 w-6 text-purple-600" />
                <h3 className="font-semibold text-slate-900">Questions</h3>
              </div>
              <p className="text-3xl font-bold text-slate-900">
                {stats.totalCorrect}/{stats.totalQuestions}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="h-6 w-6 text-orange-600" />
                <h3 className="font-semibold text-slate-900">Avg Time</h3>
              </div>
              <p className="text-3xl font-bold text-slate-900">
                {formatDuration(Math.round(stats.avgDuration))}
              </p>
            </div>
          </div>
        )}

        {results.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-lg">
            <Calendar className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">No Exam History Yet</h2>
            <p className="text-slate-600 mb-6">
              Take your first exam to see your results and track your progress over time.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-3 rounded-xl bg-gradient-to-br from-[#0969da] to-[#0ca678] font-semibold text-white hover:scale-105 transition-transform"
            >
              Start an Exam
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Recent Exams</h2>
            {results.map((result) => (
              <div
                key={result.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-slate-900">
                        {result.courseSlug.replace(/-/g, " ").toUpperCase()}
                      </h3>
                      <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                        {result.type}
                      </span>
                    </div>
                    <p className="text-slate-600 mb-3">
                      {result.topicSlug.replace(/-/g, " ")}
                      {result.subtopicSlug && ` • ${result.subtopicSlug.replace(/-/g, " ")}`}
                    </p>
                    <div className="flex items-center gap-6 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {formatDuration(result.duration)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        {result.correctAnswers}/{result.totalQuestions} correct
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(result.completedAt)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-6">
                    <div className={`text-4xl font-bold ${getScoreColor(result.score)}`}>
                      {result.score.toFixed(1)}%
                    </div>
                    <div className="text-sm text-slate-500">Score</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
