import assert from "node:assert/strict";
import test from "node:test";

import { QUESTION_COUNT_OPTIONS } from "@/lib/constants";

test("exam question count dropdown exposes the full supported range", () => {
  assert.equal(QUESTION_COUNT_OPTIONS[0], 1);
  assert.equal(QUESTION_COUNT_OPTIONS.at(-1), 30);
  assert.equal(QUESTION_COUNT_OPTIONS.length, 30);
});
