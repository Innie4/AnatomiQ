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
---
Question: Name the layers of the scalp.
Answer: Skin, connective tissue, aponeurosis, loose areolar tissue, and pericranium.`;

  assert.equal(countManualQuestionBlocks(input), 2);

  const parsed = parseManualQuestionBatch({
    type: QuestionType.SHORT_ANSWER,
    defaultDifficulty: Difficulty.ADVANCED,
    input,
  });

  assert.equal(parsed.length, 2);
  assert.equal(parsed[1].difficulty, Difficulty.ADVANCED);
});
