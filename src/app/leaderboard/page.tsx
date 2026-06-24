"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy, Medal, Award, TrendingUp, Calendar, Target } from "lucide-react";

type LeaderboardEntry = {
  rank: number;
  userId: string;
  fullName: string;
  department: string;
  score: number;
  examsCompleted: number;
  avgScore: number;
  isCurrentUser?: boolean;
};

type Period = "weekly" | "monthly" | "all-time";

export default function LeaderboardPage() {
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [period, setPeriod] = useState<Period>("all-time");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("academiq:auth-token");
      if (!token) {
        router.push("/signin");
        return;
      }

      const response = await fetch(`/api/leaderboard?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to load leaderboard");
      }

      const data = await response.json();
      setLeaderboard(data.leaderboard || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard, period]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-8 w-8 text-yellow-500" />;
      case 2:
        return <Medal className="h-8 w-8 text-slate-400" />;
      case 3:
        return <Medal className="h-8 w-8 text-amber-600" />;
      default:
        return <div className="h-8 w-8 flex items-center justify-center font-bold text-slate-600">{rank}</div>;
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white";
      case 2:
        return "bg-gradient-to-r from-slate-300 to-slate-500 text-white";
      case 3:
        return "bg-gradient-to-r from-amber-500 to-amber-700 text-white";
      default:
        return "bg-white border-2 border-slate-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 py-16 px-4">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Leaderboard</h1>
          <p className="text-lg text-slate-600">
            Compete with peers and track your ranking
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 mb-8">
            {error}
          </div>
        )}

        {/* Period Selector */}
        <div className="flex justify-center gap-3 mb-8">
          <button
            onClick={() => setPeriod("weekly")}
            className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
              period === "weekly"
                ? "bg-gradient-to-br from-[#0969da] to-[#0ca678] text-white shadow-lg"
                : "bg-white text-slate-700 border-2 border-slate-200 hover:border-slate-300"
            }`}
          >
            <Calendar className="h-5 w-5" />
            Weekly
          </button>
          <button
            onClick={() => setPeriod("monthly")}
            className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
              period === "monthly"
                ? "bg-gradient-to-br from-[#0969da] to-[#0ca678] text-white shadow-lg"
                : "bg-white text-slate-700 border-2 border-slate-200 hover:border-slate-300"
            }`}
          >
            <TrendingUp className="h-5 w-5" />
            Monthly
          </button>
          <button
            onClick={() => setPeriod("all-time")}
            className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
              period === "all-time"
                ? "bg-gradient-to-br from-[#0969da] to-[#0ca678] text-white shadow-lg"
                : "bg-white text-slate-700 border-2 border-slate-200 hover:border-slate-300"
            }`}
          >
            <Award className="h-5 w-5" />
            All Time
          </button>
        </div>

        {leaderboard.length === 0 && (
          <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">
            <p className="text-slate-600">No saved exam results for this period yet.</p>
          </div>
        )}

        {/* Top 3 Podium */}
        {leaderboard.length >= 3 && (
          <div className="grid grid-cols-3 gap-4 mb-8 items-end">
            {/* Second Place */}
            <div className="text-center">
              <div className={`${getRankBadge(2)} rounded-2xl p-6 shadow-xl`}>
                <Medal className="h-12 w-12 text-slate-100 mx-auto mb-3" />
                <div className="text-2xl font-bold mb-1">#2</div>
                <div className="font-semibold mb-1">{leaderboard[1].fullName}</div>
                <div className="text-3xl font-bold">{leaderboard[1].score}</div>
                <div className="text-sm opacity-90">points</div>
              </div>
            </div>

            {/* First Place */}
            <div className="text-center">
              <div className={`${getRankBadge(1)} rounded-2xl p-8 shadow-2xl transform scale-110`}>
                <Trophy className="h-16 w-16 text-white mx-auto mb-4" />
                <div className="text-3xl font-bold mb-2">#1</div>
                <div className="text-lg font-bold mb-2">{leaderboard[0].fullName}</div>
                <div className="text-4xl font-bold">{leaderboard[0].score}</div>
                <div className="text-sm opacity-90">points</div>
              </div>
            </div>

            {/* Third Place */}
            <div className="text-center">
              <div className={`${getRankBadge(3)} rounded-2xl p-6 shadow-xl`}>
                <Medal className="h-12 w-12 text-amber-100 mx-auto mb-3" />
                <div className="text-2xl font-bold mb-1">#3</div>
                <div className="font-semibold mb-1">{leaderboard[2].fullName}</div>
                <div className="text-3xl font-bold">{leaderboard[2].score}</div>
                <div className="text-sm opacity-90">points</div>
              </div>
            </div>
          </div>
        )}

        {/* Full Leaderboard Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Rank</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Student</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Department</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Score</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Exams</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Avg Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {leaderboard.map((entry) => (
                  <tr
                    key={entry.userId}
                    className={`hover:bg-slate-50 transition-colors ${
                      entry.isCurrentUser ? "bg-blue-50" : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {getRankIcon(entry.rank)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{entry.fullName}</div>
                      {entry.isCurrentUser && (
                        <span className="text-xs text-blue-600 font-medium">You</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-700">{entry.department}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        <span className="font-bold text-slate-900">{entry.score}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">{entry.examsCompleted}</td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-green-600">{entry.avgScore}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* How Scoring Works */}
        <div className="mt-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-lg">
          <h2 className="text-xl font-bold text-slate-900 mb-4">How Scoring Works</h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-slate-700">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Award className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold mb-1">Exam Completion</div>
                <div className="text-slate-600">+100 points per exam</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="font-semibold mb-1">Accuracy Bonus</div>
                <div className="text-slate-600">+10 points per correct answer</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="font-semibold mb-1">Streak Multiplier</div>
                <div className="text-slate-600">2x points for 7-day streaks</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
