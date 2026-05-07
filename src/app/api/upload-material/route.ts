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
    console.log("[upload-material] Starting upload request");

    // Authenticate using JWT or legacy key
    const auth = await authenticateRequest(db, request);
    if (!auth) {
      console.log("[upload-material] Authentication failed");
      return fail("Unauthorized", 401);
    }

    console.log("[upload-material] Authenticated user:", auth.userId);

    console.log("[upload-material] Parsing form data");
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      console.log("[upload-material] No file provided");
      return fail("A file is required.");
    }

    console.log("[upload-material] File received:", file.name, file.size, file.type);

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      console.log("[upload-material] File too large:", file.size);
      return fail("The uploaded file exceeds the 25MB limit.");
    }

    if (!SUPPORTED_UPLOAD_MIME_TYPES.includes(file.type as (typeof SUPPORTED_UPLOAD_MIME_TYPES)[number])) {
      console.log("[upload-material] Unsupported file type:", file.type);
      return fail("Unsupported file type.");
    }

    console.log("[upload-material] Validating schema");
    const parsed = uploadMaterialSchema.parse({
      title: formData.get("title"),
      courseName: formData.get("courseName"),
      topicName: formData.get("topicName"),
      subtopicName: formData.get("subtopicName") || null,
    });

    console.log("[upload-material] Parsed data:", parsed);

    console.log("[upload-material] Converting file to buffer");
    const buffer = Buffer.from(await file.arrayBuffer());
    const extension = file.name.split(".").pop() || "bin";
    const storageKey = `materials/${toSlug(parsed.courseName)}/${Date.now()}-${randomUUID()}.${extension}`;

    console.log("[upload-material] Uploading to S3:", storageKey);
    const storage = await uploadBufferToS3({
      key: storageKey,
      buffer,
      contentType: file.type,
    });

    console.log("[upload-material] S3 upload successful, creating material record");
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

    console.log("[upload-material] Material created:", material.id);

    // Log audit trail
    console.log("[upload-material] Logging audit");
    await logAudit(
      db,
      auth.userId,
      "upload_material",
      "material",
      material.id,
      `Uploaded ${material.title} to ${parsed.topicName}${parsed.subtopicName ? ` / ${parsed.subtopicName}` : ""}`
    );

    console.log("[upload-material] Upload complete");
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
    console.error("[upload-material] Error occurred:", error);
    return handleRouteError(error);
  }
}
