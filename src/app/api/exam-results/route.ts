import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/exam-results - Retrieve user's exam history
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseSlug = searchParams.get("courseSlug");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = { userId: payload.userId };
    if (courseSlug) {
      where.courseSlug = courseSlug;
    }

    const results = await db.examResult.findMany({
      where,
      orderBy: { completedAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Get exam results error:", error);
    return NextResponse.json(
      { error: "Failed to fetch exam results" },
      { status: 500 }
    );
  }
}

// POST /api/exam-results - Save exam result
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const {
      courseSlug,
      topicSlug,
      subtopicSlug,
      type,
      score,
      totalQuestions,
      correctAnswers,
      duration,
    } = await request.json();

    if (
      !courseSlug ||
      !topicSlug ||
      !type ||
      score === undefined ||
      !totalQuestions ||
      correctAnswers === undefined ||
      duration === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await db.examResult.create({
      data: {
        userId: payload.userId,
        courseSlug,
        topicSlug,
        subtopicSlug,
        type,
        score,
        totalQuestions,
        correctAnswers,
        duration,
      },
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Save exam result error:", error);
    return NextResponse.json(
      { error: "Failed to save exam result" },
      { status: 500 }
    );
  }
}
