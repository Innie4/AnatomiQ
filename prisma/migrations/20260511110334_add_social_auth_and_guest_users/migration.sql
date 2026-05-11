-- AlterTable
ALTER TABLE "FacultyUser" ADD COLUMN "faculty" TEXT,
ADD COLUMN "isGuest" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "googleId" TEXT,
ADD COLUMN "facebookId" TEXT,
ADD COLUMN "avatarUrl" TEXT,
ALTER COLUMN "passwordHash" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "FacultyUser_googleId_key" ON "FacultyUser"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "FacultyUser_facebookId_key" ON "FacultyUser"("facebookId");
