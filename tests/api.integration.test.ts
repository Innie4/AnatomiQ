import assert from "node:assert/strict";
import test from "node:test";

import { db } from "@/lib/db";
import { GET as getAdminMaterials } from "@/app/api/admin-materials/route";
import { POST as gradeExam } from "@/app/api/grade-exam/route";
import { DELETE as deleteMaterialQuestion, PATCH as patchMaterialQuestion } from "@/app/api/material-questions/[questionId]/route";
import { GET as getMaterialQuestions, POST as postMaterialQuestion } from "@/app/api/material-questions/route";
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

    const formData = new FormData();
    formData.append("materialId", material.id);
    formData.append("type", "SHORT_ANSWER");
    formData.append("defaultDifficulty", "FOUNDATIONAL");
    formData.append(
      "input",
      `Questions
1. State the nerve supply of the diaphragm.
2. Name the layers of the scalp.

Answers
1. The phrenic nerve supplies the diaphragm.
2. Skin, connective tissue, aponeurosis, loose areolar tissue, and pericranium.

Explanations
1. The phrenic nerve is the main motor supply.
2. These five layers form the mnemonic SCALP.`,
    );

    const uploadResponse = await uploadManualQuestions(
      new Request("http://localhost/api/upload-manual-questions", {
        method: "POST",
        headers: {
          "x-admin-upload-key": adminKey,
        },
        body: formData,
      }),
    );
    const uploadPayload = (await uploadResponse.json()) as { createdCount: number; updatedCount: number };

    assert.equal(uploadResponse.status, 200);
    assert.equal(uploadPayload.createdCount, 2);
    assert.equal(uploadPayload.updatedCount, 0);

    const manualQuestionsResponse = await getMaterialQuestions(
      new Request(`http://localhost/api/material-questions?materialId=${material.id}`, {
        headers: { "x-admin-upload-key": adminKey },
      }),
    );
    const manualQuestionsPayload = (await manualQuestionsResponse.json()) as {
      questions: Array<{ id: string; manualOrder: number; type: string; answer: string }>;
    };

    assert.equal(manualQuestionsResponse.status, 200);
    assert.equal(manualQuestionsPayload.questions.length, 2);

    const firstQuestion = manualQuestionsPayload.questions[0];
    const secondQuestion = manualQuestionsPayload.questions[1];

    const patchResponse = await patchMaterialQuestion(
      new Request(`http://localhost/api/material-questions/${firstQuestion.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-upload-key": adminKey,
        },
        body: JSON.stringify({
          manualOrder: firstQuestion.manualOrder,
          type: "SHORT_ANSWER",
          stem: "State the principal motor nerve supply of the diaphragm.",
          answer: "The phrenic nerve supplies the diaphragm.",
          explanation: "The phrenic nerve provides the primary motor supply.",
          difficulty: "FOUNDATIONAL",
        }),
      }),
      { params: Promise.resolve({ questionId: firstQuestion.id }) },
    );

    assert.equal(patchResponse.status, 200);

    const createQuestionResponse = await postMaterialQuestion(
      new Request("http://localhost/api/material-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-upload-key": adminKey,
        },
        body: JSON.stringify({
          materialId: material.id,
          manualOrder: 3,
          type: "MCQ",
          stem: "Which chamber forms the apex of the heart?",
          options: ["Right ventricle", "Left ventricle", "Right atrium", "Left atrium"],
          answer: "Left ventricle",
          explanation: "The apex is formed by the left ventricle.",
          difficulty: "FOUNDATIONAL",
        }),
      }),
    );

    assert.equal(createQuestionResponse.status, 200);

    const gradeResponse = await gradeExam(
      new Request("http://localhost/api/grade-exam", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answers: [
            {
              questionId: firstQuestion.id,
              response: "The phrenic nerve supplies the diaphragm.",
            },
            {
              questionId: secondQuestion.id,
              response: "Wrong answer",
            },
            {
              questionId: ((await createQuestionResponse.json()) as { question: { id: string } }).question.id,
              response: "Left ventricle",
            },
          ],
        }),
      }),
    );
    const gradePayload = (await gradeResponse.json()) as { score: number; total: number; percentage: number };

    assert.equal(gradeResponse.status, 200);
    assert.equal(gradePayload.score, 2);
    assert.equal(gradePayload.total, 3);
    assert.equal(gradePayload.percentage, 67);

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
          count: 2,
        }),
      }),
    );
    const examPayload = (await examResponse.json()) as {
      questions: Array<{ stem: string; answer: string }>;
    };

    assert.equal(examResponse.status, 200);
    assert.equal(examPayload.questions.length, 2);
    assert.ok(examPayload.questions.some((question) => /phrenic nerve/i.test(question.answer)));

    const deleteResponse = await deleteMaterialQuestion(
      new Request(`http://localhost/api/material-questions/${secondQuestion.id}`, {
        method: "DELETE",
        headers: {
          "x-admin-upload-key": adminKey,
        },
      }),
      { params: Promise.resolve({ questionId: secondQuestion.id }) },
    );

    assert.equal(deleteResponse.status, 200);
  } finally {
    await db.question.deleteMany({
      where: {
        materialId: material.id,
      },
    });
    await cleanupCourse(material.course.id);
  }
});

test("manual upload API returns validation errors without a 500", async () => {
  const material = await createTestMaterial();
  const adminKey = process.env.ADMIN_UPLOAD_KEY ?? "";

  try {
    const response = await uploadManualQuestions(
      new Request("http://localhost/api/upload-manual-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-upload-key": adminKey,
        },
        body: JSON.stringify({
          materialId: material.id,
          type: "MCQ",
          defaultDifficulty: "INTERMEDIATE",
          input: `Question: Which chamber forms the apex of the heart?
Options:
- Right ventricle
- Left ventricle
Answer: B
Explanation: The apex is formed by the left ventricle.`,
        }),
      }),
    );
    const payload = (await response.json()) as { error?: string };

    assert.equal(response.status, 422);
    assert.match(payload.error ?? "", /must include exactly four options/i);
  } finally {
    await cleanupCourse(material.course.id);
  }
});

test("manual upload API returns unsupported leading text errors without a 500", async () => {
  const material = await createTestMaterial();
  const adminKey = process.env.ADMIN_UPLOAD_KEY ?? "";

  try {
    const response = await uploadManualQuestions(
      new Request("http://localhost/api/upload-manual-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-upload-key": adminKey,
        },
        body: JSON.stringify({
          materialId: material.id,
          type: "SHORT_ANSWER",
          defaultDifficulty: "INTERMEDIATE",
          input: `Here are my questions:
Question: State the nerve supply of the diaphragm.
Answer: The phrenic nerve.
Explanation: The phrenic nerve is the motor supply.`,
        }),
      }),
    );
    const payload = (await response.json()) as { error?: string };

    assert.equal(response.status, 422);
    assert.match(payload.error ?? "", /contains text before a supported field label/i);
  } finally {
    await cleanupCourse(material.course.id);
  }
});

test("manual upload API accepts indented uppercase numbered MCQ sections", async () => {
  const material = await createTestMaterial();
  const adminKey = process.env.ADMIN_UPLOAD_KEY ?? "";

  try {
    const response = await uploadManualQuestions(
      new Request("http://localhost/api/upload-manual-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-upload-key": adminKey,
        },
        body: JSON.stringify({
          materialId: material.id,
          type: "MCQ",
          defaultDifficulty: "INTERMEDIATE",
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
        }),
      }),
    );
    const payload = (await response.json()) as { createdCount: number; totalSubmitted: number };

    assert.equal(response.status, 200);
    assert.equal(payload.createdCount, 2);
    assert.equal(payload.totalSubmitted, 2);
  } finally {
    await cleanupCourse(material.course.id);
  }
});

test("manual upload API accepts answer letters for numeric MCQ options", async () => {
  const material = await createTestMaterial();
  const adminKey = process.env.ADMIN_UPLOAD_KEY ?? "";

  try {
    const response = await uploadManualQuestions(
      new Request("http://localhost/api/upload-manual-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-upload-key": adminKey,
        },
        body: JSON.stringify({
          materialId: material.id,
          type: "MCQ",
          defaultDifficulty: "INTERMEDIATE",
          input: `QUESTIONS

38. How many ATP molecules are required for carbamoyl phosphate formation?

OPTIONS

38. A. 1 | B. 2 | C. 3 | D. 4

ANSWERS

38. B

EXPLANATIONS

38. The material states formation of carbamoyl phosphate requires 2 ATP.`,
        }),
      }),
    );
    const payload = (await response.json()) as { createdCount: number; totalSubmitted: number };

    assert.equal(response.status, 200);
    assert.equal(payload.createdCount, 1);
    assert.equal(payload.totalSubmitted, 1);
  } finally {
    await cleanupCourse(material.course.id);
  }
});
