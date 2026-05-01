import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";

import { db } from "@/lib/db";
import { createUploadedMaterial } from "@/lib/materials";

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require("@next/env") as { loadEnvConfig: (dir: string) => void };

loadEnvConfig(process.cwd());

export async function createTestMaterial() {
  const suffix = randomUUID().slice(0, 8);
  const material = await createUploadedMaterial({
    title: `Integration Material ${suffix}`,
    fileName: `integration-${suffix}.txt`,
    mimeType: "text/plain",
    storageKey: `tests/${suffix}.txt`,
    storageUrl: `https://example.com/tests/${suffix}.txt`,
    courseName: `Human Anatomy Integration ${suffix}`,
    topicName: `Topic ${suffix}`,
    subtopicName: `Subtopic ${suffix}`,
  });

  return material;
}

export async function cleanupCourse(courseId: string) {
  await db.course.delete({
    where: { id: courseId },
  });
}
