import { MaterialStatus } from "@prisma/client";

import { db } from "@/lib/db";
import { hasDatabase } from "@/lib/env";

export type TopicCoverageItem = {
  id: string;
  name: string;
  slug: string;
  summary?: string | null;
  materialCount: number;
  questionCount: number;
  subtopicCount: number;
  readyMaterialCount: number;
  processingMaterialCount: number;
  failedMaterialCount: number;
  latestMaterialAt: string | null;
  childTopics: Array<{ id: string; name: string; slug: string }>;
};

function buildFallbackTopicCoverage(search?: string) {
  void search;
  return [];
}

export async function getTopicCoverage(search?: string, courseSlug?: string) {
  if (!hasDatabase) {
    return buildFallbackTopicCoverage(search);
  }

  try {
    const topics = await db.topic.findMany({
      where: {
        level: 0,
        ...(courseSlug ? { course: { slug: courseSlug } } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search } },
                {
                  childTopics: {
                    some: {
                      name: { contains: search },
                    },
                  },
                },
              ],
            }
          : {}),
      },
      include: {
        childTopics: {
          orderBy: { name: "asc" },
        },
        materials: {
          select: {
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            materials: true,
            questions: true,
            childTopics: true,
          },
        },
      },
      orderBy: [{ materials: { _count: "desc" } }, { name: "asc" }],
    });

    const mapped = topics.map((topic) => {
      const readyMaterialCount = topic.materials.filter(
        (material) => material.status === MaterialStatus.READY,
      ).length;
      const processingMaterialCount = topic.materials.filter(
        (material) => material.status === MaterialStatus.PROCESSING || material.status === MaterialStatus.UPLOADED,
      ).length;
      const failedMaterialCount = topic.materials.filter(
        (material) => material.status === MaterialStatus.FAILED,
      ).length;

      return {
        id: topic.id,
        name: topic.name,
        slug: topic.slug,
        summary: topic.summary,
        materialCount: topic._count.materials,
        questionCount: topic._count.questions,
        subtopicCount: topic._count.childTopics,
        readyMaterialCount,
        processingMaterialCount,
        failedMaterialCount,
        latestMaterialAt: topic.materials[0]?.createdAt.toISOString() ?? null,
        childTopics: topic.childTopics.map((child) => ({
          id: child.id,
          name: child.name,
          slug: child.slug,
        })),
      } satisfies TopicCoverageItem;
    });

    return mapped.filter((topic) => topic.materialCount > 0);
  } catch (error) {
    console.error("Returning empty topic coverage because the database is unavailable.", error);
    return buildFallbackTopicCoverage(search);
  }
}
