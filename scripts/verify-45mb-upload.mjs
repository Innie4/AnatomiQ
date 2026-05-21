import { loadAppEnv } from "./env-utils.mjs";
import { createClient } from "@supabase/supabase-js";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

loadAppEnv();

const appUrl = (process.argv[2] || process.env.UPLOAD_VERIFY_URL || "http://localhost:3000").replace(/\/$/, "");
const adminKey = process.env.ADMIN_UPLOAD_KEY;
const uploadSizeMb = Number(process.env.UPLOAD_VERIFY_SIZE_MB || 45);
const uploadSizeBytes = uploadSizeMb * 1024 * 1024;
let uploadedStorageKey = null;
let tempFilePath = null;
let tempDirPath = null;

async function cleanupStorageObject() {
  if (
    !uploadedStorageKey ||
    !process.env.SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY ||
    !process.env.SUPABASE_STORAGE_BUCKET
  ) {
    return;
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await supabase.storage
    .from(process.env.SUPABASE_STORAGE_BUCKET)
    .remove([uploadedStorageKey]);

  if (error) {
    console.warn(`Storage cleanup failed for ${uploadedStorageKey}: ${error.message}`);
  } else {
    console.log("Verification storage object cleaned up.");
  }
}

async function cleanupTempFile() {
  if (tempFilePath) {
    await rm(tempFilePath, { force: true });
  }
  if (tempDirPath) {
    await rm(tempDirPath, { force: true, recursive: true });
  }
}

async function failAndExit(message, details) {
  console.error(message);
  if (details) {
    console.error(details);
  }
  await cleanupStorageObject();
  await cleanupTempFile();
  process.exit(1);
}

function uploadFileWithCurl(signedUrl, filePath, contentType) {
  const command = process.platform === "win32" ? "curl.exe" : "curl";
  return spawnSync(
    command,
    [
      "--fail",
      "--show-error",
      "--silent",
      "--request",
      "PUT",
      signedUrl,
      "-H",
      "cache-control: max-age=3600",
      "-H",
      `content-type: ${contentType}`,
      "--data-binary",
      `@${filePath}`,
    ],
    { encoding: "utf8" },
  );
}

if (!adminKey) {
  console.error("ADMIN_UPLOAD_KEY is required.");
  process.exit(1);
}

const metadata = {
  title: `${uploadSizeMb}MB Upload Verification ${Date.now()}`,
  courseCode: "VERIFY45",
  courseName: "Upload Verification",
  topicName: "Payload Limit",
  subtopicName: "Local Verification",
  fileName: `verify-${uploadSizeMb}mb-upload.txt`,
  mimeType: "text/plain",
  fileSize: uploadSizeBytes,
};

console.log(`Requesting signed upload URL from ${appUrl}/api/upload-material/signed-url`);

let signedUrlResponse;
try {
  signedUrlResponse = await fetch(`${appUrl}/api/upload-material/signed-url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-upload-key": adminKey,
    },
    body: JSON.stringify(metadata),
  });
} catch (error) {
  await failAndExit("Signed URL request failed before receiving a response.", error?.message ?? String(error));
}

const signedUrlText = await signedUrlResponse.text();
let signedUrlPayload = null;

try {
  signedUrlPayload = JSON.parse(signedUrlText);
} catch {
  // Keep raw text for diagnostics below.
}

if (!signedUrlResponse.ok) {
  await failAndExit(`Signed URL request failed with status ${signedUrlResponse.status}.`, signedUrlText);
}

console.log(`Uploading ${uploadSizeBytes} bytes directly to Supabase Storage`);

tempDirPath = await mkdtemp(path.join(tmpdir(), "anatomiq-upload-"));
tempFilePath = path.join(tempDirPath, metadata.fileName);
await writeFile(tempFilePath, Buffer.alloc(uploadSizeBytes, "A"));

const storageResponse = uploadFileWithCurl(signedUrlPayload.signedUrl, tempFilePath, metadata.mimeType);

if (storageResponse.status !== 0) {
  await failAndExit(
    `Direct storage upload failed with curl exit code ${storageResponse.status ?? "unknown"}.`,
    storageResponse.stderr || storageResponse.stdout || storageResponse.error?.message,
  );
}

uploadedStorageKey = signedUrlPayload.storageKey;

console.log(`Creating material record through ${appUrl}/api/upload-material`);

let response;
try {
  response = await fetch(`${appUrl}/api/upload-material`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-upload-key": adminKey,
    },
    body: JSON.stringify({
      ...metadata,
      storageKey: signedUrlPayload.storageKey,
    }),
  });
} catch (error) {
  await failAndExit("Material metadata request failed before receiving a response.", error?.message ?? String(error));
}

const responseText = await response.text();
let payloadJson = null;

try {
  payloadJson = JSON.parse(responseText);
} catch {
  // Keep raw text for diagnostics below.
}

if (response.status === 413) {
  await failAndExit("Material metadata request failed with 413 Payload Too Large.", responseText);
}

if (!response.ok) {
  await failAndExit(`Material metadata request failed with status ${response.status}.`, responseText);
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

await cleanupStorageObject();
await cleanupTempFile();
