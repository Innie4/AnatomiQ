import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

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
    const query = searchParams.get("q") || "";
    const courseSlug = searchParams.get("course");
    const type = searchParams.get("type");

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: "Search query must be at least 2 characters" },
        { status: 400 }
      );
    }

    const searchTerm = query.toLowerCase();

    // Search topics
    const topicWhere: Prisma.TopicWhereInput = {
      OR: [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { summary: { contains: searchTerm, mode: "insensitive" } },
      ],
    };
    if (courseSlug) {
      const course = await db.course.findUnique({
        where: { slug: courseSlug },
      });
      if (course) {
        topicWhere.courseId = course.id;
      }
    }

    const topics = await db.topic.findMany({
      where: topicWhere,
      take: 10,
      include: {
        course: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });

    // Search materials
    const materialWhere: Prisma.MaterialWhereInput = {
      OR: [
        { title: { contains: searchTerm, mode: "insensitive" } },
        { extractedText: { contains: searchTerm, mode: "insensitive" } },
      ],
      status: "READY",
    };
    if (courseSlug) {
      const course = await db.course.findUnique({
        where: { slug: courseSlug },
      });
      if (course) {
        materialWhere.courseId = course.id;
      }
    }

    const materials = await db.material.findMany({
      where: materialWhere,
      take: 10,
      include: {
        course: {
          select: {
            name: true,
            slug: true,
          },
        },
        topic: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });

    // Search questions
    const questionWhere: Prisma.QuestionWhereInput = {
      OR: [
        { stem: { contains: searchTerm, mode: "insensitive" } },
        { answer: { contains: searchTerm, mode: "insensitive" } },
        { explanation: { contains: searchTerm, mode: "insensitive" } },
      ],
    };
    if (courseSlug) {
      const course = await db.course.findUnique({
        where: { slug: courseSlug },
      });
      if (course) {
        questionWhere.courseId = course.id;
      }
    }
    if (type) {
      questionWhere.type = type as "MCQ" | "SHORT_ANSWER" | "THEORY";
    }

    const questions = await db.question.findMany({
      where: questionWhere,
      take: 10,
      include: {
        course: {
          select: {
            name: true,
            slug: true,
          },
        },
        topic: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json({
      query,
      results: {
        topics,
        materials,
        questions,
      },
      counts: {
        topics: topics.length,
        materials: materials.length,
        questions: questions.length,
      },
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
