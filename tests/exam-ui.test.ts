import assert from "node:assert/strict";
import test from "node:test";

import { QUESTION_COUNT_OPTIONS } from "@/lib/constants";

test("exam question count dropdown exposes the full supported range", () => {
  assert.equal(QUESTION_COUNT_OPTIONS[0], 5);
  assert.equal(QUESTION_COUNT_OPTIONS.at(-1), 100);
  assert.ok(QUESTION_COUNT_OPTIONS.length >= 10, "Should have at least 10 options");
  assert.ok(QUESTION_COUNT_OPTIONS.includes(10), "Should include 10 questions");
  assert.ok(QUESTION_COUNT_OPTIONS.includes(50), "Should include 50 questions");
  assert.ok(QUESTION_COUNT_OPTIONS.includes(100), "Should include 100 questions");
});
