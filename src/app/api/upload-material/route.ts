import { randomUUID } from "node:crypto";

import { handleRouteError, fail, ok } from "@/lib/api";
import { MAX_UPLOAD_SIZE_BYTES, SUPPORTED_UPLOAD_MIME_TYPES } from "@/lib/constants";
import { createUploadedMaterial } from "@/lib/materials";
import { uploadMaterialSchema } from "@/lib/schemas";
import { uploadBufferToS3 } from "@/lib/storage";
import { toSlug } from "@/lib/utils";
import { authenticateRequest, logAudit } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    // Authenticate using JWT or legacy key
    const auth = await authenticateRequest(db, request);
    if (!auth) {
      return fail("Unauthorized", 401);
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return fail("A file is required.");
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      return fail("The uploaded file exceeds the 25MB limit.");
    }

    if (!SUPPORTED_UPLOAD_MIME_TYPES.includes(file.type as (typeof SUPPORTED_UPLOAD_MIME_TYPES)[number])) {
      return fail("Unsupported file type.");
    }

    const parsed = uploadMaterialSchema.parse({
      title: formData.get("title"),
      courseName: formData.get("courseName"),
      topicName: formData.get("topicName"),
      subtopicName: formData.get("subtopicName") || null,
    });

    const buffer = Buffer.from(await file.arrayBuffer());
    const extension = file.name.split(".").pop() || "bin";
    const storageKey = `materials/${toSlug(parsed.courseName)}/${Date.now()}-${randomUUID()}.${extension}`;
    const storage = await uploadBufferToS3({
      key: storageKey,
      buffer,
      contentType: file.type,
    });

    const material = await createUploadedMaterial({
      title: parsed.title,
      fileName: file.name,
      mimeType: file.type,
      storageKey: storage.key,
      storageUrl: storage.url,
      courseName: parsed.courseName,
      topicName: parsed.topicName,
      subtopicName: parsed.subtopicName,
    });

    // Log audit trail
    await logAudit(
      db,
      auth.userId,
      "upload_material",
      "material",
      material.id,
      `Uploaded ${material.title} to ${parsed.topicName}${parsed.subtopicName ? ` / ${parsed.subtopicName}` : ""}`
    );

    return ok({
      material: {
        id: material.id,
        title: material.title,
        status: material.status,
        storageUrl: material.storageUrl,
        topic: parsed.topicName,
        subtopic: parsed.subtopicName,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
