import { NextRequest, NextResponse } from "next/server";
import { handleRouteError, ok, fail } from "@/lib/api";
import { authenticateRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const deleteMaterialSchema = z.object({
  materialId: z.string().uuid(),
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

    const { materialId } = deleteMaterialSchema.parse(body);

    // Check if material exists and count related records
    const material = await db.material.findUnique({
      where: { id: materialId },
      include: {
        _count: {
          select: {
            Question: true,
            ContentChunk: true,
          },
        },
      },
    });

    if (!material) {
      return fail("Material not found", 404);
    }

    // Store counts before deletion
    const questionCount = material._count.Question;
    const chunkCount = material._count.ContentChunk;

    // Delete all related data (cascading)
    // 1. Delete questions linked to this material
    await db.question.deleteMany({
      where: { materialId },
    });

    // 2. Delete chunks
    await db.contentChunk.deleteMany({
      where: { materialId },
    });

    // 3. Delete the material itself
    await db.material.delete({
      where: { id: materialId },
    });

    return ok({
      success: true,
      message: "Material and all related data deleted successfully",
      deleted: {
        material: material.title,
        questions: questionCount,
        chunks: chunkCount,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
