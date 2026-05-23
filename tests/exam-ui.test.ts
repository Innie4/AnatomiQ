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

test("exam setup uses department-first searchable course selection", () => {
  const source = readFileSync("src/components/exam/exam-client.tsx", "utf8");

  assert.match(source, /Department/);
  assert.match(source, /Search courses/);
  assert.match(source, /Choose your department, then your course/);
  assert.match(source, /md:grid-cols-2 xl:grid-cols-3/);
  assert.match(source, /Question type/);
  assert.match(source, /Question number/);
  assert.match(source, /filteredCourses/);
});

test("exam timeout auto-submit is triggered outside timer state updaters", () => {
  const source = readFileSync("src/components/exam/exam-session-client.tsx", "utf8");
  const graceUpdaterStart = source.indexOf("setGraceTimeLeft((current) => {");
  const graceUpdaterEnd = source.indexOf("}, 1000);", graceUpdaterStart);
  const graceUpdater = source.slice(graceUpdaterStart, graceUpdaterEnd);

  assert.ok(graceUpdaterStart >= 0, "Grace countdown updater should exist");
  assert.doesNotMatch(graceUpdater, /autoSubmit|handleSubmitExam|router\.push|setSubmitting|setError/);
  assert.match(source, /submissionStartedRef/);
  assert.match(source, /graceTimeLeft !== 0/);
  assert.match(source, /void autoSubmit\(\)/);
});
