import { NextRequest, NextResponse } from "next/server";

import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseJsonString } from "@/lib/json";

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

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") || 30), 100);
    const topicSlug = searchParams.get("topicSlug") || undefined;

    const user = await db.facultyUser.findUnique({
      where: { id: payload.userId },
      select: { selectedCourses: true },
    });

    const questions = await db.question.findMany({
      where: {
        ...(topicSlug ? { topic: { slug: topicSlug } } : {}),
        ...(user?.selectedCourses.length
          ? { course: { slug: { in: user.selectedCourses } } }
          : {}),
      },
      include: {
        topic: { select: { name: true, slug: true } },
        subtopic: { select: { name: true, slug: true } },
        course: { select: { code: true, name: true, slug: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });

    const flashcards = questions.map((question) => {
      const options = parseJsonString<string[] | null>(question.options, null);

      return {
        id: question.id,
        question: question.stem,
        answer:
          question.type === "MCQ" && options?.length
            ? `${question.answer}\n\nOptions: ${options.join(", ")}`
            : question.answer,
        explanation: question.explanation,
        topic: question.subtopic?.name || question.topic.name,
        topicSlug: question.topic.slug,
        subtopicSlug: question.subtopic?.slug || null,
        course: `${question.course.code} - ${question.course.name}`,
        courseSlug: question.course.slug,
        difficulty: question.difficulty,
        type: question.type,
      };
    });

    return NextResponse.json({ flashcards });
  } catch (error) {
    console.error("Flashcards error:", error);
    return NextResponse.json(
      { error: "Failed to load flashcards" },
      { status: 500 }
    );
  }
}
