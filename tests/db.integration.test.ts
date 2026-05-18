import assert from "node:assert/strict";
import test from "node:test";

import { Difficulty, QuestionAuthoringMode, QuestionType } from "@prisma/client";

import { db } from "@/lib/db";
import { createManualQuestionBank, getAdminMaterialOptions } from "@/lib/questions";

import { cleanupCourse, createTestMaterial } from "./test-helpers";

function buildLargeNumberedMcqBank(total: number) {
  const numberedLines = (prefix: string) =>
    Array.from({ length: total }, (_, index) => {
      const number = index + 1;
      return `${number}. ${prefix} marker${number} code${number}`;
    }).join("\n");
  const optionLines = Array.from(
    { length: total },
    (_, index) => {
      const number = index + 1;
      return `${number}. A. Distractor alpha marker${number} | B. Correct beta marker${number} | C. Distractor gamma marker${number} | D. Distractor delta marker${number}`;
    },
  ).join("\n");
  const answerLines = Array.from({ length: total }, (_, index) => `${index + 1}. B`).join("\n");

  return `QUESTIONS

${numberedLines("Large import question")}

OPTIONS

${optionLines}

ANSWERS

${answerLines}

EXPLANATIONS

${numberedLines("Large import explanation")}`;
}

test("database migration exposes manual question columns", async () => {
  const columns = (await db.$queryRawUnsafe(`
    select column_name
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'Question'
      and column_name in ('materialId', 'authoringMode', 'manualOrder')
    order by column_name
  `)) as Array<{ column_name: string }>;

  assert.deepEqual(
    columns.map((column) => column.column_name),
    ["authoringMode", "manualOrder", "materialId"].sort(),
  );
});

test("database migration exposes material processing timestamps", async () => {
  const columns = (await db.$queryRawUnsafe(`
    select column_name
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'Material'
      and column_name in ('processingStartedAt', 'processedAt')
    order by column_name
  `)) as Array<{ column_name: string }>;

  assert.deepEqual(
    columns.map((column) => column.column_name),
    ["processedAt", "processingStartedAt"].sort(),
  );
});

test("manual question order is unique per material and question type", async () => {
  const indexes = (await db.$queryRawUnsafe(`
    select indexname, indexdef
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'Question'
      and indexname in (
        'Question_materialId_manualOrder_key',
        'Question_materialId_type_manualOrder_key'
      )
    order by indexname
  `)) as Array<{ indexname: string; indexdef: string }>;

  assert.equal(indexes.some((index) => index.indexname === "Question_materialId_manualOrder_key"), false);
  assert.ok(
    indexes.some(
      (index) =>
        index.indexname === "Question_materialId_type_manualOrder_key" &&
        index.indexdef.includes('"materialId", type, "manualOrder"'),
    ),
  );
});

test("manual question service links uploaded questions to the target material", async () => {
  const material = await createTestMaterial();

  try {
    const result = await createManualQuestionBank({
      materialId: material.id,
      type: QuestionType.MCQ,
      defaultDifficulty: Difficulty.INTERMEDIATE,
      input: `Question: Which chamber forms the apex of the heart?
Options:
- Right ventricle
- Left ventricle
- Right atrium
- Left atrium
Answer: Left ventricle
Explanation: The apex is formed by the left ventricle.
---
Question: Which chamber forms the apex of the heart?
Options:
- Right ventricle
- Left ventricle
- Right atrium
- Left atrium
Answer: Left ventricle
Explanation: The apex is formed by the left ventricle.`,
    });

    assert.equal(result.createdCount, 1);
    assert.equal(result.skippedCount, 1);

    const storedQuestions = await db.question.findMany({
      where: { materialId: material.id },
      orderBy: { createdAt: "asc" },
    });

    assert.equal(storedQuestions.length, 1);
    assert.equal(storedQuestions[0].authoringMode, QuestionAuthoringMode.MANUAL);
    assert.equal(storedQuestions[0].type, QuestionType.MCQ);
    assert.equal(storedQuestions[0].manualOrder, 1);

    const materials = await getAdminMaterialOptions(material.title);
    const match = materials.find((item) => item.id === material.id);

    assert.ok(match);
    assert.equal(match?.linkedQuestionCount, 1);
  } finally {
    await cleanupCourse(material.course.id);
  }
});

test("manual question banks can reuse question numbers across different types", async () => {
  const material = await createTestMaterial();

  try {
    const mcqResult = await createManualQuestionBank({
      materialId: material.id,
      type: QuestionType.MCQ,
      defaultDifficulty: Difficulty.INTERMEDIATE,
      input: `Question: Which chamber forms the apex of the heart?
Options:
- Right ventricle
- Left ventricle
- Right atrium
- Left atrium
Answer: Left ventricle
Explanation: The apex is formed by the left ventricle.`,
    });

    const shortAnswerResult = await createManualQuestionBank({
      materialId: material.id,
      type: QuestionType.SHORT_ANSWER,
      defaultDifficulty: Difficulty.FOUNDATIONAL,
      input: `Question: State the principal motor nerve supply of the diaphragm.
Answer: The phrenic nerve supplies the diaphragm.
Explanation: The phrenic nerve provides the primary motor supply.`,
    });

    assert.equal(mcqResult.createdCount, 1);
    assert.equal(shortAnswerResult.createdCount, 1);

    const storedQuestions = await db.question.findMany({
      where: { materialId: material.id },
      orderBy: [{ type: "asc" }, { manualOrder: "asc" }],
      select: { type: true, manualOrder: true },
    });

    assert.deepEqual(
      storedQuestions.map((question) => ({ type: question.type, manualOrder: question.manualOrder })),
      [
        { type: QuestionType.MCQ, manualOrder: 1 },
        { type: QuestionType.SHORT_ANSWER, manualOrder: 1 },
      ],
    );
  } finally {
    await cleanupCourse(material.course.id);
  }
});

test("manual question service persists large numbered banks in one batch", async () => {
  const material = await createTestMaterial();
  const total = 200;

  try {
    const result = await createManualQuestionBank({
      materialId: material.id,
      type: QuestionType.MCQ,
      defaultDifficulty: Difficulty.INTERMEDIATE,
      input: buildLargeNumberedMcqBank(total),
    });

    assert.equal(result.createdCount, total);
    assert.equal(result.skippedCount, 0);
    assert.equal(result.totalSubmitted, total);

    const storedCount = await db.question.count({
      where: {
        materialId: material.id,
        authoringMode: QuestionAuthoringMode.MANUAL,
        type: QuestionType.MCQ,
      },
    });

    assert.equal(storedCount, total);
  } finally {
    await cleanupCourse(material.course.id);
  }
});
