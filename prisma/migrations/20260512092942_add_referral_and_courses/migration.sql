/*
  Warnings:

  - The `status` column on the `Referral` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'COMPLETED', 'EXPIRED');

-- DropForeignKey
ALTER TABLE "public"."FacultyUser" DROP CONSTRAINT "FacultyUser_referredBy_fkey";

-- AlterTable
ALTER TABLE "Referral" DROP COLUMN "status",
ADD COLUMN     "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING';
