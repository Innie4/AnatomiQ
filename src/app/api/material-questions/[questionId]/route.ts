import { Difficulty, QuestionType } from "@prisma/client";

import { handleRouteError, ok, fail } from "@/lib/api";
import { authenticateRequest } from "@/lib/auth";
import { deleteManualQuestion, updateManualQuestion } from "@/lib/questions";
import { updateManualQuestionSchema } from "@/lib/schemas";
import { db } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ questionId: string }> },
) {
  try {
    const auth = await authenticateRequest(db, request);
    if (!auth) {
      return fail("Unauthorized", 401);
    }

    const payload = updateManualQuestionSchema.parse(await request.json());
    const { questionId } = await params;
    const question = await updateManualQuestion({
      questionId,
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ questionId: string }> },
) {
  try {
    const auth = await authenticateRequest(db, request);
    if (!auth) {
      return fail("Unauthorized", 401);
    }

    const { questionId } = await params;
    await deleteManualQuestion(questionId);
    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
