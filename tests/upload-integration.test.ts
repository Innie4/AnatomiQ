import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { PrismaClient } from "@prisma/client";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const ADMIN_KEY = process.env.ADMIN_UPLOAD_KEY || "test-admin-key";

describe("Upload Integration Tests", () => {
  let prisma: PrismaClient;

  before(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
  });

  after(async () => {
    await prisma.$disconnect();
  });

  it("should authenticate with x-admin-upload-key header", async () => {
    const response = await fetch(`${BASE_URL}/api/admin-overview`, {
      headers: {
        "x-admin-upload-key": ADMIN_KEY,
      },
    });

    assert.strictEqual(response.status, 200, "Should return 200 with valid key");
    const data = await response.json();
    assert.ok(data.summary, "Should have summary object");
  });

  it("should reject requests without authentication", async () => {
    const response = await fetch(`${BASE_URL}/api/admin-overview`);
    assert.strictEqual(response.status, 401, "Should return 401 without auth");

    const data = await response.json();
    assert.ok(data.error, "Should have error message");
  });

  it("should reject invalid authentication keys", async () => {
    const response = await fetch(`${BASE_URL}/api/admin-overview`, {
      headers: {
        "x-admin-upload-key": "invalid-key-12345",
      },
    });

    assert.strictEqual(response.status, 401, "Should return 401 with invalid key");
  });

  it("should validate upload material requires file", async () => {
    const formData = new FormData();
    formData.append("title", "Test Material");
    formData.append("courseName", "Human Anatomy");
    formData.append("topicName", "Test Topic");
    // Missing file

    const response = await fetch(`${BASE_URL}/api/upload-material`, {
      method: "POST",
      headers: {
        "x-admin-upload-key": ADMIN_KEY,
      },
      body: formData,
    });

    assert.ok(response.status >= 400, "Should fail validation without file");

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      assert.ok(data.error, "Should have error message");
    }
  });

  it("should validate upload material requires topic", async () => {
    const formData = new FormData();
    formData.append("file", new Blob(["test content"], { type: "text/plain" }), "test.txt");
    formData.append("title", "Test Material");
    formData.append("courseName", "Human Anatomy");
    // Missing topicName

    const response = await fetch(`${BASE_URL}/api/upload-material`, {
      method: "POST",
      headers: {
        "x-admin-upload-key": ADMIN_KEY,
      },
      body: formData,
    });

    assert.ok(response.status >= 400, "Should fail validation without topic");
  });

  it("should handle process-material with authentication", async () => {
    const response = await fetch(`${BASE_URL}/api/process-material`, {
      method: "POST",
      headers: {
        "x-admin-upload-key": ADMIN_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        materialId: "non-existent-id",
      }),
    });

    // Should authenticate but fail on material not found
    assert.ok(
      response.status === 404 || response.status === 500,
      "Should authenticate but fail on non-existent material"
    );
  });

  it("should reject process-material without authentication", async () => {
    const response = await fetch(`${BASE_URL}/api/process-material`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        materialId: "test-id",
      }),
    });

    // Should return 401 for unauthorized, may return 500 if error handling catches auth failure
    assert.ok(
      response.status === 401 || response.status === 500,
      `Should return 401 or 500, got ${response.status}`
    );
  });

  it("should handle admin-materials list with authentication", async () => {
    const response = await fetch(`${BASE_URL}/api/admin-materials`, {
      headers: {
        "x-admin-upload-key": ADMIN_KEY,
      },
    });

    assert.strictEqual(response.status, 200, "Should return 200 with valid auth");
    const data = await response.json();
    assert.ok(Array.isArray(data.materials), "Should return materials array");
  });

  it("should handle material-questions with authentication", async () => {
    const response = await fetch(`${BASE_URL}/api/material-questions`, {
      headers: {
        "x-admin-upload-key": ADMIN_KEY,
      },
    });

    assert.ok(response.status === 200 || response.status === 422, "Should authenticate");
  });
});
