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

  if (error instanceof SyntaxError) {
    return fail("Malformed JSON request body.", 400);
  }

  const message = error instanceof Error ? error.message : "Unexpected server error.";
  const stack = error instanceof Error ? error.stack : undefined;
  const errorLike = error as { code?: string; statusCode?: number };

  // Log stack trace for non-validation errors
  if (stack) {
    console.error("[api] Stack trace:", stack);
  }

  let status = 500;
  if (typeof errorLike.statusCode === "number") {
    status = errorLike.statusCode;
  } else if (errorLike.code === "P2025") {
    status = 404;
  } else if (errorLike.code === "P2002") {
    status = 409;
  } else if (errorLike.code === "P1001" || errorLike.code === "P2024") {
    status = 503;
  } else if (/invalid admin upload key/i.test(message)) {
    status = 401;
  } else if (/not configured/i.test(message)) {
    status = 503;
  } else if (
    /bulk question files|question \d+ is empty|question block \d+ must include|answer \d+ is empty|explanation \d+ is empty|options for question|does not match the provided options|mcq questions require|the answer must match|already in use|highly similar question/i.test(
      message,
    )
  ) {
    status = 422;
  }

  // In development, include more details
  const isDev = process.env.NODE_ENV !== "production";
  const details = isDev && error instanceof Error ? { message, stack } : undefined;

  return fail(message, status, details);
}
