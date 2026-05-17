import { handleRouteError, ok, fail } from "@/lib/api";
import { authenticateRequest } from "@/lib/auth";
import { processMaterial } from "@/lib/materials";
import { processMaterialSchema } from "@/lib/schemas";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  console.log("[api/process-material] Starting request");
  try {
    const auth = await authenticateRequest(db, request);
    if (!auth) {
      console.log("[api/process-material] Authentication failed");
      return fail("Unauthorized", 401);
    }

    const body = await request.json();
    console.log("[api/process-material] Received payload:", body);
    
    const payload = processMaterialSchema.parse(body);
    console.log("[api/process-material] Processing material:", payload.materialId);
    
    const result = await processMaterial(payload.materialId);
    console.log("[api/process-material] Processing completed successfully");
    
    return ok({ result });
  } catch (error) {
    console.error("[api/process-material] Error processing material:", error);
    return handleRouteError(error);
  }
}
