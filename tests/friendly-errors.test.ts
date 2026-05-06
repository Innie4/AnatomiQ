import { describe, it } from "node:test";
import assert from "node:assert";
import { toFriendlyError } from "../src/lib/friendly-errors";

describe("toFriendlyError", () => {
  it("should convert network errors to friendly messages", () => {
    const error = new Error("fetch failed: ECONNREFUSED");
    const result = toFriendlyError(error);
    assert.strictEqual(
      result,
      "Unable to connect to the server. Please check your internet connection and try again."
    );
  });

  it("should convert authentication errors to friendly messages", () => {
    const error = new Error("Unauthorized: Invalid admin upload key.");
    const result = toFriendlyError(error);
    assert.strictEqual(result, "Access denied. Please check your credentials and try again.");
  });

  it("should convert database errors to friendly messages", () => {
    const error = new Error("Prisma Client: Connection pool timeout");
    const result = toFriendlyError(error);
    assert.strictEqual(
      result,
      "The system is temporarily unavailable. Please try again in a moment."
    );
  });

  it("should convert validation errors to friendly messages", () => {
    const error = new Error("Validation failed: title is required");
    const result = toFriendlyError(error);
    assert.strictEqual(
      result,
      "The information provided is incomplete or incorrect. Please review and try again."
    );
  });

  it("should convert file upload errors to friendly messages", () => {
    const error = new Error("File upload failed: size exceeds limit");
    const result = toFriendlyError(error);
    assert.strictEqual(
      result,
      "There was a problem uploading your file. Please check the file and try again."
    );
  });

  it("should convert storage errors to friendly messages", () => {
    const error = new Error("S3 bucket not accessible");
    const result = toFriendlyError(error);
    assert.strictEqual(result, "Unable to save the file. Please try again.");
  });

  it("should convert timeout errors to friendly messages", () => {
    const error = new Error("Request timeout after 30s");
    const result = toFriendlyError(error);
    assert.strictEqual(result, "The request took too long. Please try again.");
  });

  it("should convert 500 errors to friendly messages", () => {
    const error = new Error("500 Internal Server Error");
    const result = toFriendlyError(error);
    assert.strictEqual(result, "Something went wrong on our end. Please try again.");
  });

  it("should handle generic errors with fallback message", () => {
    const error = new Error("Something random went wrong");
    const result = toFriendlyError(error);
    assert.strictEqual(
      result,
      "Something unexpected happened. Please try again or contact support if the problem persists."
    );
  });

  it("should handle non-Error objects", () => {
    const result = toFriendlyError("Just a string error");
    assert.strictEqual(
      result,
      "Something unexpected happened. Please try again or contact support if the problem persists."
    );
  });
});
