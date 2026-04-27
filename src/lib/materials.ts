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

export async function ensureCourseAndTopicHierarchy(params: {
  courseName: string;
  topicName: string;
  subtopicName?: string | null;
}) {
  const courseSlug = toSlug(params.courseName);

  const course = await db.course.upsert({
    where: { slug: courseSlug },
    update: {
      name: params.courseName,
    },
    create: {
      name: params.courseName,
      slug: courseSlug,
      description: `${params.courseName} learning material in ANATOMIQ.`,
    },
  });

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

  let subtopic = null;

  if (params.subtopicName) {
    const slug = toSlug(`${params.topicName}-${params.subtopicName}`);
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
  courseName: string;
  topicName: string;
  subtopicName?: string | null;
}) {
  if (!hasDatabase) {
    throw new Error("Database is not configured.");
  }

  const { course, topic, subtopic } = await ensureCourseAndTopicHierarchy({
    courseName: params.courseName,
    topicName: params.topicName,
    subtopicName: params.subtopicName,
  });

  return db.material.create({
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

async function enrichChunkConcepts(material: Awaited<ReturnType<typeof getMaterialForProcessing>>) {
  const semanticChunks = splitIntoSemanticChunks(material.extractedText ?? "");

  if (!semanticChunks.length) {
    return {
      overview: "No chunkable content extracted.",
      enrichedChunks: [],
      semanticChunks,
    };
  }

  if (!hasOpenAi) {
    return {
      overview: `Source material for ${material.topic.name}.`,
      enrichedChunks: semanticChunks.map((chunk) => ({
        sequence: chunk.sequence,
        heading: chunk.heading,
        suggestedSubtopic: material.subtopic?.name ?? null,
        conceptSummary: chunk.heading || "Core anatomy content",
        concepts: [],
      })),
      semanticChunks,
    };
  }

  const openai = getOpenAiClient();
  const response = await openai.responses.create({
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
  });

  const parsed = aiConceptExtractionSchema.parse(extractJson(response.output_text));

  return {
    overview: parsed.materialOverview,
    enrichedChunks: parsed.chunks,
    semanticChunks,
  };
}

export async function processMaterial(materialId: string) {
  if (!hasDatabase) {
    throw new Error("Database is not configured.");
  }

  const material = await getMaterialForProcessing(materialId);

  await db.material.update({
    where: { id: materialId },
    data: {
      status: MaterialStatus.PROCESSING,
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
    const semanticBySequence = new Map(enriched.semanticChunks.map((chunk) => [chunk.sequence, chunk]));
    const subtopicCache = new Map<string, string | null>();

    await db.$transaction(async (tx) => {
      await tx.conceptFact.deleteMany({
        where: {
          chunk: { materialId },
        },
      });

      await tx.contentChunk.deleteMany({
        where: { materialId },
      });

      await tx.material.update({
        where: { id: materialId },
        data: {
          extractedText: extraction.text,
          extractedHash,
          sourcePages: extraction.pageCount,
          processingNotes: toJsonString({
            extractionMethod: extraction.method,
            materialOverview: enriched.overview,
          }),
          status: MaterialStatus.READY,
        },
      });

      for (const chunkMeta of enriched.enrichedChunks) {
        const sourceChunk = semanticBySequence.get(chunkMeta.sequence);

        if (!sourceChunk) {
          continue;
        }

        let resolvedSubtopicId = material.subtopicId ?? null;
        const suggestedSubtopic = chunkMeta.suggestedSubtopic?.trim();

        if (suggestedSubtopic) {
          const cacheKey = `${material.topicId}:${suggestedSubtopic}`;
          if (!subtopicCache.has(cacheKey)) {
            const topic = await tx.topic.upsert({
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

          resolvedSubtopicId = subtopicCache.get(cacheKey) ?? null;
        }

        const createdChunk = await tx.contentChunk.create({
          data: {
            materialId,
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
          },
        });

        for (const conceptMeta of chunkMeta.concepts) {
          const concept = await upsertConcept(
            tx,
            material.topicId,
            resolvedSubtopicId,
            conceptMeta.name,
            conceptMeta.description,
          );

          for (const fact of conceptMeta.facts) {
            await tx.conceptFact.create({
              data: {
                conceptId: concept.id,
                chunkId: createdChunk.id,
                fact,
                sourceSnippet: fact.slice(0, 220),
              },
            });
          }
        }
      }
    });

    return {
      materialId,
      status: MaterialStatus.READY,
      extractedCharacters: extraction.text.length,
      chunkCount: enriched.semanticChunks.length,
      extractionMethod: extraction.method,
    };
  } catch (error) {
    await db.material.update({
      where: { id: materialId },
      data: {
        status: MaterialStatus.FAILED,
        processingNotes: toJsonString({
          error: error instanceof Error ? error.message : "Unknown processing error",
        }),
      },
    });

    throw error;
  }
}
