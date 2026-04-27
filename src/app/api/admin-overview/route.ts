import { handleRouteError, ok } from "@/lib/api";
import { assertAdminKey } from "@/lib/admin";
import { getAdminOverview } from "@/lib/admin-overview";

export async function GET(request: Request) {
  try {
    assertAdminKey(request.headers.get("x-admin-upload-key"));
    const overview = await getAdminOverview();
    return ok(overview);
  } catch (error) {
    return handleRouteError(error);
  }
}
