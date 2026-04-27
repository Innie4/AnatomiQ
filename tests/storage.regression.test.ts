import test from "node:test";
import assert from "node:assert/strict";

import { normalizeStorageKey, resolveLocalStoragePath } from "../src/lib/storage";

test("storage keys normalize clean nested paths", () => {
  assert.equal(
    normalizeStorageKey("materials//human-anatomy///example.pdf"),
    "materials/human-anatomy/example.pdf",
  );
});

test("storage keys reject traversal attempts", () => {
  assert.throws(() => normalizeStorageKey("../secrets.txt"));
});

test("local storage path stays rooted inside the configured storage directory", () => {
  const resolved = resolveLocalStoragePath("materials/human-anatomy/example.pdf");
  assert.match(resolved.replace(/\\/g, "/"), /storage\/materials\/human-anatomy\/example\.pdf$/);
});
