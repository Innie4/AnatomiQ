import assert from "node:assert/strict";
import test from "node:test";

import { db } from "@/lib/db";
import { GET as getAdminMaterials } from "@/app/api/admin-materials/route";
import { POST as startExam } from "@/app/api/start-exam/route";
import { POST as uploadManualQuestions } from "@/app/api/upload-manual-questions/route";

import { cleanupCourse, createTestMaterial } from "./test-helpers";

test("admin material API and manual upload API work end to end", async () => {
  const material = await createTestMaterial();
  const adminKey = process.env.ADMIN_UPLOAD_KEY ?? "";

  try {
    const materialsResponse = await getAdminMaterials(
      new Request(`http://localhost/api/admin-materials?q=${encodeURIComponent(material.title)}`, {
        headers: { "x-admin-upload-key": adminKey },
      }),
    );
    const materialsPayload = (await materialsResponse.json()) as {
      materials: Array<{ id: string; title: string }>;
    };

    assert.equal(materialsResponse.status, 200);
    assert.ok(materialsPayload.materials.some((item) => item.id === material.id));

    const uploadResponse = await uploadManualQuestions(
      new Request("http://localhost/api/upload-manual-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-upload-key": adminKey,
        },
        body: JSON.stringify({
          materialId: material.id,
          type: "SHORT_ANSWER",
          defaultDifficulty: "FOUNDATIONAL",
          input: `Question: State the nerve supply of the diaphragm.
Answer: The phrenic nerve supplies the diaphragm.
Explanation: The phrenic nerve is the main motor supply.`,
        }),
      }),
    );
    const uploadPayload = (await uploadResponse.json()) as { createdCount: number };

    assert.equal(uploadResponse.status, 200);
    assert.equal(uploadPayload.createdCount, 1);

    const examResponse = await startExam(
      new Request("http://localhost/api/start-exam", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topicSlug: material.topic.slug,
          subtopicSlug: material.subtopic?.slug,
          type: "SHORT_ANSWER",
          count: 1,
        }),
      }),
    );
    const examPayload = (await examResponse.json()) as {
      questions: Array<{ stem: string; answer: string }>;
    };

    assert.equal(examResponse.status, 200);
    assert.equal(examPayload.questions.length, 1);
    assert.match(examPayload.questions[0].answer, /phrenic nerve/i);
  } finally {
    await db.question.deleteMany({
      where: {
        materialId: material.id,
      },
    });
    await cleanupCourse(material.course.id);
  }
});
