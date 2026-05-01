import {
  CounterMetric,
  Difficulty,
  QuestionType,
  type ContentChunk,
  type Question,
} from "@prisma/client";

import { getOpenAiClient } from "@/lib/ai/client";
import { buildQuestionGenerationPrompt } from "@/lib/ai/prompts";
import { incrementCounter } from "@/lib/analytics";
import {
  QUESTION_BATCH_LIMIT,
  QUESTION_EMBEDDING_THRESHOLD,
  QUESTION_TOKEN_SIMILARITY_THRESHOLD,
} from "@/lib/constants";
import { db } from "@/lib/db";
import { env, hasDatabase, hasOpenAi } from "@/lib/env";
import { parseJsonString, toJsonString } from "@/lib/json";
import { generateLocalQuestionDrafts } from "@/lib/local-question-generator";
import { parseManualQuestionBatch } from "@/lib/manual-question-batch";
import { aiQuestionsSchema } from "@/lib/schemas";
import { cosineSimilarity, createSourceSnippet, extractJson, tokenSimilarity } from "@/lib/text";
import { sampleArray, sha256 } from "@/lib/utils";

type TopicSelection = {
  courseId: string;
  courseName: string;
  topicId: string;
  topicName: string;
  subtopicId?: string | null;
  subtopicName?: string | null;
};

async function embedTexts(texts: string[]) {
  if (!hasOpenAi || !texts.length) {
    return texts.map(() => null);
  }

  const response = await getOpenAiClient().embeddings.create({
    model: env.openAiEmbeddingModel,
    input: texts,
  });

  return response.data.map((item) => item.embedding);
}

function isDuplicateQuestion(
  candidate: { stem: string; hash: string; embedding?: number[] | null },
  existing: Array<{ stem: string; hash: string; embedding?: number[] | null }>,
) {
  if (existing.some((item) => item.hash === candidate.hash)) {
    return true;
  }

  for (const item of existing) {
    if (tokenSimilarity(item.stem, candidate.stem) >= QUESTION_TOKEN_SIMILARITY_THRESHOLD) {
      return true;
    }

    if (item.embedding && candidate.embedding) {
      const similarity = cosineSimilarity(item.embedding, candidate.embedding);

      if (similarity >= QUESTION_EMBEDDING_THRESHOLD) {
        return true;
      }
    }
  }

  return false;
}

async function findSelection(topicSlug: string, subtopicSlug?: string) {
  const topic = await db.topic.findUniqueOrThrow({
    where: { slug: topicSlug },
    include: { course: true },
  });

  const subtopic = subtopicSlug
    ? await db.topic.findUnique({
        where: { slug: subtopicSlug },
      })
    : null;

  return {
    courseId: topic.courseId,
    courseName: topic.course.name,
    topicId: topic.id,
    topicName: topic.name,
    subtopicId: subtopic?.id,
    subtopicName: subtopic?.name,
  } satisfies TopicSelection;
}

async function getSourceChunks(selection: TopicSelection) {
  return db.contentChunk.findMany({
    where: {
      topicId: selection.topicId,
      ...(selection.subtopicId ? { subtopicId: selection.subtopicId } : {}),
    },
    orderBy: [{ material: { createdAt: "desc" } }, { sequence: "asc" }],
  });
}

async function getExistingQuestions(selection: TopicSelection, type?: QuestionType) {
  return db.question.findMany({
    where: {
      topicId: selection.topicId,
      ...(selection.subtopicId ? { subtopicId: selection.subtopicId } : {}),
      ...(type ? { type } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}

async function getExistingQuestionsForMaterial(materialId: string, type?: QuestionType) {
  return db.question.findMany({
    where: {
      materialId,
      ...(type ? { type } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}

async function generateQuestionsFromChunks(params: {
  selection: TopicSelection;
  type: QuestionType;
  count: number;
  chunks: ContentChunk[];
  existingQuestions: Question[];
}) {
  const chunkPool = sampleArray(params.chunks, Math.min(params.chunks.length, 8));
  const parsedQuestions = hasOpenAi
    ? aiQuestionsSchema.parse(
        extractJson(
          (
            await getOpenAiClient().responses.create({
              model: env.openAiQuestionModel,
              input: buildQuestionGenerationPrompt({
                courseName: params.selection.courseName,
                topicName: params.selection.topicName,
                subtopicName: params.selection.subtopicName,
                questionType: params.type,
                count: Math.min(params.count, QUESTION_BATCH_LIMIT),
                chunks: chunkPool.map((chunk) => ({
                  sequence: chunk.sequence,
                  heading: chunk.heading,
                  text: chunk.text,
                })),
              }),
              max_output_tokens: 5000,
            })
          ).output_text,
        ),
      ).questions
    : generateLocalQuestionDrafts({
        type: params.type,
        count: params.count,
        chunks: chunkPool,
      });
  const hashes = parsedQuestions.map((question) => sha256(`${question.type}:${question.stem}`));
  const embeddings = await embedTexts(parsedQuestions.map((question) => question.stem));
  const existingComparable = params.existingQuestions.map((question) => ({
    stem: question.stem,
    hash: question.questionHash,
    embedding: parseJsonString<number[] | null>(question.embedding, null),
  }));

  const created: Question[] = [];

  for (let index = 0; index < parsedQuestions.length; index += 1) {
    const candidate = parsedQuestions[index];
    const hash = hashes[index];
    const embedding = embeddings[index];
    const sourceChunks = params.chunks.filter((chunk) =>
      candidate.sourceChunkSequences.includes(chunk.sequence),
    );

    if (!sourceChunks.length) {
      continue;
    }

    if (
      isDuplicateQuestion(
        {
          stem: candidate.stem,
          hash,
          embedding,
        },
        [
          ...existingComparable,
          ...created.map((question) => ({
            stem: question.stem,
            hash: question.questionHash,
            embedding: parseJsonString<number[] | null>(question.embedding, null),
          })),
        ],
      )
    ) {
      continue;
    }

    const options =
      candidate.type === "MCQ"
        ? (candidate.options ?? []).slice(0, 4).filter(Boolean)
        : undefined;

    if (candidate.type === "MCQ" && options?.length !== 4) {
      continue;
    }

    const question = await db.question.create({
      data: {
        courseId: params.selection.courseId,
        topicId: params.selection.topicId,
        subtopicId: params.selection.subtopicId,
        type: candidate.type,
        stem: candidate.stem,
        options: options ? toJsonString(options) : undefined,
        answer: candidate.answer,
        explanation: candidate.explanation ?? undefined,
        difficulty: candidate.difficulty as Difficulty,
        sourceChunkIds: toJsonString(sourceChunks.map((chunk) => chunk.id)),
        sourceSnippet:
          candidate.sourceSnippet || createSourceSnippet(sourceChunks.map((chunk) => chunk.text).join(" ")),
        questionHash: hash,
        textFingerprint: candidate.stem.toLowerCase(),
        embedding: embedding ? toJsonString(embedding) : undefined,
      },
    });

    created.push(question);
  }

  return created;
}

export async function ensureQuestionBank(params: {
  topicSlug: string;
  subtopicSlug?: string;
  type: QuestionType;
  count: number;
}) {
  if (!hasDatabase) {
    throw new Error("Database is not configured.");
  }

  const selection = await findSelection(params.topicSlug, params.subtopicSlug);
  const [chunks, existing] = await Promise.all([
    getSourceChunks(selection),
    getExistingQuestions(selection, params.type),
  ]);

  if (!chunks.length && !existing.length) {
    throw new Error("No processed material exists for this topic yet. Upload and process anatomy material first.");
  }

  const available = existing.length >= params.count ? existing : [...existing];

  let attempts = 0;

  while (chunks.length && available.length < params.count && attempts < 3) {
    const target = params.count - available.length;
    const created = await generateQuestionsFromChunks({
      selection,
      type: params.type,
      count: target + 3,
      chunks,
      existingQuestions: available,
    });

    if (!created.length) {
      break;
    }

    available.push(...created);
    attempts += 1;
  }

  await incrementCounter({
    metric: CounterMetric.QUESTION_GENERATION,
    topicId: selection.topicId,
    questionType: params.type,
  });

  return {
    selection,
    questions: sampleArray(available, Math.min(params.count, available.length)),
  };
}

export async function buildExamSet(params: {
  topicSlug: string;
  subtopicSlug?: string;
  type: "MCQ" | "SHORT_ANSWER" | "THEORY" | "MIXED";
  count: number;
}) {
  const selection = await findSelection(params.topicSlug, params.subtopicSlug);
  const requestedTypes =
    params.type === "MIXED"
      ? (["MCQ", "SHORT_ANSWER", "THEORY"] satisfies QuestionType[])
      : ([params.type] satisfies QuestionType[]);

  const questions: Question[] = [];
  const baseCount = Math.floor(params.count / requestedTypes.length);
  const remainder = params.count % requestedTypes.length;

  for (let index = 0; index < requestedTypes.length; index += 1) {
    const questionType = requestedTypes[index];
    const desired = baseCount + (index < remainder ? 1 : 0);

    if (!desired) {
      continue;
    }

    const bank = await ensureQuestionBank({
      topicSlug: params.topicSlug,
      subtopicSlug: params.subtopicSlug,
      type: questionType,
      count: desired,
    });

    questions.push(...bank.questions);
  }

  await incrementCounter({
    metric: CounterMetric.EXAM_START,
    topicId: selection.topicId,
  });

  await incrementCounter({
    metric: CounterMetric.TOPIC_STUDY,
    topicId: selection.topicId,
  });

  return {
    selection,
    questions: sampleArray(questions, params.count).map((question) => ({
      id: question.id,
      type: question.type,
      stem: question.stem,
      options: parseJsonString<string[] | null>(question.options, null),
      difficulty: question.difficulty,
      sourceSnippet: question.sourceSnippet,
      answer: question.answer,
      explanation: question.explanation,
    })),
  };
}

export async function getAdminMaterialOptions(search?: string) {
  const materials = await db.material.findMany({
    where: {
      ...(search
        ? {
            OR: [
              { title: { contains: search } },
              { topic: { name: { contains: search } } },
              { subtopic: { name: { contains: search } } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      topic: {
        select: {
          name: true,
          slug: true,
        },
      },
      subtopic: {
        select: {
          name: true,
          slug: true,
        },
      },
      course: {
        select: {
          name: true,
          slug: true,
        },
      },
      _count: {
        select: {
          questions: true,
        },
      },
    },
    orderBy: [{ createdAt: "desc" }],
    take: 100,
  });

  return materials.map((material) => ({
    id: material.id,
    title: material.title,
    status: material.status,
    courseName: material.course.name,
    courseSlug: material.course.slug,
    topicName: material.topic.name,
    topicSlug: material.topic.slug,
    subtopicName: material.subtopic?.name ?? null,
    subtopicSlug: material.subtopic?.slug ?? null,
    linkedQuestionCount: material._count.questions,
    createdAt: material.createdAt.toISOString(),
  }));
}

export async function createManualQuestionBank(params: {
  materialId: string;
  type: QuestionType;
  defaultDifficulty: Difficulty;
  input: string;
}) {
  if (!hasDatabase) {
    throw new Error("Database is not configured.");
  }

  const material = await db.material.findUniqueOrThrow({
    where: { id: params.materialId },
    include: {
      course: true,
      topic: true,
      subtopic: true,
      chunks: {
        select: {
          id: true,
        },
        orderBy: { sequence: "asc" },
      },
    },
  });

  const parsedQuestions = parseManualQuestionBatch({
    type: params.type,
    defaultDifficulty: params.defaultDifficulty,
    input: params.input,
  });
  const embeddings = await embedTexts(parsedQuestions.map((question) => question.stem));
  const existing = await getExistingQuestionsForMaterial(params.materialId, params.type);
  const existingComparable = existing.map((question) => ({
    stem: question.stem,
    hash: question.questionHash,
    embedding: parseJsonString<number[] | null>(question.embedding, null),
  }));
  const created: Question[] = [];
  const linkedChunkIds = material.chunks.map((chunk) => chunk.id);
  const fallbackSourceSnippet =
    material.extractedText?.slice(0, 220) ||
    `Faculty-authored question bank linked to ${material.title} in ${material.topic.name}.`;

  for (let index = 0; index < parsedQuestions.length; index += 1) {
    const candidate = parsedQuestions[index];
    const hash = sha256(`${candidate.type}:${candidate.stem}`);
    const embedding = embeddings[index];

    if (
      isDuplicateQuestion(
        {
          stem: candidate.stem,
          hash,
          embedding,
        },
        [
          ...existingComparable,
          ...created.map((question) => ({
            stem: question.stem,
            hash: question.questionHash,
            embedding: parseJsonString<number[] | null>(question.embedding, null),
          })),
        ],
      )
    ) {
      continue;
    }

    const question = await db.question.create({
      data: {
        courseId: material.courseId,
        topicId: material.topicId,
        subtopicId: material.subtopicId,
        materialId: material.id,
        type: candidate.type,
        stem: candidate.stem,
        options: candidate.options ? toJsonString(candidate.options) : undefined,
        answer: candidate.answer,
        explanation: candidate.explanation ?? undefined,
        difficulty: candidate.difficulty,
        authoringMode: "MANUAL",
        sourceChunkIds: toJsonString(linkedChunkIds),
        sourceSnippet: fallbackSourceSnippet,
        questionHash: hash,
        textFingerprint: candidate.stem.toLowerCase(),
        embedding: embedding ? toJsonString(embedding) : undefined,
      },
    });

    created.push(question);
  }

  return {
    material: {
      id: material.id,
      title: material.title,
      topicName: material.topic.name,
      subtopicName: material.subtopic?.name ?? null,
    },
    createdCount: created.length,
    skippedCount: parsedQuestions.length - created.length,
    totalSubmitted: parsedQuestions.length,
    questions: created,
  };
}

export async function gradeMcqAnswers(
  answers: Array<{
    questionId: string;
    selectedOption: string;
  }>,
) {
  const questions = await db.question.findMany({
    where: {
      id: {
        in: answers.map((answer) => answer.questionId),
      },
      type: QuestionType.MCQ,
    },
  });

  const answerMap = new Map(answers.map((answer) => [answer.questionId, answer.selectedOption]));
  const breakdown = questions.map((question) => {
    const selected = answerMap.get(question.id) ?? "";
    const correct = question.answer.trim() === selected.trim();

    return {
      questionId: question.id,
      selectedOption: selected,
      correctAnswer: question.answer,
      correct,
      explanation: question.explanation,
      sourceSnippet: question.sourceSnippet,
    };
  });

  const score = breakdown.filter((item) => item.correct).length;

  return {
    score,
    total: breakdown.length,
    percentage: breakdown.length ? Math.round((score / breakdown.length) * 100) : 0,
    breakdown,
  };
}
