import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

export function handleRouteError(error: unknown) {
  // Always log the full error for debugging
  console.error("[api] Route error:", error);

  if (error instanceof ZodError) {
    return fail("Validation failed.", 422, error.flatten());
  }

  const message = error instanceof Error ? error.message : "Unexpected server error.";
  const stack = error instanceof Error ? error.stack : undefined;

  // Log stack trace for non-validation errors
  if (stack) {
    console.error("[api] Stack trace:", stack);
  }

  const status =
    /invalid admin upload key/i.test(message)
      ? 401
      : /not configured/i.test(message)
        ? 503
        : 500;

  // In development, include more details
  const isDev = process.env.NODE_ENV !== "production";
  const details = isDev && error instanceof Error ? { message, stack } : undefined;

  return fail(message, status, details);
}
