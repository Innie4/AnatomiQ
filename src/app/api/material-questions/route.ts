import { Difficulty, QuestionType } from "@prisma/client";

import { handleRouteError, ok } from "@/lib/api";
import { assertAdminKey } from "@/lib/admin";
import { createManualQuestion, listManualQuestions } from "@/lib/questions";
import { createManualQuestionSchema, materialQuestionQuerySchema } from "@/lib/schemas";

export async function GET(request: Request) {
  try {
    assertAdminKey(request.headers.get("x-admin-upload-key"));
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
    assertAdminKey(request.headers.get("x-admin-upload-key"));
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
