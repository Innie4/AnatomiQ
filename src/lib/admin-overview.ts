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
    // Test database connection
    await db.$connect();

    const [
      totalMaterials,
      readyMaterials,
      processingMaterials,
      failedMaterials,
      totalChunks,
      totalQuestions,
      totalConcepts,
      recentMaterials,
      topicCoverage,
    ] = await Promise.all([
      db.material.count(),
      db.material.count({ where: { status: MaterialStatus.READY } }),
      db.material.count({ where: { status: MaterialStatus.PROCESSING } }),
      db.material.count({ where: { status: MaterialStatus.FAILED } }),
      db.contentChunk.count(),
      db.question.count(),
      db.concept.count(),
      db.material.findMany({
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
      }),
      getTopicCoverage(),
    ]);

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
  } finally {
    await db.$disconnect().catch(() => {
      // Ignore disconnect errors
    });
  }
}
