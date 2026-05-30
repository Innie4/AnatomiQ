import assert from "node:assert/strict";
import test from "node:test";

import { MaterialStatus } from "@prisma/client";

import { db } from "@/lib/db";
import { persistProcessedMaterial } from "@/lib/materials";

import { cleanupCourse, createTestMaterial } from "./test-helpers";

test("large material processing persists chunks in batches and marks material ready", async () => {
  const material = await createTestMaterial();
  const semanticChunks = Array.from({ length: 125 }, (_, index) => ({
    sequence: index + 1,
    heading: `Batch Chunk ${index + 1}`,
    text: `Chunk ${index + 1} describes anatomy structures, relationships, and clinical relevance.`,
    tokenEstimate: 20,
    sourceHash: `test-source-${index + 1}`,
  }));
  const extraction = {
    text: semanticChunks.map((chunk) => chunk.text).join("\n\n"),
    pageCount: 12,
    method: "plain-text",
  } as const;

  try {
    await persistProcessedMaterial(material, extraction, "plain-text:test", {
      overview: "Batch persistence test material.",
      semanticChunks,
      enrichedChunks: semanticChunks.map((chunk) => ({
        sequence: chunk.sequence,
        heading: chunk.heading,
        suggestedSubtopic: material.subtopic?.name ?? null,
        conceptSummary: chunk.heading,
        concepts: [],
      })),
    });

    const processed = await db.material.findUniqueOrThrow({
      where: { id: material.id },
      include: {
        _count: {
          select: { ContentChunk: true },
        },
      },
    });

    assert.equal(processed.status, MaterialStatus.READY);
    assert.equal(processed._count.ContentChunk, 125);
    assert.equal(processed.sourcePages, 12);
    assert.ok(processed.processedAt);
    assert.match(processed.processingNotes ?? "", /Batch persistence test material/);
  } finally {
    await cleanupCourse(material.course.id);
  }
});
