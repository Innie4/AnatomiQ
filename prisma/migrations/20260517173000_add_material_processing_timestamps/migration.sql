ALTER TABLE "Material"
  ADD COLUMN "processingStartedAt" TIMESTAMP(3),
  ADD COLUMN "processedAt" TIMESTAMP(3);

CREATE INDEX "Material_status_updatedAt_idx" ON "Material"("status", "updatedAt");
