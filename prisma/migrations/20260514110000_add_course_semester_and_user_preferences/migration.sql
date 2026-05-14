CREATE TYPE "CourseSemester" AS ENUM ('FIRST', 'SECOND');

ALTER TABLE "Course"
ADD COLUMN "semester" "CourseSemester" NOT NULL DEFAULT 'FIRST';

ALTER TABLE "FacultyUser"
ADD COLUMN "themePreference" TEXT NOT NULL DEFAULT 'system',
ADD COLUMN "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "referralNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "subscriptionNotifications" BOOLEAN NOT NULL DEFAULT true;
