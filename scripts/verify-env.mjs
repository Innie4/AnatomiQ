import { spawnSync } from "node:child_process";

import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

import { getRequiredEnv, loadAppEnv, validateSupabaseDatabaseUrls } from "./env-utils.mjs";

function run(command, args) {
  const executable = process.platform === "win32" ? "cmd.exe" : command;
  const finalArgs =
    process.platform === "win32" ? ["/d", "/s", "/c", `${command} ${args.join(" ")}`] : args;
  const result = spawnSync(executable, finalArgs, {
    stdio: "pipe",
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || result.error?.message || `${command} ${args.join(" ")} failed.`);
  }

  return result.stdout.trim();
}

async function main() {
  loadAppEnv();
  const { databaseUrl, directUrl } = validateSupabaseDatabaseUrls();
  console.log(`DATABASE_URL OK -> ${databaseUrl.hostname}:${databaseUrl.port}`);
  console.log(`DIRECT_URL OK -> ${directUrl.hostname}:${directUrl.port}`);

  getRequiredEnv("ADMIN_UPLOAD_KEY");
  console.log("ADMIN_UPLOAD_KEY OK");

  const prisma = new PrismaClient();

  try {
    const result = await prisma.$queryRawUnsafe("select 1 as ok");
    console.log(`Runtime database query OK -> ${JSON.stringify(result)}`);
  } finally {
    await prisma.$disconnect();
  }

  const migrateStatus = run("npx", ["prisma", "migrate", "status"]);
  console.log(`Migration status OK -> ${migrateStatus.split("\n").slice(-1)[0]}`);

  const supabase = createClient(
    getRequiredEnv("SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
  const bucket = getRequiredEnv("SUPABASE_STORAGE_BUCKET");
  const objectKey = `healthchecks/${Date.now()}-env-check.txt`;
  const payload = Buffer.from("ANATOMIQ env verification");

  const upload = await supabase.storage.from(bucket).upload(objectKey, payload, {
    contentType: "text/plain",
    upsert: true,
  });

  if (upload.error) {
    throw new Error(`Supabase upload failed: ${upload.error.message}`);
  }

  const download = await supabase.storage.from(bucket).download(objectKey);

  if (download.error || !download.data) {
    throw new Error(`Supabase download failed: ${download.error?.message ?? "No data returned"}`);
  }

  await supabase.storage.from(bucket).remove([objectKey]);
  console.log(`Supabase Storage OK -> ${bucket}`);

  const appUrl = getRequiredEnv("NEXT_PUBLIC_APP_URL").replace(/\/$/, "");
  const topicsResponse = await fetch(`${appUrl}/api/topics`, { method: "GET" });

  if (!topicsResponse.ok) {
    throw new Error(`NEXT_PUBLIC_APP_URL check failed with status ${topicsResponse.status}.`);
  }

  console.log(`NEXT_PUBLIC_APP_URL OK -> ${appUrl}`);

  if (process.env.OPENAI_API_KEY?.trim()) {
    console.log("OPENAI_API_KEY configured");
  } else {
    console.log("OPENAI_API_KEY skipped -> local grounded fallback remains active");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
