import test from "node:test";
import assert from "node:assert/strict";
import { QuestionType } from "@prisma/client";

import { generateLocalQuestionDrafts } from "../src/lib/local-question-generator";

const chunks = [
  {
    id: "chunk-1",
    materialId: "material-1",
    topicId: "topic-1",
    subtopicId: null,
    sequence: 1,
    heading: "Thoracic Wall",
    text: "The thoracic wall is formed by the sternum, ribs, costal cartilages, and thoracic vertebrae. It protects the thoracic organs and supports respiration.",
    conceptSummary: null,
    tokenEstimate: 20,
    sourceHash: "a",
    embedding: null,
    citations: null,
    createdAt: new Date(),
  },
  {
    id: "chunk-2",
    materialId: "material-1",
    topicId: "topic-1",
    subtopicId: null,
    sequence: 2,
    heading: "Pleura",
    text: "The pleura consists of visceral and parietal layers. The pleural cavity contains a thin film of serous fluid that reduces friction during breathing.",
    conceptSummary: null,
    tokenEstimate: 22,
    sourceHash: "b",
    embedding: null,
    citations: null,
    createdAt: new Date(),
  },
];

test("local MCQ generation creates grounded four-option questions", () => {
  const questions = generateLocalQuestionDrafts({
    type: QuestionType.MCQ,
    count: 1,
    chunks,
  });

  assert.ok(questions.length >= 1);
  assert.equal(questions[0].type, QuestionType.MCQ);
  assert.equal(questions[0].options?.length, 4);
  assert.deepEqual(questions[0].sourceChunkSequences.length, 1);
  assert.ok(questions[0].answer.length > 20);
});

test("local theory generation uses chunk text as the reference answer", () => {
  const questions = generateLocalQuestionDrafts({
    type: QuestionType.THEORY,
    count: 1,
    chunks,
  });

  assert.equal(questions[0].type, QuestionType.THEORY);
  assert.ok(questions[0].answer.includes("thoracic wall") || questions[0].answer.includes("pleura"));
  assert.ok(questions[0].sourceSnippet.length > 20);
});
