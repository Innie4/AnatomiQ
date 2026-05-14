import { fail, ok } from "@/lib/api";
import { authenticateRequest } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const auth = await authenticateRequest(db, request);
  if (!auth) {
    return fail("Unauthorized", 401);
  }

  return ok({ valid: true });
}
