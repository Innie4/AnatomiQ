import { handleRouteError, ok } from "@/lib/api";
import { gradeMcqAnswers } from "@/lib/questions";
import { gradeMcqSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const payload = gradeMcqSchema.parse(await request.json());
    const result = await gradeMcqAnswers(payload.answers);
    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
