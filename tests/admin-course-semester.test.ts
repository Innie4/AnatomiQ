import { after, describe, it } from "node:test";
import assert from "node:assert";
import { randomUUID } from "node:crypto";
import { CourseSemester, PrismaClient } from "@prisma/client";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const ADMIN_KEY = process.env.ADMIN_UPLOAD_KEY || "test-admin-key";

describe("admin course semester management", () => {
  const prisma = new PrismaClient();
  const suffix = randomUUID().slice(0, 8).toUpperCase();
  const code = `T${suffix.slice(0, 5)}`;
  const name = `Semester Test ${suffix}`;

  after(async () => {
    await prisma.course.deleteMany({ where: { code } });
    await prisma.$disconnect();
  });

  it("creates an admin course with a semester using the upload admin key", async () => {
    const response = await fetch(`${BASE_URL}/api/admin/courses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-upload-key": ADMIN_KEY,
      },
      body: JSON.stringify({
        code,
        name,
        semester: CourseSemester.SECOND,
        department: "Human Anatomy",
      }),
    });

    assert.strictEqual(response.status, 200);
    const payload = await response.json();
    assert.strictEqual(payload.course.code, code);
    assert.strictEqual(payload.course.semester, CourseSemester.SECOND);
  });

  it("exposes course semester metadata through the public courses API", async () => {
    const response = await fetch(`${BASE_URL}/api/courses`);
    assert.strictEqual(response.status, 200);
    const payload = await response.json();
    const course = payload.courses.find((item: { code: string }) => item.code === code);

    assert.ok(course);
    assert.strictEqual(course.semester, CourseSemester.SECOND);
  });
});
