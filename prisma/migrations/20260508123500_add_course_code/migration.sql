-- AlterTable
-- Add code column with a default value for existing rows
ALTER TABLE "Course" ADD COLUMN "code" TEXT;

-- Update existing rows with a default code based on slug
UPDATE "Course" SET "code" = 'ANA101' WHERE "slug" = 'human-anatomy';

-- Make code column required and unique
ALTER TABLE "Course" ALTER COLUMN "code" SET NOT NULL;
CREATE UNIQUE INDEX "Course_code_key" ON "Course"("code");
