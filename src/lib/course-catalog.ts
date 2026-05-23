import { MaterialStatus } from "@prisma/client";

import { db } from "@/lib/db";
import { hasDatabase } from "@/lib/env";

export type ExamCourseCatalogItem = {
  id: string;
  code: string;
  name: string;
  slug: string;
  department: string;
  materialCount: number;
  readyMaterialCount: number;
  topics: Array<{
    id: string;
    name: string;
    slug: string;
    materialCount: number;
    childTopics: Array<{ id: string; name: string; slug: string; materialCount: number }>;
  }>;
};

export async function getExamCourseCatalog(search?: string) {
  if (!hasDatabase) {
    return [];
  }

  const courses = await db.course.findMany({
    where: {
      Material: {
        some: {
          status: MaterialStatus.READY,
        },
      },
      ...(search
        ? {
            OR: [
              { code: { contains: search } },
              { name: { contains: search } },
              { department: { contains: search } },
            ],
          }
        : {}),
    },
    include: {
      Topic: {
        where: {
          level: 0,
          materials: {
            some: {
              status: MaterialStatus.READY,
            },
          },
        },
        include: {
          childTopics: {
            where: {
              materialsAsSubtopic: {
                some: {
                  status: MaterialStatus.READY,
                },
              },
            },
            include: {
              _count: {
                select: {
                  materialsAsSubtopic: {
                    where: {
                      status: MaterialStatus.READY,
                    },
                  },
                },
              },
            },
            orderBy: { name: "asc" },
          },
          _count: {
            select: {
              materials: {
                where: {
                  status: MaterialStatus.READY,
                },
              },
            },
          },
        },
        orderBy: { name: "asc" },
      },
      _count: {
        select: {
          Material: true,
        },
      },
    },
    orderBy: [{ department: "asc" }, { code: "asc" }, { name: "asc" }],
  });

  return courses
    .map((course) => {
      const readyMaterialCount = course.Topic.reduce(
        (total, topic) => total + topic._count.materials,
        0,
      );

      return {
        id: course.id,
        code: course.code,
        name: course.name,
        slug: course.slug,
        department: course.department,
        materialCount: course._count.Material,
        readyMaterialCount,
        topics: course.Topic.map((topic) => ({
          id: topic.id,
          name: topic.name,
          slug: topic.slug,
          materialCount: topic._count.materials,
          childTopics: topic.childTopics.map((child) => ({
            id: child.id,
            name: child.name,
            slug: child.slug,
            materialCount: child._count.materialsAsSubtopic,
          })),
        })),
      } satisfies ExamCourseCatalogItem;
    })
    .filter((course) => course.topics.length > 0);
}

export async function getDepartmentsWithCourses() {
  const courses = await getExamCourseCatalog();
  return Array.from(new Set(courses.map((course) => course.department))).sort((a, b) => a.localeCompare(b));
}
