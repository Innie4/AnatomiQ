import { MaterialStatus } from "@prisma/client";

import { db } from "@/lib/db";
import { hasDatabase } from "@/lib/env";
import { parseJsonString } from "@/lib/json";
import { getTopicCoverage } from "@/lib/topic-coverage";

export async function getAdminOverview() {
  const emptyState = {
    summary: {
      totalMaterials: 0,
      readyMaterials: 0,
      processingMaterials: 0,
      failedMaterials: 0,
      totalChunks: 0,
      totalQuestions: 0,
      totalConcepts: 0,
    },
    statusDistribution: [],
    recentMaterials: [],
    topicCoverage: [],
  };

  if (!hasDatabase) {
    return emptyState;
  }

  try {
    const [summary] = (await db.$queryRaw`
      SELECT
        (SELECT COUNT(*)::int FROM "Material") AS "totalMaterials",
        (SELECT COUNT(*)::int FROM "Material" WHERE "status" = 'READY') AS "readyMaterials",
        (SELECT COUNT(*)::int FROM "Material" WHERE "status" = 'PROCESSING') AS "processingMaterials",
        (SELECT COUNT(*)::int FROM "Material" WHERE "status" = 'FAILED') AS "failedMaterials",
        (SELECT COUNT(*)::int FROM "ContentChunk") AS "totalChunks",
        (SELECT COUNT(*)::int FROM "Question") AS "totalQuestions",
        (SELECT COUNT(*)::int FROM "Concept") AS "totalConcepts"
    `) as Array<{
      totalMaterials: number;
      readyMaterials: number;
      processingMaterials: number;
      failedMaterials: number;
      totalChunks: number;
      totalQuestions: number;
      totalConcepts: number;
    }>;
    const totalMaterials = Number(summary?.totalMaterials ?? 0);
    const readyMaterials = Number(summary?.readyMaterials ?? 0);
    const processingMaterials = Number(summary?.processingMaterials ?? 0);
    const failedMaterials = Number(summary?.failedMaterials ?? 0);
    const totalChunks = Number(summary?.totalChunks ?? 0);
    const totalQuestions = Number(summary?.totalQuestions ?? 0);
    const totalConcepts = Number(summary?.totalConcepts ?? 0);
    const recentMaterials = await db.material.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        topic: true,
        subtopic: true,
        course: true,
        _count: {
          select: {
            ContentChunk: true,
            Question: true,
          },
        },
      },
    });
    const topicCoverage = await getTopicCoverage();

    const statusDistribution = [
      { label: "Ready", value: readyMaterials, status: MaterialStatus.READY },
      { label: "Processing", value: processingMaterials, status: MaterialStatus.PROCESSING },
      { label: "Failed", value: failedMaterials, status: MaterialStatus.FAILED },
      {
        label: "Uploaded",
        value: Math.max(totalMaterials - readyMaterials - processingMaterials - failedMaterials, 0),
        status: MaterialStatus.UPLOADED,
      },
    ];

    return {
      summary: {
        totalMaterials,
        readyMaterials,
        processingMaterials,
        failedMaterials,
        totalChunks,
        totalQuestions,
        totalConcepts,
      },
      statusDistribution,
      recentMaterials: recentMaterials.map((material) => {
        const processingNotes = parseJsonString<{ extractionMethod?: string } | null>(
          material.processingNotes,
          null,
        );

        return {
          id: material.id,
          title: material.title,
          fileName: material.fileName,
          status: material.status,
          storageUrl: material.storageUrl,
          course: material.course.name,
          topic: material.topic.name,
          subtopic: material.subtopic?.name ?? null,
          chunkCount: material._count.ContentChunk ?? 0,
          questionCount: material._count.Question ?? 0,
          sourcePages: material.sourcePages,
          createdAt: material.createdAt.toISOString(),
          updatedAt: material.updatedAt.toISOString(),
          extractionMethod: processingNotes?.extractionMethod ?? null,
        };
      }),
      topicCoverage: topicCoverage.slice(0, 6),
    };
  } catch (error) {
    console.error("Falling back to an empty admin overview because the database is unavailable.", error);
    return emptyState;
  }
}
