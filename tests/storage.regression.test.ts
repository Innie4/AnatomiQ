import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

import { resolveLocalStoragePath } from "../src/lib/storage";

test("local storage path stays rooted inside the configured storage directory", () => {
  const resolved = resolveLocalStoragePath("materials/human-anatomy/example.pdf");
  assert.ok(resolved.endsWith(path.join("storage", "materials", "human-anatomy", "example.pdf")));
});

test("local storage rejects traversal attempts", () => {
  assert.throws(() => resolveLocalStoragePath("../secrets.txt"));
});
