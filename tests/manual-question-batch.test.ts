import assert from "node:assert/strict";
import test from "node:test";

import { Difficulty, QuestionType } from "@prisma/client";

import { countManualQuestionBlocks, parseManualQuestionBatch } from "../src/lib/manual-question-batch";

test("manual question batch parser handles mcq blocks and answer letters", () => {
  const parsed = parseManualQuestionBatch({
    type: QuestionType.MCQ,
    defaultDifficulty: Difficulty.INTERMEDIATE,
    input: `Question: Which chamber forms the apex of the heart?
Options:
- Right ventricle
- Left ventricle
- Right atrium
- Left atrium
Answer: B
Explanation: The apex is formed by the left ventricle.
Difficulty: Foundational`,
  });

  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].answer, "Left ventricle");
  assert.deepEqual(parsed[0].options, [
    "Right ventricle",
    "Left ventricle",
    "Right atrium",
    "Left atrium",
  ]);
  assert.equal(parsed[0].difficulty, Difficulty.FOUNDATIONAL);
});

test("manual question batch parser counts blocks and supports short answers", () => {
  const input = `Question: State the nerve supply of the diaphragm.
Answer: The phrenic nerve.
Explanation: The phrenic nerve is the motor supply.
---
Question: Name the layers of the scalp.
Answer: Skin, connective tissue, aponeurosis, loose areolar tissue, and pericranium.
Explanation: These five layers form the mnemonic SCALP.`;

  assert.equal(countManualQuestionBlocks(input), 2);

  const parsed = parseManualQuestionBatch({
    type: QuestionType.SHORT_ANSWER,
    defaultDifficulty: Difficulty.ADVANCED,
    input,
  });

  assert.equal(parsed.length, 2);
  assert.equal(parsed[1].difficulty, Difficulty.ADVANCED);
});

test("manual question batch parser supports numbered sections", () => {
  const parsed = parseManualQuestionBatch({
    type: QuestionType.MCQ,
    defaultDifficulty: Difficulty.INTERMEDIATE,
    input: `Questions
1. Which chamber forms the apex of the heart?

Options
1. Right ventricle | Left ventricle | Right atrium | Left atrium

Answers
1. B

Explanations
1. The left ventricle forms the apex of the heart.

Difficulties
1. Foundational`,
  });

  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].manualOrder, 1);
  assert.equal(parsed[0].answer, "Left ventricle");
  assert.equal(parsed[0].explanation, "The left ventricle forms the apex of the heart.");
});
