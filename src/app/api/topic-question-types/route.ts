import { z } from "zod";
import { handleRouteError, ok } from "@/lib/api";
import { db } from "@/lib/db";
import { hasDatabase } from "@/lib/env";

const querySchema = z.object({
  topicSlug: z.string().min(1),
  subtopicSlug: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const params = querySchema.parse({
      topicSlug: searchParams.get("topicSlug"),
      subtopicSlug: searchParams.get("subtopicSlug") || undefined,
    });

    if (!hasDatabase) {
      return ok({
        availableTypes: [],
        counts: { MCQ: 0, SHORT_ANSWER: 0, THEORY: 0 },
      });
    }

    console.log("[topic-question-types] Fetching available types for:", params);

    // Find topic by slug
    const topic = await db.topic.findUnique({
      where: { slug: params.topicSlug },
      select: { id: true },
    });

    if (!topic) {
      return ok({
        availableTypes: [],
        counts: { MCQ: 0, SHORT_ANSWER: 0, THEORY: 0 },
      });
    }

    let subtopicId: string | null = null;
    if (params.subtopicSlug) {
      const subtopic = await db.topic.findUnique({
        where: { slug: params.subtopicSlug },
        select: { id: true },
      });
      subtopicId = subtopic?.id ?? null;
    }

    // Count questions by type
    const whereClause = subtopicId
      ? { subtopicId }
      : { topicId: topic.id, subtopicId: null };

    const [mcqCount, shortAnswerCount, theoryCount] = await Promise.all([
      db.question.count({
        where: { ...whereClause, type: "MCQ" },
      }),
      db.question.count({
        where: { ...whereClause, type: "SHORT_ANSWER" },
      }),
      db.question.count({
        where: { ...whereClause, type: "THEORY" },
      }),
    ]);

    console.log("[topic-question-types] Counts:", { mcqCount, shortAnswerCount, theoryCount });

    const availableTypes: Array<"MCQ" | "SHORT_ANSWER" | "THEORY"> = [];
    if (mcqCount > 0) availableTypes.push("MCQ");
    if (shortAnswerCount > 0) availableTypes.push("SHORT_ANSWER");
    if (theoryCount > 0) availableTypes.push("THEORY");

    return ok({
      availableTypes,
      counts: {
        MCQ: mcqCount,
        SHORT_ANSWER: shortAnswerCount,
        THEORY: theoryCount,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
