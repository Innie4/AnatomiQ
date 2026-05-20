import { loadAppEnv } from "./env-utils.mjs";

loadAppEnv();

const appUrl = (process.argv[2] || process.env.UPLOAD_VERIFY_URL || "http://localhost:3000").replace(/\/$/, "");
const adminKey = process.env.ADMIN_UPLOAD_KEY;
const uploadSizeBytes = 45 * 1024 * 1024;

if (!adminKey) {
  console.error("ADMIN_UPLOAD_KEY is required.");
  process.exit(1);
}

const payload = new Uint8Array(uploadSizeBytes);
payload.fill("A".charCodeAt(0));

const formData = new FormData();
formData.append("file", new Blob([payload], { type: "text/plain" }), "verify-45mb-upload.txt");
formData.append("title", `45MB Upload Verification ${Date.now()}`);
formData.append("courseCode", "VERIFY45");
formData.append("courseName", "Upload Verification");
formData.append("topicName", "Payload Limit");
formData.append("subtopicName", "Local Verification");

console.log(`Uploading ${uploadSizeBytes} bytes to ${appUrl}/api/upload-material`);

const response = await fetch(`${appUrl}/api/upload-material`, {
  method: "POST",
  headers: {
    "x-admin-upload-key": adminKey,
  },
  body: formData,
});

const responseText = await response.text();
let payloadJson = null;

try {
  payloadJson = JSON.parse(responseText);
} catch {
  // Keep raw text for diagnostics below.
}

if (response.status === 413) {
  console.error("Upload failed with 413 Payload Too Large.");
  console.error(responseText);
  process.exit(1);
}

if (!response.ok) {
  console.error(`Upload failed with status ${response.status}.`);
  console.error(responseText);
  process.exit(1);
}

const materialId = payloadJson?.material?.id;
console.log(`Upload succeeded with status ${response.status}. Material ID: ${materialId ?? "unknown"}`);

if (materialId) {
  const cleanupResponse = await fetch(`${appUrl}/api/delete-material`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "x-admin-upload-key": adminKey,
    },
    body: JSON.stringify({ materialId }),
  });

  if (cleanupResponse.ok) {
    console.log("Verification material record cleaned up.");
  } else {
    console.warn(`Cleanup returned ${cleanupResponse.status}; remove material ${materialId} manually if needed.`);
  }
}
