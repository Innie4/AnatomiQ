import { PrismaClient } from "@prisma/client";
import slugify from "slugify";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

const ANATOMY_TOPICS = [
  {
    name: "General Anatomy",
    summary: "Foundational principles, anatomical terminology, planes, and body organization.",
    children: ["Anatomical Terminology", "Body Planes", "Surface Anatomy"],
  },
  {
    name: "Upper Limb",
    summary: "Bones, joints, muscles, vessels, nerves, and clinical correlations of the upper limb.",
    children: ["Shoulder Region", "Arm", "Forearm", "Hand"],
  },
  {
    name: "Lower Limb",
    summary: "Regional anatomy of the pelvis, thigh, leg, foot, and gait-related structures.",
    children: ["Gluteal Region", "Thigh", "Leg", "Foot"],
  },
  {
    name: "Thorax",
    summary: "Thoracic wall, pleura, lungs, mediastinum, and heart anatomy.",
    children: ["Thoracic Wall", "Lungs and Pleura", "Mediastinum", "Heart"],
  },
  {
    name: "Abdomen",
    summary: "Abdominal wall, peritoneum, gastrointestinal anatomy, and vasculature.",
    children: ["Anterior Abdominal Wall", "Peritoneum", "Foregut", "Midgut", "Hindgut"],
  },
  {
    name: "Pelvis and Perineum",
    summary: "Pelvic cavity, pelvic viscera, perineum, and neurovascular anatomy.",
    children: ["Pelvic Walls", "Pelvic Viscera", "Perineum"],
  },
  {
    name: "Head and Neck",
    summary: "Skull, scalp, face, pharynx, larynx, and cervical anatomy.",
    children: ["Scalp and Face", "Deep Neck", "Pharynx", "Larynx"],
  },
  {
    name: "Neuroanatomy",
    summary: "Central nervous system structures, pathways, cranial nerves, and meninges.",
    children: ["Brain", "Spinal Cord", "Cranial Nerves", "Meninges"],
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
        department: "Human Anatomy",
        isActive: true,
      },
    });
  } else {
    console.log("Admin user already exists, skipping...");
  }

  // Check if course exists
  let course = await prisma.course.findUnique({
    where: { slug: "human-anatomy" },
  });

  if (!course) {
    console.log("Creating Human Anatomy course...");
    course = await prisma.course.create({
      data: {
        id: randomUUID(),
        name: "Human Anatomy",
        slug: "human-anatomy",
        description:
          "University of Uyo Human Anatomy knowledge base for topic-grounded learning and exam generation.",
      },
    });
  } else {
    console.log("Human Anatomy course already exists, skipping...");
  }

  console.log("Seeding anatomy topics...");
  for (const topic of ANATOMY_TOPICS) {
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
    } else {
      // Update summary if topic exists
      await prisma.topic.update({
        where: { id: parent.id },
        data: { summary: topic.summary },
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
