-- Add referral fields to FacultyUser
ALTER TABLE "FacultyUser" ADD COLUMN "referralCode" TEXT;
ALTER TABLE "FacultyUser" ADD COLUMN "referredBy" TEXT;
ALTER TABLE "FacultyUser" ADD COLUMN "referralCount" INTEGER NOT NULL DEFAULT 0;

-- Add course selection fields
ALTER TABLE "FacultyUser" ADD COLUMN "selectedCourses" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Create unique index on referral code
CREATE UNIQUE INDEX "FacultyUser_referralCode_key" ON "FacultyUser"("referralCode");

-- Create index on referredBy for faster lookups
CREATE INDEX "FacultyUser_referredBy_idx" ON "FacultyUser"("referredBy");

-- Add foreign key constraint for referredBy
ALTER TABLE "FacultyUser" ADD CONSTRAINT "FacultyUser_referredBy_fkey"
  FOREIGN KEY ("referredBy") REFERENCES "FacultyUser"("referralCode") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create Referral table for tracking referral details
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- Create indexes for Referral
CREATE INDEX "Referral_referrerId_idx" ON "Referral"("referrerId");
CREATE INDEX "Referral_referredUserId_idx" ON "Referral"("referredUserId");
CREATE UNIQUE INDEX "Referral_referredUserId_key" ON "Referral"("referredUserId");

-- Add foreign keys for Referral
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey"
  FOREIGN KEY ("referrerId") REFERENCES "FacultyUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredUserId_fkey"
  FOREIGN KEY ("referredUserId") REFERENCES "FacultyUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
