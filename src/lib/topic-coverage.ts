import { MaterialStatus } from "@prisma/client";

import { db } from "@/lib/db";
import { DEFAULT_ANATOMY_TOPICS } from "@/lib/constants";
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

export async function getTopicCoverage(search?: string) {
  if (!hasDatabase) {
    const normalized = search?.toLowerCase();

    return DEFAULT_ANATOMY_TOPICS.filter((topic) => {
      if (!normalized) {
        return true;
      }

      return (
        topic.name.toLowerCase().includes(normalized) ||
        topic.children.some((child) => child.toLowerCase().includes(normalized))
      );
    }).map(
      (topic) =>
        ({
          id: topic.slug,
          name: topic.name,
          slug: topic.slug,
          summary: topic.summary,
          materialCount: 0,
          questionCount: 0,
          subtopicCount: topic.children.length,
          readyMaterialCount: 0,
          processingMaterialCount: 0,
          failedMaterialCount: 0,
          latestMaterialAt: null,
          childTopics: topic.children.map((child) => ({
            id: `${topic.slug}-${child.toLowerCase().replace(/\s+/g, "-")}`,
            name: child,
            slug: `${topic.slug}-${child.toLowerCase().replace(/\s+/g, "-")}`,
          })),
        }) satisfies TopicCoverageItem,
    );
  }

  const topics = await db.topic.findMany({
    where: {
      level: 0,
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
    const readyMaterialCount = topic.materials.filter((material) => material.status === MaterialStatus.READY).length;
    const processingMaterialCount = topic.materials.filter(
      (material) => material.status === MaterialStatus.PROCESSING || material.status === MaterialStatus.UPLOADED,
    ).length;
    const failedMaterialCount = topic.materials.filter((material) => material.status === MaterialStatus.FAILED).length;

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

  const activeTopics = mapped.filter((topic) => topic.materialCount > 0);
  return activeTopics.length ? activeTopics : mapped;
}
