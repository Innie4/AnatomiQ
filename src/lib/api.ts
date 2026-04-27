import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

export function handleRouteError(error: unknown) {
  if (error instanceof ZodError) {
    return fail("Validation failed.", 422, error.flatten());
  }

  const message = error instanceof Error ? error.message : "Unexpected server error.";
  const status =
    /invalid admin upload key/i.test(message)
      ? 401
      : /not configured/i.test(message)
        ? 503
        : 500;
  return fail(message, status);
}
