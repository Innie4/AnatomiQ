import {
  QuestionAuthoringMode,
  CounterMetric,
  Difficulty,
  MaterialStatus,
  QuestionType,
  type ContentChunk,
  type Prisma,
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
import { ConflictError, UserInputError } from "@/lib/errors";
import { parseJsonString, toJsonString } from "@/lib/json";
import { generateLocalQuestionDrafts } from "@/lib/local-question-generator";
import { parseManualQuestionBatch } from "@/lib/manual-question-batch";
import { aiQuestionsSchema } from "@/lib/schemas";
import {
  cosineSimilarity,
  createSourceSnippet,
  extractJson,
  tokenSimilarity,
  tokenize,
} from "@/lib/text";
import { sampleArray, sha256 } from "@/lib/utils";

type TopicSelection = {
  courseId: string;
  courseName: string;
  topicId: string;
  topicName: string;
  subtopicId?: string | null;
  subtopicName?: string | null;
};

type ManualQuestionPayload = {
  manualOrder?: number;
  type: QuestionType;
  stem: string;
  answer: string;
  explanation: string;
  difficulty: Difficulty;
  options?: string[];
};

type ManualQuestionMaterial = {
  id: string;
  title: string;
  courseId: string;
  topicId: string;
  subtopicId: string | null;
  extractedText: string | null;
  topic: {
    name: string;
  };
  ContentChunk: Array<{
    id: string;
  }>;
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

function normalizeComparableAnswer(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function isOpenResponseCorrect(expected: string, submitted: string) {
  const normalizedExpected = normalizeComparableAnswer(expected);
  const normalizedSubmitted = normalizeComparableAnswer(submitted);

  if (!normalizedSubmitted) {
    return false;
  }

  if (normalizedExpected === normalizedSubmitted) {
    return true;
  }

  if (normalizedSubmitted.includes(normalizedExpected) || normalizedExpected.includes(normalizedSubmitted)) {
    return true;
  }

  const similarity = tokenSimilarity(expected, submitted);
  if (similarity >= 0.84) {
    return true;
  }

  const expectedTokens = new Set(tokenize(expected));
  const submittedTokens = new Set(tokenize(submitted));
  const covered = [...expectedTokens].filter((token) => submittedTokens.has(token)).length;

  return covered / Math.max(1, expectedTokens.size) >= 0.75;
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
      material: { status: MaterialStatus.READY },
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

async function getManualQuestionsForMaterial(materialId: string, type?: QuestionType) {
  return db.question.findMany({
    where: {
      materialId,
      authoringMode: QuestionAuthoringMode.MANUAL,
      ...(type ? { type } : {}),
    },
    orderBy: [{ type: "asc" }, { manualOrder: "asc" }, { createdAt: "asc" }],
  });
}

async function ensureUniqueManualOrder(params: {
  materialId: string;
  manualOrder: number;
  type: QuestionType;
  excludeQuestionId?: string;
}) {
  const existing = await db.question.findFirst({
    where: {
      materialId: params.materialId,
      manualOrder: params.manualOrder,
      type: params.type,
      ...(params.excludeQuestionId ? { id: { not: params.excludeQuestionId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw new ConflictError(`Question number ${params.manualOrder} is already in use for this ${params.type} question type.`);
  }
}

async function getNextManualOrder(materialId: string, type?: QuestionType) {
  const latest = await db.question.findFirst({
    where: {
      materialId,
      authoringMode: QuestionAuthoringMode.MANUAL,
      ...(type ? { type } : {}),
    },
    orderBy: { manualOrder: "desc" },
    select: { manualOrder: true },
  });

  return (latest?.manualOrder ?? 0) + 1;
}

function normalizeManualOptions(type: QuestionType, options?: string[]) {
  if (type !== QuestionType.MCQ) {
    return undefined;
  }

  const normalized = (options ?? []).map((option) => option.trim()).filter(Boolean);

  if (!normalized.length) {
    throw new UserInputError("MCQ questions require at least one option.");
  }

  return normalized;
}

function ensureAnswerMatchesOptions(answer: string, options?: string[]) {
  if (!options?.length) {
    return answer;
  }

  const normalizedAnswer = answer.trim().toUpperCase();
  const answerIndex = normalizedAnswer.length === 1 ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(normalizedAnswer) : -1;

  return answerIndex >= 0 && answerIndex < options.length ? options[answerIndex] : answer.trim();
}

async function buildManualQuestionRecord(
  material: ManualQuestionMaterial,
  payload: ManualQuestionPayload,
  manualOrder: number,
  existingQuestions: Question[],
  excludeQuestionId?: string,
  precomputedEmbedding?: number[] | null,
) {
  const normalizedOptions = normalizeManualOptions(payload.type, payload.options);
  const normalizedAnswer = ensureAnswerMatchesOptions(payload.answer, normalizedOptions);
  const hash = sha256(`${material.id}:${payload.type}:${payload.stem}`);
  const [generatedEmbedding] =
    precomputedEmbedding === undefined ? await embedTexts([payload.stem]) : [precomputedEmbedding];
  const embedding = generatedEmbedding ?? null;
  const comparableExisting = existingQuestions
    .filter((question) => question.id !== excludeQuestionId)
    .map((question) => ({
      stem: question.stem,
      hash: question.questionHash,
      embedding: parseJsonString<number[] | null>(question.embedding, null),
    }));

  if (
    isDuplicateQuestion(
      {
        stem: payload.stem.trim(),
        hash,
        embedding: embedding ?? undefined,
      },
      comparableExisting,
    )
  ) {
    throw new UserInputError("A highly similar question already exists for this material.");
  }

  return {
    courseId: material.courseId,
    topicId: material.topicId,
    subtopicId: material.subtopicId,
    materialId: material.id,
    manualOrder,
    type: payload.type,
    stem: payload.stem.trim(),
    options: normalizedOptions ? toJsonString(normalizedOptions) : undefined,
    answer: normalizedAnswer,
    explanation: payload.explanation.trim(),
    difficulty: payload.difficulty,
    authoringMode: QuestionAuthoringMode.MANUAL,
    sourceChunkIds: toJsonString(material.ContentChunk.map((chunk) => chunk.id)),
    sourceSnippet:
      material.extractedText?.slice(0, 220) ||
      `Faculty-authored question bank linked to ${material.title} in ${material.topic.name}.`,
    questionHash: hash,
    textFingerprint: payload.stem.toLowerCase(),
    embedding: embedding ? toJsonString(embedding) : undefined,
  };
}

function buildManualQuestionCreateInput(params: {
  material: ManualQuestionMaterial;
  payload: ManualQuestionPayload;
  manualOrder: number;
  sourceChunkIds: string;
  sourceSnippet: string;
}) {
  const normalizedOptions = normalizeManualOptions(params.payload.type, params.payload.options);
  const normalizedAnswer = ensureAnswerMatchesOptions(params.payload.answer, normalizedOptions);
  const stem = params.payload.stem.trim();
  const hash = sha256(`${params.material.id}:${params.payload.type}:${stem}`);

  return {
    courseId: params.material.courseId,
    topicId: params.material.topicId,
    subtopicId: params.material.subtopicId,
    materialId: params.material.id,
    manualOrder: params.manualOrder,
    type: params.payload.type,
    stem,
    options: normalizedOptions ? toJsonString(normalizedOptions) : undefined,
    answer: normalizedAnswer,
    explanation: params.payload.explanation.trim(),
    difficulty: params.payload.difficulty,
    authoringMode: QuestionAuthoringMode.MANUAL,
    sourceChunkIds: params.sourceChunkIds,
    sourceSnippet: params.sourceSnippet,
    questionHash: hash,
    textFingerprint: stem.toLowerCase(),
  } satisfies Prisma.QuestionCreateManyInput;
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
    throw new Error("No processed material exists for this topic yet. Upload and process course material first.");
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
              { course: { code: { contains: search } } },
              { course: { name: { contains: search } } },
              { course: { department: { contains: search } } },
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
          code: true,
          name: true,
          slug: true,
          department: true,
        },
      },
      _count: {
        select: {
          Question: true,
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
    courseCode: material.course.code,
    courseSlug: material.course.slug,
    department: material.course.department,
    topicName: material.topic.name,
    topicSlug: material.topic.slug,
    subtopicName: material.subtopic?.name ?? null,
    subtopicSlug: material.subtopic?.slug ?? null,
    linkedQuestionCount: material._count.Question,
    createdAt: material.createdAt.toISOString(),
  }));
}

export async function listManualQuestions(materialId: string, type?: QuestionType) {
  if (!hasDatabase) {
    throw new Error("Database is not configured.");
  }

  const questions = await getManualQuestionsForMaterial(materialId, type);

  return questions.map((question) => ({
    id: question.id,
    materialId: question.materialId,
    manualOrder: question.manualOrder,
    type: question.type,
    stem: question.stem,
    options: parseJsonString<string[] | null>(question.options, null),
    answer: question.answer,
    explanation: question.explanation,
    difficulty: question.difficulty,
    updatedAt: question.updatedAt.toISOString(),
  }));
}

export async function createManualQuestion(params: {
  materialId: string;
  payload: ManualQuestionPayload;
}) {
  if (!hasDatabase) {
    throw new Error("Database is not configured.");
  }

  const [material, existingQuestions] = await Promise.all([
    db.material.findUniqueOrThrow({
      where: { id: params.materialId },
      include: {
        topic: true,
        ContentChunk: {
          select: { id: true },
          orderBy: { sequence: "asc" },
        },
      },
    }),
    getManualQuestionsForMaterial(params.materialId, params.payload.type),
  ]);
  const manualOrder = params.payload.manualOrder ?? (await getNextManualOrder(params.materialId, params.payload.type));
  await ensureUniqueManualOrder({ materialId: params.materialId, manualOrder, type: params.payload.type });
  const record = await buildManualQuestionRecord(material, params.payload, manualOrder, existingQuestions);
  return db.question.create({ data: record });
}

export async function updateManualQuestion(params: {
  questionId: string;
  payload: ManualQuestionPayload;
}) {
  if (!hasDatabase) {
    throw new Error("Database is not configured.");
  }

  const existingQuestion = await db.question.findUniqueOrThrow({
    where: { id: params.questionId },
    include: {
      material: {
        include: {
          topic: true,
          ContentChunk: {
            select: { id: true },
            orderBy: { sequence: "asc" },
          },
        },
      },
    },
  });

  if (existingQuestion.authoringMode !== QuestionAuthoringMode.MANUAL || !existingQuestion.material) {
    throw new Error("Only manual questions linked to a material can be edited.");
  }

  const manualOrder = params.payload.manualOrder ?? existingQuestion.manualOrder ?? 1;
  await ensureUniqueManualOrder({
    materialId: existingQuestion.materialId ?? "",
    manualOrder,
    type: params.payload.type,
    excludeQuestionId: params.questionId,
  });
  const existingQuestions = await getManualQuestionsForMaterial(existingQuestion.materialId ?? "", params.payload.type);
  const record = await buildManualQuestionRecord(
    existingQuestion.material,
    params.payload,
    manualOrder,
    existingQuestions,
    params.questionId,
  );

  return db.question.update({
    where: { id: params.questionId },
    data: record,
  });
}

export async function deleteManualQuestion(questionId: string) {
  if (!hasDatabase) {
    throw new Error("Database is not configured.");
  }

  const question = await db.question.findUniqueOrThrow({
    where: { id: questionId },
    select: {
      id: true,
      authoringMode: true,
      materialId: true,
    },
  });

  if (question.authoringMode !== QuestionAuthoringMode.MANUAL || !question.materialId) {
    throw new Error("Only manual questions linked to a material can be removed.");
  }

  await db.question.delete({
    where: { id: questionId },
  });
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
      ContentChunk: {
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

  // Get existing questions of the SAME TYPE for this material
  const existing = await db.question.findMany({
    where: {
      materialId: params.materialId,
      authoringMode: QuestionAuthoringMode.MANUAL,
      type: params.type,
    },
    orderBy: [{ manualOrder: "asc" }, { createdAt: "asc" }],
  });

  const records: Prisma.QuestionCreateManyInput[] = [];
  const acceptedComparable: Array<{ stem: string; hash: string; embedding?: number[] | null }> = [];
  let skippedCount = 0;
  const linkedChunkIds = material.ContentChunk.map((chunk) => chunk.id);
  const sourceChunkIds = toJsonString(linkedChunkIds);
  const fallbackSourceSnippet =
    material.extractedText?.slice(0, 220) ||
    `Faculty-authored question bank linked to ${material.title} in ${material.topic.name}.`;
  const existingComparable = existing.map((question) => ({
    stem: question.stem,
    hash: question.questionHash,
    embedding: parseJsonString<number[] | null>(question.embedding, null),
  }));

  // Get the next available manual order for this question type
  const maxOrder = existing.length > 0
    ? Math.max(...existing.map(q => q.manualOrder ?? 0))
    : 0;
  let nextManualOrder = maxOrder + 1;

  for (let index = 0; index < parsedQuestions.length; index += 1) {
    const candidate = parsedQuestions[index];
    // Always assign the next available order, ignoring candidate.manualOrder
    const targetManualOrder = nextManualOrder;
    const payload = {
      ...candidate,
      manualOrder: targetManualOrder,
      explanation: candidate.explanation,
    } satisfies ManualQuestionPayload;

    const stem = payload.stem.trim();
    const hash = sha256(`${material.id}:${payload.type}:${stem}`);

    if (
      isDuplicateQuestion(
        { stem, hash, embedding: null },
        [...existingComparable, ...acceptedComparable],
      )
    ) {
      skippedCount += 1;
      continue;
    }

    records.push(
      buildManualQuestionCreateInput({
        material,
        payload,
        manualOrder: targetManualOrder,
        sourceChunkIds,
        sourceSnippet: fallbackSourceSnippet,
      }),
    );
    acceptedComparable.push({ stem, hash, embedding: null });
    nextManualOrder += 1;
  }

  const created = records.length
    ? await db.question.createManyAndReturn({
        data: records,
      })
    : [];

  return {
    material: {
      id: material.id,
      title: material.title,
      topicName: material.topic.name,
      subtopicName: material.subtopic?.name ?? null,
    },
    createdCount: created.length,
    updatedCount: 0,
    skippedCount,
    totalSubmitted: parsedQuestions.length,
    questions: created,
  };
}

export async function gradeExamAnswers(
  answers: Array<{
    questionId: string;
    response: string;
  }>,
) {
  const questions = await db.question.findMany({
    where: {
      id: {
        in: answers.map((answer) => answer.questionId),
      },
    },
  });

  const answerMap = new Map(answers.map((answer) => [answer.questionId, answer.response]));
  const breakdown = questions.map((question) => {
    const response = answerMap.get(question.id) ?? "";
    const correct =
      question.type === QuestionType.MCQ
        ? normalizeComparableAnswer(question.answer) === normalizeComparableAnswer(response)
        : isOpenResponseCorrect(question.answer, response);

    return {
      questionId: question.id,
      questionType: question.type,
      submittedAnswer: response,
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
