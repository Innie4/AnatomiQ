import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { PrismaClient } from "@prisma/client";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const ADMIN_KEY = process.env.ADMIN_UPLOAD_KEY || "test-admin-key";

describe("Admin API Endpoints", () => {
  let prisma: PrismaClient;

  before(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
  });

  after(async () => {
    await prisma.$disconnect();
  });

  it("should return 401 for admin-overview without auth", async () => {
    const response = await fetch(`${BASE_URL}/api/admin-overview`);
    assert.strictEqual(response.status, 401);
    const data = await response.json();
    assert.ok(data.error);
  });

  it("should return 401 for admin-overview with invalid key", async () => {
    const response = await fetch(`${BASE_URL}/api/admin-overview`, {
      headers: {
        "x-admin-upload-key": "invalid-key",
      },
    });
    assert.strictEqual(response.status, 401);
  });

  it("should return 200 for admin-overview with valid key", async () => {
    const response = await fetch(`${BASE_URL}/api/admin-overview`, {
      headers: {
        "x-admin-upload-key": ADMIN_KEY,
      },
    });
    assert.strictEqual(response.status, 200);
    const data = await response.json();
    assert.ok(data.summary);
    assert.ok(typeof data.summary.totalMaterials === "number");
    assert.ok(typeof data.summary.totalChunks === "number");
    assert.ok(typeof data.summary.totalQuestions === "number");
  });

  it("should return 401 for upload-material without auth", async () => {
    const formData = new FormData();
    formData.append("file", new Blob(["test content"], { type: "text/plain" }), "test.txt");
    formData.append("title", "Test Material");
    formData.append("courseName", "Human Anatomy");
    formData.append("topicName", "Test Topic");

    const response = await fetch(`${BASE_URL}/api/upload-material`, {
      method: "POST",
      body: formData,
    });
    assert.strictEqual(response.status, 401);
  });

  it("should validate required fields for upload-material", async () => {
    const formData = new FormData();
    formData.append("file", new Blob(["test content"], { type: "text/plain" }), "test.txt");
    // Missing required fields

    const response = await fetch(`${BASE_URL}/api/upload-material`, {
      method: "POST",
      headers: {
        "x-admin-upload-key": ADMIN_KEY,
      },
      body: formData,
    });

    // Should fail validation
    assert.ok(response.status >= 400);
  });

  it("should reject files that are too large", async () => {
    // Create a 26MB file (exceeds 25MB limit)
    const largeContent = new Uint8Array(26 * 1024 * 1024);
    const formData = new FormData();
    formData.append("file", new Blob([largeContent], { type: "text/plain" }), "large.txt");
    formData.append("title", "Large File");
    formData.append("courseName", "Human Anatomy");
    formData.append("topicName", "Test Topic");

    const response = await fetch(`${BASE_URL}/api/upload-material`, {
      method: "POST",
      headers: {
        "x-admin-upload-key": ADMIN_KEY,
      },
      body: formData,
    });

    assert.ok(response.status >= 400);
    const data = await response.json();
    assert.ok(data.error);
    assert.ok(data.error.toLowerCase().includes("25mb") || data.error.toLowerCase().includes("limit"));
  });
});
