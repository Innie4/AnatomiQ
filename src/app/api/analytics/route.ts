import { handleRouteError, ok } from "@/lib/api";
import { getPublicAnalytics } from "@/lib/analytics";

export async function GET() {
  try {
    const analytics = await getPublicAnalytics();
    return ok(analytics);
  } catch (error) {
    return handleRouteError(error);
  }
}
