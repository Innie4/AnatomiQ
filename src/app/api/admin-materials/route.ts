import { handleRouteError, ok } from "@/lib/api";
import { assertAdminKey } from "@/lib/admin";
import { getAdminMaterialOptions } from "@/lib/questions";

export async function GET(request: Request) {
  try {
    assertAdminKey(request.headers.get("x-admin-upload-key"));
    const url = new URL(request.url);
    const materials = await getAdminMaterialOptions(url.searchParams.get("q") ?? undefined);
    return ok({ materials });
  } catch (error) {
    return handleRouteError(error);
  }
}
