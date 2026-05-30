import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

import { QUESTION_COUNT_OPTIONS, TIMER_OPTIONS } from "@/lib/constants";
import { startExamSchema } from "@/lib/schemas";

test("exam question count dropdown exposes the full supported range", () => {
  assert.equal(QUESTION_COUNT_OPTIONS[0], 5);
  assert.equal(QUESTION_COUNT_OPTIONS.at(-1), 100);
  assert.ok(QUESTION_COUNT_OPTIONS.length >= 10, "Should have at least 10 options");
  assert.ok(QUESTION_COUNT_OPTIONS.includes(10), "Should include 10 questions");
  assert.ok(QUESTION_COUNT_OPTIONS.includes(50), "Should include 50 questions");
  assert.ok(QUESTION_COUNT_OPTIONS.includes(100), "Should include 100 questions");
});

test("exam setup uses department-first modal course selection", () => {
  const source = readFileSync("src/components/exam/exam-client.tsx", "utf8");

  assert.match(source, /Pick your department arena/);
  assert.match(source, /departmentCards/);
  assert.match(source, /role="dialog"/);
  assert.match(source, /aria-modal="true"/);
  assert.match(source, /Search courses/);
  assert.match(source, /Build your exam quest/);
  assert.match(source, /grid gap-5 sm:grid-cols-2 xl:grid-cols-3/);
  assert.match(source, /Pick an uploaded course/);
  assert.match(source, /Question type/);
  assert.match(source, /Question number/);
  assert.match(source, /filteredCourses/);
  assert.match(source, /Select timer/);
  assert.match(source, /hasTimer/);
  assert.doesNotMatch(source, /Surprise me/);
  assert.doesNotMatch(source, /Sparkles/);
});

test("exam start requires an explicit positive timer", () => {
  assert.ok(TIMER_OPTIONS.every((option) => option.value > 0), "Timer options should all start exams with time limits");

  const missingTimer = startExamSchema.safeParse({
    topicSlug: "gross-anatomy",
    type: "MCQ",
    count: 10,
  });
  const zeroTimer = startExamSchema.safeParse({
    topicSlug: "gross-anatomy",
    type: "MCQ",
    count: 10,
    durationMinutes: 0,
  });

  assert.equal(missingTimer.success, false);
  assert.equal(zeroTimer.success, false);
});

test("shared UI has global gamified styling primitives", () => {
  const source = readFileSync("src/app/globals.css", "utf8");

  assert.match(source, /quest/i);
  assert.match(source, /\.glass-panel::after/);
  assert.match(source, /\.card::before/);
  assert.match(source, /clip-path/);
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
