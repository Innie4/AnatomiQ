import assert from "node:assert/strict";
import test from "node:test";

import { Difficulty, QuestionType } from "@prisma/client";

import { UserInputError } from "../src/lib/errors";
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

test("manual question batch parser supports indented uppercase numbered sections", () => {
  const parsed = parseManualQuestionBatch({
    type: QuestionType.MCQ,
    defaultDifficulty: Difficulty.INTERMEDIATE,
    input: ` QUESTIONS

1. Amino acid metabolism refers to which of the following?
2. Which inherited metabolic diseases are caused by defects in amino acid metabolism?

 OPTIONS

1. A. Only the synthesis of amino acids | B. Biochemical processes of synthesis, breakdown, interconversion, and utilization of amino acids | C. Only the catabolism of amino acids | D. Transport of amino acids in the blood
2. A. Diabetes mellitus and hypertension | B. Phenylketonuria (PKU) and Maple Syrup Urine Disease (MSUD) | C. Sickle cell anemia and thalassemia | D. Hemophilia and Turner syndrome

 ANSWERS

1. B
2. B

EXPLANATIONS

1. The material defines amino acid metabolism as synthesis, breakdown, interconversion, and utilization of amino acids.
2. The material explicitly states PKU and MSUD are inherited metabolic diseases caused by defects in amino acid metabolism.`,
  });

  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].answer, "Biochemical processes of synthesis, breakdown, interconversion, and utilization of amino acids");
  assert.equal(parsed[1].answer, "Phenylketonuria (PKU) and Maple Syrup Urine Disease (MSUD)");
});

test("manual question batch parser supports large numbered MCQ banks", () => {
  const total = 200;
  const numberedLines = (prefix: string) =>
    Array.from({ length: total }, (_, index) => `${index + 1}. ${prefix} ${index + 1}`).join("\n");
  const optionLines = Array.from(
    { length: total },
    (_, index) =>
      `${index + 1}. A. Distractor A ${index + 1} | B. Correct answer ${index + 1} | C. Distractor C ${index + 1} | D. Distractor D ${index + 1}`,
  ).join("\n");
  const answerLines = Array.from({ length: total }, (_, index) => `${index + 1}. B`).join("\n");

  const parsed = parseManualQuestionBatch({
    type: QuestionType.MCQ,
    defaultDifficulty: Difficulty.INTERMEDIATE,
    input: ` QUESTIONS

${numberedLines("Question")}

 OPTIONS

${optionLines}

 ANSWERS

${answerLines}

 EXPLANATIONS

${numberedLines("Explanation")}`,
  });

  assert.equal(parsed.length, total);
  assert.equal(parsed[0].answer, "Correct answer 1");
  assert.equal(parsed[199].answer, "Correct answer 200");
});

test("manual question batch parser marks unsupported leading text as user input", () => {
  assert.throws(
    () =>
      parseManualQuestionBatch({
        type: QuestionType.SHORT_ANSWER,
        defaultDifficulty: Difficulty.INTERMEDIATE,
        input: `Here are my questions:
Question: State the nerve supply of the diaphragm.
Answer: The phrenic nerve.
Explanation: The phrenic nerve is the motor supply.`,
      }),
    (error) =>
      error instanceof UserInputError &&
      error.statusCode === 422 &&
      /contains text before a supported field label/i.test(error.message),
  );
});
