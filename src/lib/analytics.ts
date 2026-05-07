import { CounterMetric, type QuestionType } from "@prisma/client";

import { db } from "@/lib/db";
import { hasDatabase } from "@/lib/env";

export async function incrementCounter(params: {
  metric: CounterMetric;
  topicId?: string;
  questionType?: QuestionType;
}) {
  if (!hasDatabase) {
    return;
  }

  const key = `${params.metric}:${params.topicId ?? "none"}:${params.questionType ?? "all"}`;

  try {
    const createData: Record<string, unknown> = {
      key,
      metric: params.metric,
      count: 1,
    };

    if (params.topicId !== undefined) {
      createData.topicId = params.topicId;
    }

    if (params.questionType !== undefined) {
      createData.questionType = params.questionType;
    }

    await db.analyticsCounter.upsert({
      where: { key },
      update: {
        count: { increment: 1 },
      },
      create: createData as any,
    });
  } catch (error) {
    console.error("Skipping analytics counter update because the database is unavailable.", error);
  }
}

export async function getPublicAnalytics() {
  if (!hasDatabase) {
    return {
      mostStudiedTopics: [],
      mostGeneratedAreas: [],
      difficultyDistribution: [],
    };
  }

  try {
    const [studyCounters, generationCounters, questionCounts] = await Promise.all([
      db.analyticsCounter.findMany({
        where: { metric: CounterMetric.TOPIC_STUDY, topic: { level: 0 } },
        include: { topic: true },
        orderBy: { count: "desc" },
        take: 5,
      }),
      db.analyticsCounter.findMany({
        where: { metric: CounterMetric.QUESTION_GENERATION, topic: { level: 0 } },
        include: { topic: true },
        orderBy: { count: "desc" },
        take: 5,
      }),
      db.question.groupBy({
        by: ["difficulty"],
        _count: true,
      }),
    ]);

    return {
      mostStudiedTopics: studyCounters.map((item) => ({
        topic: item.topic?.name ?? "Unknown",
        count: item.count,
      })),
      mostGeneratedAreas: generationCounters.map((item) => ({
        topic: item.topic?.name ?? "Unknown",
        count: item.count,
      })),
      difficultyDistribution: questionCounts.map((item) => ({
        difficulty: item.difficulty,
        count: item._count,
      })),
    };
  } catch (error) {
    console.error("Falling back to empty analytics because the database is unavailable.", error);

    return {
      mostStudiedTopics: [],
      mostGeneratedAreas: [],
      difficultyDistribution: [],
    };
  }
}
