import { CourseSemester } from "@prisma/client";
import { z } from "zod";

import { fail, handleRouteError, ok } from "@/lib/api";
import { authenticateRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import { toSlug } from "@/lib/utils";

const courseSchema = z.object({
  code: z.string().trim().min(2).max(24),
  name: z.string().trim().min(3).max(120),
  semester: z.enum(["FIRST", "SECOND"]),
  department: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(500).optional().nullable(),
});

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(db, request);
    if (!auth) {
      return fail("Unauthorized", 401);
    }

    const courses = await db.course.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        slug: true,
        semester: true,
        department: true,
        description: true,
        _count: {
          select: {
            Topic: true,
            Material: true,
            Question: true,
          },
        },
      },
      orderBy: [{ semester: "asc" }, { code: "asc" }],
    });

    return ok({ courses });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(db, request);
    if (!auth) {
      return fail("Unauthorized", 401);
    }

    const payload = courseSchema.parse(await request.json());
    const slug = toSlug(payload.name);
    const code = payload.code.toUpperCase();
    const department = payload.department || "Human Anatomy";

    const course = await db.course.upsert({
      where: { department_code: { department, code } },
      update: {
        name: payload.name,
        slug,
        semester: payload.semester as CourseSemester,
        department,
        description: payload.description || undefined,
      },
      create: {
        code,
        name: payload.name,
        slug,
        semester: payload.semester as CourseSemester,
        department,
        description: payload.description || null,
      },
      select: {
        id: true,
        code: true,
        name: true,
        slug: true,
        semester: true,
        department: true,
        description: true,
      },
    });

    return ok({ course });
  } catch (error) {
    return handleRouteError(error);
  }
}
