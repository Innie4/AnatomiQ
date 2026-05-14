import { NextRequest } from "next/server";

import { handleRouteError, ok, fail } from "@/lib/api";
import { getTopicTree } from "@/lib/topics";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { sanitizeSearchQuery } from "@/lib/sanitize";

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting (20 requests per minute for public endpoints)
    const clientIP = getClientIP(request.headers);
    const rateLimitResult = await rateLimit(clientIP, 'public');

    if (!rateLimitResult.success) {
      return fail(
        'Too many requests. Please try again later.',
        429,
        {
          'Retry-After': String(Math.ceil((rateLimitResult.reset - Date.now()) / 1000)),
          'X-RateLimit-Limit': String(rateLimitResult.limit),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': String(rateLimitResult.reset),
        }
      );
    }

    const search = request.nextUrl.searchParams.get("search");
    const courseSlug = request.nextUrl.searchParams.get("courseSlug") || undefined;
    const sanitizedSearch = search ? sanitizeSearchQuery(search) : undefined;
    const topics = await getTopicTree(sanitizedSearch, courseSlug);
    return ok({ topics });
  } catch (error) {
    return handleRouteError(error);
  }
}
