import { Difficulty, QuestionType } from "@prisma/client";

import { handleRouteError, ok } from "@/lib/api";
import { assertAdminKey } from "@/lib/admin";
import { createManualQuestionBank } from "@/lib/questions";
import { uploadManualQuestionBatchSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    assertAdminKey(request.headers.get("x-admin-upload-key"));
    const payload = uploadManualQuestionBatchSchema.parse(await request.json());
    const result = await createManualQuestionBank({
      materialId: payload.materialId,
      type: payload.type as QuestionType,
      defaultDifficulty: payload.defaultDifficulty as Difficulty,
      input: payload.input,
    });

    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
