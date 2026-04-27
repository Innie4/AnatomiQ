import { handleRouteError, ok } from "@/lib/api";
import { buildExamSet } from "@/lib/questions";
import { startExamSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const payload = startExamSchema.parse(await request.json());
    const result = await buildExamSet(payload);
    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
