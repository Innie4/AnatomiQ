import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

import { QUESTION_COUNT_OPTIONS } from "@/lib/constants";

test("exam question count dropdown exposes the full supported range", () => {
  assert.equal(QUESTION_COUNT_OPTIONS[0], 5);
  assert.equal(QUESTION_COUNT_OPTIONS.at(-1), 100);
  assert.ok(QUESTION_COUNT_OPTIONS.length >= 10, "Should have at least 10 options");
  assert.ok(QUESTION_COUNT_OPTIONS.includes(10), "Should include 10 questions");
  assert.ok(QUESTION_COUNT_OPTIONS.includes(50), "Should include 50 questions");
  assert.ok(QUESTION_COUNT_OPTIONS.includes(100), "Should include 100 questions");
});

test("exam setup controls use wider responsive grid spans", () => {
  const source = readFileSync("src/components/exam/exam-client.tsx", "utf8");

  assert.match(source, /xl:grid-cols-6/);
  assert.match(source, /Question type/);
  assert.match(source, /Question number/);
  assert.ok((source.match(/xl:col-span-2/g) ?? []).length >= 6);
});

test("exam timeout auto-submit is triggered outside timer state updaters", () => {
  const source = readFileSync("src/components/exam/exam-session-client.tsx", "utf8");
  const graceTimerBlock = source.match(/setGraceTimeLeft\(\(current\) => \{[\s\S]*?return current - 1;[\s\S]*?\}\);/);

  assert.ok(graceTimerBlock, "Grace countdown should use a state updater");
  assert.doesNotMatch(
    graceTimerBlock[0],
    /autoSubmit|handleSubmitExam|router\.push|setSubmitting|setError/,
    "Grace countdown updater must stay pure so timeout grading does not crash React",
  );
  assert.match(source, /submissionStartedRef/, "Auto-submit should guard against duplicate grading requests");
  assert.match(source, /graceTimeLeft !== 0/, "Grace expiry should be observed by an effect");
  assert.match(source, /void autoSubmit\(\)/, "Grace expiry should trigger automatic grading");
});
