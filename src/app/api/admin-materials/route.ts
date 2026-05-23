import { handleRouteError, ok, fail } from "@/lib/api";
import { authenticateRequest } from "@/lib/auth";
import { updateMaterialsCatalog } from "@/lib/materials";
import { getAdminMaterialOptions } from "@/lib/questions";
import { updateMaterialsSchema } from "@/lib/schemas";
import { db } from "@/lib/db";
import { sanitizeSearchQuery } from "@/lib/sanitize";

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(db, request);
    if (!auth) {
      return fail("Unauthorized", 401);
    }

    const url = new URL(request.url);
    const query = url.searchParams.get("q");
    const sanitizedQuery = query ? sanitizeSearchQuery(query) : undefined;
    const materials = await getAdminMaterialOptions(sanitizedQuery);
    return ok({ materials });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await authenticateRequest(db, request);
    if (!auth) {
      return fail("Unauthorized", 401);
    }

    const payload = updateMaterialsSchema.parse(await request.json());
    const materials = await updateMaterialsCatalog(payload);

    return ok({
      updatedCount: materials.length,
      materials: materials.map((material) => ({
        id: material.id,
        title: material.title,
        courseName: material.course.name,
        courseCode: material.course.code,
        department: material.course.department,
        topicName: material.topic.name,
        subtopicName: material.subtopic?.name ?? null,
      })),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
