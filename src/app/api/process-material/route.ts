import { handleRouteError, ok, fail } from "@/lib/api";
import { authenticateRequest } from "@/lib/auth";
import { processMaterial } from "@/lib/materials";
import { processMaterialSchema } from "@/lib/schemas";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(db, request);
    if (!auth) {
      return fail("Unauthorized", 401);
    }

    const payload = processMaterialSchema.parse(await request.json());
    const result = await processMaterial(payload.materialId);
    return ok({ result });
  } catch (error) {
    return handleRouteError(error);
  }
}
