import { randomUUID } from "node:crypto";

import { fail, handleRouteError, ok } from "@/lib/api";
import { authenticateRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadBufferToStorage } from "@/lib/storage";

const SUPPORTED_AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(db, request);
    if (!auth || auth.userId === "legacy-admin") {
      return fail("Unauthorized", 401);
    }

    const user = await db.facultyUser.findUnique({
      where: { id: auth.userId },
      select: { isGuest: true },
    });

    if (!user || user.isGuest) {
      return fail("Guests need to sign in or create an account before editing profile settings.", 403);
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return fail("A profile image is required.", 400);
    }

    if (!SUPPORTED_AVATAR_TYPES.includes(file.type)) {
      return fail("Profile image must be PNG, JPG, or WEBP.", 400);
    }

    if (file.size > MAX_AVATAR_BYTES) {
      return fail("Profile image must be 2MB or smaller.", 400);
    }

    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const storage = await uploadBufferToStorage({
      key: `avatars/${auth.userId}/${randomUUID()}.${extension}`,
      buffer: Buffer.from(await file.arrayBuffer()),
      contentType: file.type,
    });

    await db.facultyUser.update({
      where: { id: auth.userId },
      data: { avatarUrl: storage.url },
    });

    return ok({ avatarUrl: storage.url });
  } catch (error) {
    return handleRouteError(error);
  }
}
