import { MaterialKind, MaterialStatus, type Prisma, type PrismaClient } from "@prisma/client";

import { extractMaterialText } from "@/lib/ai/extractors";
import { getOpenAiClient } from "@/lib/ai/client";
import { buildConceptExtractionPrompt } from "@/lib/ai/prompts";
import { db } from "@/lib/db";
import { env, hasDatabase, hasOpenAi } from "@/lib/env";
import { toJsonString } from "@/lib/json";
import { aiConceptExtractionSchema } from "@/lib/schemas";
import { downloadBufferFromS3 } from "@/lib/storage";
import { extractJson, splitIntoSemanticChunks } from "@/lib/text";
import { toSlug } from "@/lib/utils";

const PROCESSING_TRANSACTION_TIMEOUT_MS = 60_000;
const PROCESSING_TRANSACTION_MAX_WAIT_MS = 10_000;
const CREATE_MANY_BATCH_SIZE = 100;

type MaterialForProcessing = Awaited<ReturnType<typeof getMaterialForProcessing>>;
type MaterialExtraction = Awaited<ReturnType<typeof extractMaterialText>>;
type EnrichedChunk = {
  sequence: number;
  heading: string | null;
  suggestedSubtopic: string | null;
  conceptSummary: string;
  concepts: Array<{
    name: string;
    description: string | null;
    facts: string[];
  }>;
};
type ChunkEnrichment = {
  overview: string;
  enrichedChunks: EnrichedChunk[];
  semanticChunks: ReturnType<typeof splitIntoSemanticChunks>;
  enrichmentError?: string | null;
};

export class MaterialProcessingError extends Error {
  statusCode = 422;

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "MaterialProcessingError";
  }
}

export async function ensureCourseAndTopicHierarchy(params: {
  courseCode: string;
  courseName: string;
  topicName: string;
  subtopicName?: string | null;
}) {
  console.log("[materials] Ensuring hierarchy:", params);
  const courseSlug = toSlug(params.courseName);

  console.log("[materials] Upserting course:", courseSlug);
  const course = await db.course.upsert({
    where: { slug: courseSlug },
    update: {
      code: params.courseCode,
      name: params.courseName,
    },
    create: {
      code: params.courseCode,
      name: params.courseName,
      slug: courseSlug,
      description: `${params.courseName} learning material in ANATOMIQ.`,
    },
  });
  console.log("[materials] Course ready:", course.id);

  console.log("[materials] Upserting topic:", toSlug(params.topicName));
  const topic = await db.topic.upsert({
    where: { slug: toSlug(params.topicName) },
    update: {
      name: params.topicName,
      courseId: course.id,
    },
    create: {
      name: params.topicName,
      slug: toSlug(params.topicName),
      courseId: course.id,
      level: 0,
    },
  });
  console.log("[materials] Topic ready:", topic.id);

  let subtopic = null;

  if (params.subtopicName) {
    const slug = toSlug(`${params.topicName}-${params.subtopicName}`);
    console.log("[materials] Upserting subtopic:", slug);
    subtopic = await db.topic.upsert({
      where: { slug },
      update: {
        name: params.subtopicName,
        courseId: course.id,
        parentTopicId: topic.id,
        level: 1,
      },
      create: {
        name: params.subtopicName,
        slug,
        courseId: course.id,
        parentTopicId: topic.id,
        level: 1,
      },
    });
    console.log("[materials] Subtopic ready:", subtopic.id);
  }

  return { course, topic, subtopic };
}

function resolveMaterialKind(mimeType: string) {
  if (mimeType === "application/pdf") {
    return MaterialKind.PDF;
  }

  if (mimeType.startsWith("image/")) {
    return MaterialKind.IMAGE;
  }

  return MaterialKind.NOTE;
}

export async function createUploadedMaterial(params: {
  title: string;
  fileName: string;
  mimeType: string;
  storageKey: string;
  storageUrl: string;
  courseCode: string;
  courseName: string;
  topicName: string;
  subtopicName?: string | null;
}) {
  if (!hasDatabase) {
    throw new Error("Database is not configured.");
  }

  console.log("[materials] Creating material:", params.title);

  const { course, topic, subtopic } = await ensureCourseAndTopicHierarchy({
    courseCode: params.courseCode,
    courseName: params.courseName,
    topicName: params.topicName,
    subtopicName: params.subtopicName,
  });

  console.log("[materials] Creating material record in database");
  const material = await db.material.create({
    data: {
      title: params.title,
      fileName: params.fileName,
      fileType: params.fileName.split(".").pop() || params.mimeType,
      mimeType: params.mimeType,
      kind: resolveMaterialKind(params.mimeType),
      courseId: course.id,
      topicId: topic.id,
      subtopicId: subtopic?.id,
      storageKey: params.storageKey,
      storageUrl: params.storageUrl,
      metadata: toJsonString({
        uploadedAtIso: new Date().toISOString(),
      }),
    },
    include: {
      topic: true,
      subtopic: true,
      course: true,
    },
  });

  console.log("[materials] Material record created successfully:", material.id);
  return material;
}

async function getMaterialForProcessing(materialId: string) {
  return db.material.findUniqueOrThrow({
    where: { id: materialId },
    include: {
      course: true,
      topic: true,
      subtopic: true,
    },
  });
}

async function upsertConcept(
  client: Prisma.TransactionClient | PrismaClient,
  topicId: string,
  subtopicId: string | null,
  name: string,
  description?: string | null,
) {
  const slug = toSlug(name);
  const scopeKey = `${topicId}:${subtopicId ?? "root"}:${slug}`;

  return client.concept.upsert({
    where: {
      scopeKey,
    },
    update: {
      name,
      description: description ?? undefined,
    },
    create: {
      name,
      slug,
      scopeKey,
      description: description ?? undefined,
      topicId,
      subtopicId,
    },
  });
}

function buildLocalChunkEnrichment(
  material: MaterialForProcessing,
  semanticChunks: ReturnType<typeof splitIntoSemanticChunks>,
  enrichmentError?: string | null,
): ChunkEnrichment {
  return {
    overview: `Source material for ${material.topic.name}.`,
    enrichedChunks: semanticChunks.map((chunk) => ({
      sequence: chunk.sequence,
      heading: chunk.heading,
      suggestedSubtopic: material.subtopic?.name ?? null,
      conceptSummary: chunk.heading || "Core course content",
      concepts: [],
    })),
    semanticChunks,
    enrichmentError,
  };
}

async function withTimeout<T>(operation: Promise<T>, timeoutMs: number, label: string) {
  let timeout: NodeJS.Timeout | undefined;

  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms.`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

async function enrichChunkConcepts(material: MaterialForProcessing): Promise<ChunkEnrichment> {
  const semanticChunks = splitIntoSemanticChunks(material.extractedText ?? "");

  if (!semanticChunks.length) {
    return {
      overview: "No chunkable content extracted.",
      enrichedChunks: [],
      semanticChunks,
    };
  }

  if (!hasOpenAi) {
    return buildLocalChunkEnrichment(material, semanticChunks);
  }

  try {
    const openai = getOpenAiClient();
    const response = await withTimeout(
      openai.responses.create({
        model: env.openAiExtractionModel,
        input: buildConceptExtractionPrompt({
          courseName: material.course.name,
          topicName: material.topic.name,
          subtopicName: material.subtopic?.name,
          chunks: semanticChunks.map((chunk) => ({
            sequence: chunk.sequence,
            heading: chunk.heading,
            text: chunk.text,
          })),
        }),
        max_output_tokens: 6000,
      }),
      env.openAiExtractionTimeoutMs,
      "OpenAI concept extraction",
    );

    const parsed = aiConceptExtractionSchema.parse(extractJson(response.output_text));

    return {
      overview: parsed.materialOverview,
      enrichedChunks: parsed.chunks,
      semanticChunks,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown concept enrichment error";
    console.error("[materials] Concept enrichment failed; falling back to local chunk metadata:", error);
    return buildLocalChunkEnrichment(material, semanticChunks, message);
  }
}

function batch<T>(items: T[], size = CREATE_MANY_BATCH_SIZE) {
  const batches: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }

  return batches;
}

async function deleteMaterialDerivedData(materialId: string) {
  await db.$transaction(
    async (tx) => {
      await tx.conceptFact.deleteMany({
        where: {
          chunk: { materialId },
        },
      });
      await tx.contentChunk.deleteMany({
        where: { materialId },
      });
    },
    {
      maxWait: PROCESSING_TRANSACTION_MAX_WAIT_MS,
      timeout: PROCESSING_TRANSACTION_TIMEOUT_MS,
    },
  );
}

async function resolveChunkSubtopics(material: MaterialForProcessing, enrichedChunks: EnrichedChunk[]) {
  const subtopicCache = new Map<string, string | null>();

  for (const chunkMeta of enrichedChunks) {
    const suggestedSubtopic = chunkMeta.suggestedSubtopic?.trim();

    if (!suggestedSubtopic) {
      continue;
    }

    const cacheKey = `${material.topicId}:${suggestedSubtopic}`;
    if (subtopicCache.has(cacheKey)) {
      continue;
    }

    const topic = await db.topic.upsert({
      where: {
        slug: toSlug(`${material.topic.name}-${suggestedSubtopic}`),
      },
      update: {
        name: suggestedSubtopic,
        parentTopicId: material.topicId,
        courseId: material.courseId,
        level: 1,
      },
      create: {
        name: suggestedSubtopic,
        slug: toSlug(`${material.topic.name}-${suggestedSubtopic}`),
        parentTopicId: material.topicId,
        courseId: material.courseId,
        level: 1,
      },
    });

    subtopicCache.set(cacheKey, topic.id);
  }

  return subtopicCache;
}

export async function persistProcessedMaterial(
  material: MaterialForProcessing,
  extraction: MaterialExtraction,
  extractedHash: string | null,
  enriched: ChunkEnrichment,
) {
  const semanticBySequence = new Map(enriched.semanticChunks.map((chunk) => [chunk.sequence, chunk]));
  const subtopicCache = await resolveChunkSubtopics(material, enriched.enrichedChunks);
  const processingNotes = toJsonString({
    extractionMethod: extraction.method,
    materialOverview: enriched.overview,
    enrichmentError: enriched.enrichmentError ?? undefined,
  });

  const chunkRows: Prisma.ContentChunkCreateManyInput[] = [];

  for (const chunkMeta of enriched.enrichedChunks) {
    const sourceChunk = semanticBySequence.get(chunkMeta.sequence);

    if (!sourceChunk) {
      continue;
    }

    const suggestedSubtopic = chunkMeta.suggestedSubtopic?.trim();
    const resolvedSubtopicId = suggestedSubtopic
      ? (subtopicCache.get(`${material.topicId}:${suggestedSubtopic}`) ?? material.subtopicId ?? null)
      : (material.subtopicId ?? null);

    chunkRows.push({
      materialId: material.id,
      topicId: material.topicId,
      subtopicId: resolvedSubtopicId,
      sequence: sourceChunk.sequence,
      heading: sourceChunk.heading,
      text: sourceChunk.text,
      conceptSummary: chunkMeta.conceptSummary,
      tokenEstimate: sourceChunk.tokenEstimate,
      sourceHash: sourceChunk.sourceHash,
      citations: toJsonString({
        materialTitle: material.title,
        sequence: sourceChunk.sequence,
      }),
    });
  }

  await deleteMaterialDerivedData(material.id);

  await db.material.update({
    where: { id: material.id },
    data: {
      extractedText: extraction.text,
      extractedHash,
      sourcePages: extraction.pageCount,
      processingNotes,
      status: MaterialStatus.PROCESSING,
    },
  });

  for (const chunkBatch of batch(chunkRows)) {
    await db.contentChunk.createMany({
      data: chunkBatch,
    });
  }

  const createdChunks = await db.contentChunk.findMany({
    where: { materialId: material.id },
    select: {
      id: true,
      sequence: true,
    },
  });
  const chunkIdBySequence = new Map(createdChunks.map((chunk) => [chunk.sequence, chunk.id]));
  const factRows: Prisma.ConceptFactCreateManyInput[] = [];

  for (const chunkMeta of enriched.enrichedChunks) {
    const chunkId = chunkIdBySequence.get(chunkMeta.sequence);

    if (!chunkId) {
      continue;
    }

    const suggestedSubtopic = chunkMeta.suggestedSubtopic?.trim();
    const resolvedSubtopicId = suggestedSubtopic
      ? (subtopicCache.get(`${material.topicId}:${suggestedSubtopic}`) ?? material.subtopicId ?? null)
      : (material.subtopicId ?? null);

    for (const conceptMeta of chunkMeta.concepts) {
      const concept = await upsertConcept(
        db,
        material.topicId,
        resolvedSubtopicId,
        conceptMeta.name,
        conceptMeta.description,
      );

      for (const fact of conceptMeta.facts) {
        factRows.push({
          conceptId: concept.id,
          chunkId,
          fact,
          sourceSnippet: fact.slice(0, 220),
        });
      }
    }
  }

  for (const factBatch of batch(factRows)) {
    await db.conceptFact.createMany({
      data: factBatch,
    });
  }

  await db.material.update({
    where: { id: material.id },
    data: {
      status: MaterialStatus.READY,
      processedAt: new Date(),
      processingNotes,
    },
  });
}

async function markMaterialProcessingFailed(materialId: string, error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown processing error";

  try {
    await deleteMaterialDerivedData(materialId);
  } catch (cleanupError) {
    console.error("[materials] Could not clean up partial processing data:", cleanupError);
  }

  await db.material.update({
    where: { id: materialId },
    data: {
      status: MaterialStatus.FAILED,
      processedAt: new Date(),
      processingNotes: toJsonString({
        error: message,
      }),
    },
  });
}

export async function processMaterial(materialId: string) {
  if (!hasDatabase) {
    throw new Error("Database is not configured.");
  }

  const material = await getMaterialForProcessing(materialId);
  const processingStartedAt = new Date();

  await db.material.update({
    where: { id: materialId },
    data: {
      status: MaterialStatus.PROCESSING,
      processingStartedAt,
      processedAt: null,
    },
  });

  try {
    const buffer = await downloadBufferFromS3(material.storageKey);
    const extraction = await extractMaterialText({
      buffer,
      fileName: material.fileName,
      mimeType: material.mimeType,
    });

    const extractedHash = extraction.text ? `${extraction.method}:${extraction.text.length}` : null;
    const enriched = await enrichChunkConcepts({
      ...material,
      extractedText: extraction.text,
    });
    await persistProcessedMaterial(material, extraction, extractedHash, enriched);

    return {
      materialId,
      status: MaterialStatus.READY,
      extractedCharacters: extraction.text.length,
      chunkCount: enriched.semanticChunks.length,
      extractionMethod: extraction.method,
    };
  } catch (error) {
    await markMaterialProcessingFailed(materialId, error);

    throw new MaterialProcessingError(
      "Material was uploaded, but processing failed. Please try a clearer PDF, image, or text file.",
      { cause: error },
    );
  }
}
