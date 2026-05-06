import { Difficulty, QuestionType } from "@prisma/client";

import { handleRouteError, ok, fail } from "@/lib/api";
import { authenticateRequest } from "@/lib/auth";
import { createManualQuestion, listManualQuestions } from "@/lib/questions";
import { createManualQuestionSchema, materialQuestionQuerySchema } from "@/lib/schemas";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(db, request);
    if (!auth) {
      return fail("Unauthorized", 401);
    }

    const url = new URL(request.url);
    const query = materialQuestionQuerySchema.parse({
      materialId: url.searchParams.get("materialId"),
    });
    const questions = await listManualQuestions(query.materialId);
    return ok({ questions });
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

    const payload = createManualQuestionSchema.parse(await request.json());
    const question = await createManualQuestion({
      materialId: payload.materialId,
      payload: {
        manualOrder: payload.manualOrder,
        type: payload.type as QuestionType,
        stem: payload.stem,
        answer: payload.answer,
        explanation: payload.explanation,
        difficulty: payload.difficulty as Difficulty,
        options: payload.options,
      },
    });

    return ok({ question });
  } catch (error) {
    return handleRouteError(error);
  }
}
