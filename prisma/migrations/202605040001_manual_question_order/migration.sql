ALTER TABLE "Question"
ADD COLUMN "manualOrder" INTEGER;

CREATE INDEX "Question_materialId_manualOrder_idx" ON "Question"("materialId", "manualOrder");

CREATE UNIQUE INDEX "Question_materialId_manualOrder_key" ON "Question"("materialId", "manualOrder");
