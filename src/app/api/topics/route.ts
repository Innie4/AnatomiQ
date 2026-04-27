import { NextRequest } from "next/server";

import { handleRouteError, ok } from "@/lib/api";
import { getTopicTree } from "@/lib/topics";

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get("search") ?? undefined;
    const topics = await getTopicTree(search);
    return ok({ topics });
  } catch (error) {
    return handleRouteError(error);
  }
}
