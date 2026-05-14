import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const courses = await db.course.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        slug: true,
        semester: true,
        department: true,
        description: true,
      },
      orderBy: [{ semester: "asc" }, { code: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ courses });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}
