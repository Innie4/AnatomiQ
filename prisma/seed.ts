import { CourseSemester, PrismaClient } from "@prisma/client";
import slugify from "slugify";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

const COURSES_DATA = [
  {
    code: "ANA 211",
    name: "Gross Anatomy of Upper & Lower Limbs",
    slug: "gross-anatomy-upper-lower-limbs",
    semester: CourseSemester.FIRST,
    description: "Regional anatomy of the upper and lower extremities including bones, muscles, nerves and vessels.",
    department: "Anatomy",
    topics: [
      {
        name: "Upper Limb",
        summary: "Detailed study of the pectoral region, axilla, arm, forearm and hand.",
        children: ["Pectoral Region", "Axilla", "Arm", "Forearm", "Hand", "Shoulder Joint"]
      },
      {
        name: "Lower Limb",
        summary: "Detailed study of the gluteal region, thigh, leg and foot.",
        children: ["Gluteal Region", "Thigh", "Popliteal Fossa", "Leg", "Foot", "Hip Joint", "Knee Joint"]
      }
    ]
  },
  {
    code: "ANA 221",
    name: "Gross Anatomy of Thorax, Abdomen, Pelvis & Perineum",
    slug: "gross-anatomy-thorax-abdomen-pelvis",
    semester: CourseSemester.SECOND,
    description: "Regional anatomy of the trunk including thoracic and abdominal viscera.",
    department: "Anatomy",
    topics: [
      {
        name: "Thorax",
        summary: "Thoracic wall, lungs, pleura and mediastinum.",
        children: ["Thoracic Wall", "Lungs", "Pleura", "Mediastinum", "Heart", "Great Vessels"]
      },
      {
        name: "Abdomen",
        summary: "Abdominal wall, peritoneum and viscera.",
        children: ["Anterior Abdominal Wall", "Peritoneum", "Stomach", "Intestines", "Liver", "Pancreas", "Kidneys"]
      },
      {
        name: "Pelvis and Perineum",
        summary: "Pelvic cavity, viscera and perineal structures.",
        children: ["Pelvic Walls", "Urinary Bladder", "Male Reproductive Organs", "Female Reproductive Organs", "Rectum", "Perineum"]
      }
    ]
  },
  {
    code: "PHS 211",
    name: "General & Blood Physiology",
    slug: "general-blood-physiology",
    semester: CourseSemester.FIRST,
    description: "Basic principles of physiology and study of blood components and functions.",
    department: "Physiology",
    topics: [
      {
        name: "General Physiology",
        summary: "Cell physiology, transport mechanisms and homeostasis.",
        children: ["Cell Membrane", "Transport Mechanisms", "Homeostasis", "Body Fluids"]
      },
      {
        name: "Blood Physiology",
        summary: "Composition and functions of blood.",
        children: ["Plasma Proteins", "Red Blood Cells", "White Blood Cells", "Platelets", "Hemostasis", "Blood Groups"]
      }
    ]
  },
  {
    code: "BCH 211",
    name: "General Biochemistry",
    slug: "general-biochemistry",
    semester: CourseSemester.FIRST,
    description: "Chemistry of biomolecules and basic metabolic processes.",
    department: "Biochemistry",
    topics: [
      {
        name: "Chemistry of Biomolecules",
        summary: "Structure and properties of carbohydrates, lipids, proteins and nucleic acids.",
        children: ["Carbohydrates", "Lipids", "Amino Acids & Proteins", "Nucleic Acids", "Enzymes", "Vitamins"]
      }
    ]
  }
];

async function main() {
  console.log("Starting database seed for Uniuyo 2026...");

  // Seed admin user
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

  for (const courseData of COURSES_DATA) {
    console.log(`Processing course: ${courseData.name} (${courseData.code})`);
    
    const course = await prisma.course.upsert({
      where: { slug: courseData.slug },
      update: {
        code: courseData.code,
        name: courseData.name,
        description: courseData.description,
        semester: courseData.semester,
        department: courseData.department,
      },
      create: {
        id: randomUUID(),
        code: courseData.code,
        name: courseData.name,
        slug: courseData.slug,
        description: courseData.description,
        semester: courseData.semester,
        department: courseData.department,
      },
    });

    for (const topicData of courseData.topics) {
      const topicSlug = slugify(`${courseData.code}-${topicData.name}`, { lower: true, strict: true });
      
      const parentTopic = await prisma.topic.upsert({
        where: { slug: topicSlug },
        update: {
          name: topicData.name,
          summary: topicData.summary,
          courseId: course.id,
        },
        create: {
          id: randomUUID(),
          name: topicData.name,
          slug: topicSlug,
          summary: topicData.summary,
          level: 0,
          isSystem: true,
          courseId: course.id,
        },
      });

      for (const childName of topicData.children) {
        const childSlug = slugify(`${courseData.code}-${topicData.name}-${childName}`, { lower: true, strict: true });
        
        await prisma.topic.upsert({
          where: { slug: childSlug },
          update: {
            name: childName,
            summary: `${childName} content within ${topicData.name}.`,
            courseId: course.id,
            parentTopicId: parentTopic.id,
          },
          create: {
            id: randomUUID(),
            name: childName,
            slug: childSlug,
            summary: `${childName} content within ${topicData.name}.`,
            level: 1,
            isSystem: true,
            courseId: course.id,
            parentTopicId: parentTopic.id,
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
