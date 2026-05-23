import { NextRequest } from "next/server";
import { handleRouteError, ok, fail } from "@/lib/api";
import { authenticateRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const deleteMaterialSchema = z.object({
  materialId: z.string().uuid().optional(),
  materialIds: z.array(z.string().uuid()).min(1).max(100).optional(),
}).refine((value) => value.materialId || value.materialIds?.length, {
  message: "materialId or materialIds is required.",
});

export async function DELETE(request: NextRequest) {
  try {
    // Authenticate
    const auth = await authenticateRequest(db, request);
    if (!auth) {
      return fail("Unauthorized", 401);
    }

    // Parse body
    let body;
    try {
      body = await request.json();
    } catch {
      return fail("Invalid JSON", 400);
    }

    const parsed = deleteMaterialSchema.parse(body);
    const materialIds = parsed.materialIds ?? (parsed.materialId ? [parsed.materialId] : []);

    // Check if material exists and count related records
    const materials = await db.material.findMany({
      where: { id: { in: materialIds } },
      include: {
        _count: {
          select: {
            Question: true,
            ContentChunk: true,
          },
        },
      },
    });

    if (!materials.length) {
      return fail("Material not found", 404);
    }

    // Store counts before deletion
    const questionCount = materials.reduce((total, material) => total + material._count.Question, 0);
    const chunkCount = materials.reduce((total, material) => total + material._count.ContentChunk, 0);
    const foundIds = materials.map((material) => material.id);

    // Delete all related data (cascading)
    // 1. Delete questions linked to this material
    await db.question.deleteMany({
      where: { materialId: { in: foundIds } },
    });

    // 2. Delete chunks
    await db.contentChunk.deleteMany({
      where: { materialId: { in: foundIds } },
    });

    // 3. Delete the materials themselves
    await db.material.deleteMany({
      where: { id: { in: foundIds } },
    });

    return ok({
      success: true,
      message: "Material and all related data deleted successfully",
      deleted: {
        material: materials.length === 1 ? materials[0].title : `${materials.length} materials`,
        materialIds: foundIds,
        questions: questionCount,
        chunks: chunkCount,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
