import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const updateCoursesSchema = z.object({
  selectedCourses: z.array(z.string()),
});

export async function PUT(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateCoursesSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    const { selectedCourses } = validation.data;
    const uniqueSelections = [...new Set(selectedCourses)];

    const existingCourses = await db.course.findMany({
      where: {
        slug: { in: uniqueSelections },
      },
      select: { slug: true },
    });
    const validSlugs = existingCourses.map((course) => course.slug);

    // Update user's selected courses
    await db.facultyUser.update({
      where: { id: payload.userId },
      data: { selectedCourses: validSlugs },
    });

    return NextResponse.json({ success: true, selectedCourses: validSlugs });
  } catch (error) {
    console.error("Error updating courses:", error);
    return NextResponse.json(
      { error: "Failed to update courses" },
      { status: 500 }
    );
  }
}
