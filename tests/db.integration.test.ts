import assert from "node:assert/strict";
import test from "node:test";

import { Difficulty, QuestionAuthoringMode, QuestionType } from "@prisma/client";

import { db } from "@/lib/db";
import { createManualQuestionBank, getAdminMaterialOptions } from "@/lib/questions";

import { cleanupCourse, createTestMaterial } from "./test-helpers";

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
