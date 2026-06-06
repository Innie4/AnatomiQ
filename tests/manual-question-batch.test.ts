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

test("manual question batch parser accepts answer letters for numeric options", () => {
  const parsed = parseManualQuestionBatch({
    type: QuestionType.MCQ,
    defaultDifficulty: Difficulty.INTERMEDIATE,
    input: `QUESTIONS

38. How many ATP molecules are required for carbamoyl phosphate formation?

OPTIONS

38. A. 1 | B. 2 | C. 3 | D. 4

ANSWERS

38. B

EXPLANATIONS

38. The material states formation of carbamoyl phosphate requires 2 ATP.`,
  });

  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].manualOrder, 38);
  assert.equal(parsed[0].answer, "2");
  assert.deepEqual(parsed[0].options, ["1", "2", "3", "4"]);
});

test("manual question batch parser accepts compact answer rows", () => {
  const parsed = parseManualQuestionBatch({
    type: QuestionType.MCQ,
    defaultDifficulty: Difficulty.INTERMEDIATE,
    input: `QUESTIONS

1. What is direct current?
2. Which motors are simpler than d.c. motors?
3. What is the common power-system frequency?

OPTIONS

1. A. Reversing current | B. Steady one-direction current | C. Capacitor-only current | D. Sinusoidal current
2. A. Series motors | B. Universal motors | C. Induction motors | D. Stepper motors
3. A. 25 Hz | B. 60 Hz | C. 100 Hz | D. 50 Hz

ANSWERS

1-B | 2-C | 3-D

EXPLANATIONS

1. Direct current is steady and flows in one direction.
2. The material identifies induction motors as cheaper and simpler.
3. The material states the common frequency is 50 Hz.`,
  });

  assert.equal(parsed.length, 3);
  assert.equal(parsed[0].answer, "Steady one-direction current");
  assert.equal(parsed[1].answer, "Induction motors");
  assert.equal(parsed[2].answer, "50 Hz");
});

test("manual question batch parser accepts wrapped and variable MCQ options", () => {
  const parsed = parseManualQuestionBatch({
    type: QuestionType.MCQ,
    defaultDifficulty: Difficulty.INTERMEDIATE,
    input: `QUESTIONS

1. What news does the first Messenger bring from Rome to Antony?
2. Which label can still point to a fifth option?

OPTIONS

1. A. News of Fulvia's death | B. News that Pompey has surrendered | C. Mandates and updates from Octavius
Caesar | D. News of an invasion by Parthia
2. A. First choice | B. Second choice | C. Third choice | D. Fourth choice | E. Fifth choice

ANSWERS

1. C
2. E

EXPLANATIONS

1. The PDF can wrap a single labeled option across lines.
2. Manual uploads are not limited to four choices.`,
  });

  assert.equal(parsed.length, 2);
  assert.deepEqual(parsed[0].options, [
    "News of Fulvia's death",
    "News that Pompey has surrendered",
    "Mandates and updates from Octavius Caesar",
    "News of an invasion by Parthia",
  ]);
  assert.equal(parsed[0].answer, "Mandates and updates from Octavius Caesar");
  assert.deepEqual(parsed[1].options, [
    "First choice",
    "Second choice",
    "Third choice",
    "Fourth choice",
    "Fifth choice",
  ]);
  assert.equal(parsed[1].answer, "Fifth choice");
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
