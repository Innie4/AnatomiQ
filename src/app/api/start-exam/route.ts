import { handleRouteError, ok } from "@/lib/api";
import { buildExamSet } from "@/lib/questions";
import { startExamSchema } from "@/lib/schemas";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Rate limiting - 30 requests per 15 minutes
    const ip = getClientIP(new Headers(request.headers));
    const rateLimitResult = await rateLimit(ip, "questionGeneration");

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Too many requests",
          message: "Rate limit exceeded. Please try again later.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((rateLimitResult.reset - Date.now()) / 1000)),
            "X-RateLimit-Limit": String(rateLimitResult.limit),
            "X-RateLimit-Remaining": String(rateLimitResult.remaining),
            "X-RateLimit-Reset": String(rateLimitResult.reset),
          },
        }
      );
    }

    // Parse JSON with error handling
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON", message: "Request body must be valid JSON" },
        { status: 400 }
      );
    }

    const payload = startExamSchema.parse(body);
    const result = await buildExamSet(payload);
    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
