import { spawnSync } from "node:child_process";

import { loadAppEnv, validateSupabaseDatabaseUrls } from "./env-utils.mjs";

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function run(command, args, options = {}) {
  const attempts = options.attempts ?? 1;
  const executable = process.platform === "win32" ? "cmd.exe" : command;
  const finalArgs =
    process.platform === "win32" ? ["/d", "/s", "/c", `${command} ${args.join(" ")}`] : args;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const result = spawnSync(executable, finalArgs, {
      stdio: "inherit",
    });

    if (result.status === 0) {
      return;
    }

    if (attempt < attempts) {
      console.warn(`${command} ${args.join(" ")} failed; retrying (${attempt + 1}/${attempts})...`);
      sleep(3000);
      continue;
    }

    process.exit(result.status ?? 1);
  }
}

loadAppEnv();

const databaseUrl = process.env.DATABASE_URL?.trim();
const directUrl = process.env.DIRECT_URL?.trim();
const skipDatabasePrepare = process.env.SKIP_DB_PREPARE === "true";

if (skipDatabasePrepare) {
  console.log("Skipping database preparation because SKIP_DB_PREPARE=true.");
  process.exit(0);
}

if (!databaseUrl) {
  console.log("Skipping database preparation because DATABASE_URL is not set.");
  process.exit(0);
}

if (!directUrl) {
  console.error("DIRECT_URL is required for remote Prisma migrations and seeds.");
  process.exit(1);
}

if (databaseUrl.startsWith("file:")) {
  console.log("Skipping database preparation for local file-based databases.");
  process.exit(0);
}

validateSupabaseDatabaseUrls();

console.log("Preparing remote AcademIQ database...");
run("npx", ["prisma", "generate"]);
run("npx", ["prisma", "migrate", "deploy"], { attempts: 3 });
run("npx", ["tsx", "prisma/seed.ts"], { attempts: 2 });
