import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Add code column if it doesn't exist
    await prisma.$executeRaw`ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "code" TEXT;`;
    console.log('Column added');

    // Update existing course with default code
    await prisma.$executeRaw`UPDATE "Course" SET "code" = 'ANA101' WHERE "slug" = 'human-anatomy' AND "code" IS NULL;`;
    console.log('Default code set');

    // Make code column required and unique
    await prisma.$executeRaw`ALTER TABLE "Course" ALTER COLUMN "code" SET NOT NULL;`;
    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "Course_code_key" ON "Course"("code");`;
    console.log('Constraints applied');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
