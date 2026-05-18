import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seed...");

  // Seed first admin user
  const adminPasswordHash = await bcrypt.hash("admin123", 10);

  // Check if admin already exists
  const existingAdmin = await prisma.facultyUser.findUnique({
    where: { email: "admin@anatomiq.local" },
  });

  if (!existingAdmin) {
    console.log("Creating admin user...");
    await prisma.facultyUser.create({
      data: {
        id: randomUUID(),
        email: "admin@anatomiq.local",
        passwordHash: adminPasswordHash,
        fullName: "Admin User",
        department: "University of Uyo",
        isActive: true,
      },
    });
  } else {
    console.log("Admin user already exists, skipping...");
  }

  console.log("Database seed completed successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
