-- Add password reset and email verification tokens to FacultyUser
ALTER TABLE "FacultyUser" ADD COLUMN "resetToken" TEXT;
ALTER TABLE "FacultyUser" ADD COLUMN "resetTokenExpiry" TIMESTAMP(3);
ALTER TABLE "FacultyUser" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "FacultyUser" ADD COLUMN "verificationToken" TEXT;

-- Create unique indexes
CREATE UNIQUE INDEX "FacultyUser_resetToken_key" ON "FacultyUser"("resetToken");
CREATE UNIQUE INDEX "FacultyUser_verificationToken_key" ON "FacultyUser"("verificationToken");
