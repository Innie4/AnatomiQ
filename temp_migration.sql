-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- DropIndex
DROP INDEX "FacultyUser_googleId_key";

-- DropIndex
DROP INDEX "FacultyUser_facebookId_key";

-- AlterTable
ALTER TABLE "public"."FacultyUser" DROP COLUMN "avatarUrl",
DROP COLUMN "facebookId",
DROP COLUMN "faculty",
DROP COLUMN "googleId",
DROP COLUMN "isGuest",
ALTER COLUMN "passwordHash" SET NOT NULL;

