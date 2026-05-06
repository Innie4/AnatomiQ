import { handleRouteError, ok, fail } from "@/lib/api";
import { getAdminOverview } from "@/lib/admin-overview";
import { authenticateRequest } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    // Authenticate using JWT or legacy key
    const auth = await authenticateRequest(db, request);
    if (!auth) {
      return fail("Unauthorized", 401);
    }

    const overview = await getAdminOverview();
    return ok(overview);
  } catch (error) {
    return handleRouteError(error);
  }
}
