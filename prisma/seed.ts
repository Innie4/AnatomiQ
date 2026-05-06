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
  // Seed first admin user
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  await prisma.facultyUser.upsert({
    where: { email: "admin@anatomiq.local" },
    update: {},
    create: {
      id: randomUUID(),
      email: "admin@anatomiq.local",
      passwordHash: adminPasswordHash,
      fullName: "Admin User",
      department: "Human Anatomy",
      isActive: true,
    },
  });

  const course = await prisma.course.upsert({
    where: { slug: "human-anatomy" },
    update: {},
    create: {
      id: randomUUID(),
      name: "Human Anatomy",
      slug: "human-anatomy",
      description:
        "University of Uyo Human Anatomy knowledge base for topic-grounded learning and exam generation.",
    },
  });

  for (const topic of ANATOMY_TOPICS) {
    const parent = await prisma.topic.upsert({
      where: { slug: slugify(topic.name, { lower: true, strict: true }) },
      update: {
        summary: topic.summary,
      },
      create: {
        id: randomUUID(),
        name: topic.name,
        slug: slugify(topic.name, { lower: true, strict: true }),
        summary: topic.summary,
        level: 0,
        isSystem: true,
        courseId: course.id,
      },
    });

    for (const childName of topic.children) {
      await prisma.topic.upsert({
        where: { slug: slugify(`${topic.name}-${childName}`, { lower: true, strict: true }) },
        update: {},
        create: {
          id: randomUUID(),
          name: childName,
          slug: slugify(`${topic.name}-${childName}`, { lower: true, strict: true }),
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

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
