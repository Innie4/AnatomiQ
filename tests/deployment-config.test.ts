import assert from "node:assert/strict";
import { test } from "node:test";

import nextConfig from "../next.config";

test("PDF processing routes include the pdfjs worker in deployment traces", () => {
  const includes = nextConfig.outputFileTracingIncludes ?? {};

  for (const route of ["/api/process-material", "/api/upload-manual-questions"]) {
    const patterns = includes[route] ?? [];
    assert.ok(
      patterns.some((pattern) => pattern.includes("pdfjs-dist/legacy/build/pdf.worker")),
      `${route} must ship the pdfjs worker for Vercel PDF extraction`,
    );
  }
});
