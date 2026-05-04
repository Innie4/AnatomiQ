import { Difficulty, QuestionType } from "@prisma/client";

import { handleRouteError, ok } from "@/lib/api";
import { assertAdminKey } from "@/lib/admin";
import { extractMaterialText } from "@/lib/ai/extractors";
import { MAX_UPLOAD_SIZE_BYTES } from "@/lib/constants";
import { createManualQuestionBank } from "@/lib/questions";
import { uploadManualQuestionBatchSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    assertAdminKey(request.headers.get("x-admin-upload-key"));
    const contentType = request.headers.get("content-type") ?? "";
    let payload: {
      materialId: string;
      type: "MCQ" | "SHORT_ANSWER" | "THEORY";
      defaultDifficulty: "FOUNDATIONAL" | "INTERMEDIATE" | "ADVANCED";
      input: string;
      extractionMethod?: string;
    };

    if (contentType.includes("application/json")) {
      payload = uploadManualQuestionBatchSchema.parse(await request.json());
    } else {
      const formData = await request.formData();
      const file = formData.get("file");
      const rawInput = String(formData.get("input") ?? "").trim();

      let input = rawInput;
      let extractionMethod: string | undefined;

      if (file instanceof File) {
        if (!["application/pdf", "text/plain"].includes(file.type)) {
          throw new Error("Bulk question files must be PDF or plain text.");
        }

        if (file.size > MAX_UPLOAD_SIZE_BYTES) {
          throw new Error("The uploaded question file exceeds the 25MB limit.");
        }

        const extraction = await extractMaterialText({
          buffer: Buffer.from(await file.arrayBuffer()),
          fileName: file.name,
          mimeType: file.type,
        });

        input = extraction.text;
        extractionMethod = extraction.method;
      }

      payload = {
        ...uploadManualQuestionBatchSchema.parse({
          materialId: formData.get("materialId"),
          type: formData.get("type"),
          defaultDifficulty: formData.get("defaultDifficulty"),
          input,
        }),
        extractionMethod,
      };
    }

    const result = await createManualQuestionBank({
      materialId: payload.materialId,
      type: payload.type as QuestionType,
      defaultDifficulty: payload.defaultDifficulty as Difficulty,
      input: payload.input,
    });

    return ok({
      ...result,
      extractionMethod: payload.extractionMethod ?? null,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
