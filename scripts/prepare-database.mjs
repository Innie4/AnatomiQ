import { spawnSync } from "node:child_process";

import { loadAppEnv, validateSupabaseDatabaseUrls } from "./env-utils.mjs";

function run(command, args) {
  const executable = process.platform === "win32" ? "cmd.exe" : command;
  const finalArgs =
    process.platform === "win32" ? ["/d", "/s", "/c", `${command} ${args.join(" ")}`] : args;
  const result = spawnSync(executable, finalArgs, {
    stdio: "inherit",
  });

  if (result.status !== 0) {
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

console.log("Preparing remote ANATOMIQ database...");
run("npx", ["prisma", "migrate", "deploy"]);
run("npx", ["tsx", "prisma/seed.ts"]);
