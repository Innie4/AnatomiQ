import { handleRouteError, ok, fail } from "@/lib/api";
import { authenticateRequest } from "@/lib/auth";
import { getAdminMaterialOptions } from "@/lib/questions";
import { db } from "@/lib/db";
import { sanitizeSearchQuery } from "@/lib/sanitize";

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(db, request);
    if (!auth) {
      return fail("Unauthorized", 401);
    }

    const url = new URL(request.url);
    const query = url.searchParams.get("q");
    const sanitizedQuery = query ? sanitizeSearchQuery(query) : undefined;
    const materials = await getAdminMaterialOptions(sanitizedQuery);
    return ok({ materials });
  } catch (error) {
    return handleRouteError(error);
  }
}
