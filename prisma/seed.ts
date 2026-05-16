import { PrismaClient } from "@prisma/client";
import slugify from "slugify";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

const DEFAULT_TOPICS = [
  {
    courseName: "General Science",
    courseCode: "GEN101",
    courseDescription: "Foundational principles across biology, chemistry, and physics.",
    topics: [
      {
        name: "Scientific Method",
        summary: "Introduction to research, hypothesis testing, and scientific inquiry.",
        children: ["Observation", "Hypothesis", "Experimentation", "Conclusion"],
      },
      {
        name: "Cell Biology",
        summary: "Study of cell structure, function, and organization.",
        children: ["Cell Membrane", "Nucleus", "Organelles"],
      },
    ],
  },
  {
    courseName: "Human Anatomy",
    courseCode: "ANA101",
    courseDescription: "University of Uyo Human Anatomy knowledge base for topic-grounded learning.",
    topics: [
      {
        name: "General Anatomy",
        summary: "Foundational principles, anatomical terminology, planes, and body organization.",
        children: ["Anatomical Terminology", "Body Planes", "Surface Anatomy"],
      },
      {
        name: "Neuroanatomy",
        summary: "Central nervous system structures, pathways, cranial nerves, and meninges.",
        children: ["Brain", "Spinal Cord", "Cranial Nerves"],
      },
    ],
  },
  {
    courseName: "Mathematics",
    courseCode: "MAT101",
    courseDescription: "Core mathematical concepts for all students.",
    topics: [
      {
        name: "Algebra",
        summary: "Foundational algebraic structures and equations.",
        children: ["Linear Equations", "Quadratic Equations", "Matrices"],
      },
    ],
  },
];

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

  for (const courseData of DEFAULT_TOPICS) {
    const courseSlug = slugify(courseData.courseName, { lower: true, strict: true });
    
    // Check if course exists
    let course = await prisma.course.findUnique({
      where: { slug: courseSlug },
    });

    if (!course) {
      console.log(`Creating ${courseData.courseName} course...`);
      course = await prisma.course.create({
        data: {
          id: randomUUID(),
          code: courseData.courseCode,
          name: courseData.courseName,
          slug: courseSlug,
          description: courseData.courseDescription,
        },
      });
    }

    console.log(`Seeding topics for ${courseData.courseName}...`);
    for (const topic of courseData.topics) {
      const topicSlug = slugify(topic.name, { lower: true, strict: true });

      // Check if parent topic exists
      let parent = await prisma.topic.findUnique({
        where: { slug: topicSlug },
      });

      if (!parent) {
        console.log(`Creating topic: ${topic.name}`);
        parent = await prisma.topic.create({
          data: {
            id: randomUUID(),
            name: topic.name,
            slug: topicSlug,
            summary: topic.summary,
            level: 0,
            isSystem: true,
            courseId: course.id,
          },
        });
      }

      for (const childName of topic.children) {
        const childSlug = slugify(`${topic.name}-${childName}`, { lower: true, strict: true });

        // Check if child topic exists
        const existingChild = await prisma.topic.findUnique({
          where: { slug: childSlug },
        });

        if (!existingChild) {
          console.log(`Creating subtopic: ${childName}`);
          await prisma.topic.create({
            data: {
              id: randomUUID(),
              name: childName,
              slug: childSlug,
              summary: `${childName} content within ${topic.name}.`,
              level: 1,
              isSystem: true,
              courseId: course.id,
              parentTopicId: parent.id,
            },
          });
        }
      }
    }
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
