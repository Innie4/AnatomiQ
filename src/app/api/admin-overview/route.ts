import { handleRouteError, ok, fail } from "@/lib/api";
import { getAdminOverview } from "@/lib/admin-overview";
import { authenticateRequest } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

export async function GET(request: Request) {
  const prisma = new PrismaClient();
  try {
    // Authenticate using JWT or legacy key
    const auth = await authenticateRequest(prisma);
    if (!auth) {
      return fail("Unauthorized", 401);
    }

    const overview = await getAdminOverview();
    return ok(overview);
  } catch (error) {
    return handleRouteError(error);
  } finally {
    await prisma.$disconnect();
  }
}
