import { handleRouteError, ok } from "@/lib/api";
import { gradeExamAnswers } from "@/lib/questions";
import { gradeExamSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const payload = gradeExamSchema.parse(await request.json());
    const result = await gradeExamAnswers(payload.answers);
    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
