import { randomUUID } from "node:crypto";

import { handleRouteError, fail, ok } from "@/lib/api";
import { authenticateRequest } from "@/lib/auth";
import { MAX_UPLOAD_SIZE_BYTES, MAX_UPLOAD_SIZE_MB, SUPPORTED_UPLOAD_MIME_TYPES } from "@/lib/constants";
import { db } from "@/lib/db";
import { uploadMaterialSignedUrlSchema } from "@/lib/schemas";
import { createSignedStorageUploadUrl } from "@/lib/storage";
import { toSlug } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(db, request);
    if (!auth) {
      return fail("Unauthorized", 401);
    }

    const payload = uploadMaterialSignedUrlSchema.parse(await request.json());

    if (payload.fileSize > MAX_UPLOAD_SIZE_BYTES) {
      return fail(`The uploaded file exceeds the ${MAX_UPLOAD_SIZE_MB}MB limit.`);
    }

    if (!SUPPORTED_UPLOAD_MIME_TYPES.includes(payload.mimeType as (typeof SUPPORTED_UPLOAD_MIME_TYPES)[number])) {
      return fail("Unsupported file type.");
    }

    const extension = payload.fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
    const storageKey = `materials/${toSlug(payload.courseName)}/${Date.now()}-${randomUUID()}.${extension}`;
    const signedUpload = await createSignedStorageUploadUrl(storageKey);

    return ok({
      storageKey: signedUpload.key,
      signedUrl: signedUpload.signedUrl,
      token: signedUpload.token,
      path: signedUpload.path,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
