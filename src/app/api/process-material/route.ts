import { handleRouteError, ok } from "@/lib/api";
import { assertAdminKey } from "@/lib/admin";
import { processMaterial } from "@/lib/materials";
import { processMaterialSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    assertAdminKey(request.headers.get("x-admin-upload-key"));
    const payload = processMaterialSchema.parse(await request.json());
    const result = await processMaterial(payload.materialId);
    return ok({ result });
  } catch (error) {
    return handleRouteError(error);
  }
}
