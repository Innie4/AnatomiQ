DROP INDEX IF EXISTS "Question_materialId_manualOrder_key";
DROP INDEX IF EXISTS "Question_materialId_manualOrder_idx";

CREATE INDEX "Question_materialId_type_manualOrder_idx" ON "Question"("materialId", "type", "manualOrder");
CREATE UNIQUE INDEX "Question_materialId_type_manualOrder_key" ON "Question"("materialId", "type", "manualOrder");
