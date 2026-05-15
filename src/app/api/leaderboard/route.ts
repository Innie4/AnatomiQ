import { NextRequest, NextResponse } from "next/server";

import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/db";

const PERIODS = {
  weekly: 7,
  monthly: 30,
  "all-time": null,
} as const;

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(authHeader.substring(7));
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const periodParam = request.nextUrl.searchParams.get("period") || "all-time";
    const period = periodParam in PERIODS ? (periodParam as keyof typeof PERIODS) : "all-time";
    const days = PERIODS[period];
    const completedAt = days
      ? { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
      : undefined;

    const grouped = await db.examResult.groupBy({
      by: ["userId"],
      where: completedAt ? { completedAt } : undefined,
      _count: { id: true },
      _sum: { correctAnswers: true, totalQuestions: true },
      _avg: { score: true },
      orderBy: [
        { _sum: { correctAnswers: "desc" } },
        { _count: { id: "desc" } },
      ],
      take: 50,
    });

    const users = await db.facultyUser.findMany({
      where: { id: { in: grouped.map((entry) => entry.userId) } },
      select: { id: true, fullName: true, department: true },
    });
    const userMap = new Map(users.map((user) => [user.id, user]));

    const leaderboard = grouped.map((entry, index) => {
      const user = userMap.get(entry.userId);
      const correctAnswers = entry._sum.correctAnswers || 0;
      const totalQuestions = entry._sum.totalQuestions || 0;
      const examsCompleted = entry._count.id;

      return {
        rank: index + 1,
        userId: entry.userId,
        fullName: user?.fullName || "AnatomiQ Student",
        department: user?.department || "Human Anatomy",
        score: examsCompleted * 100 + correctAnswers * 10,
        examsCompleted,
        avgScore: totalQuestions ? Math.round((correctAnswers / totalQuestions) * 1000) / 10 : 0,
        isCurrentUser: entry.userId === payload.userId,
      };
    });

    return NextResponse.json({ leaderboard, period });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json(
      { error: "Failed to load leaderboard" },
      { status: 500 }
    );
  }
}
