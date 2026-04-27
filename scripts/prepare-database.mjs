import { spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

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
  console.error("DIRECT_URL is required for remote Prisma schema pushes and seeds.");
  process.exit(1);
}

if (databaseUrl.startsWith("file:")) {
  console.log("Skipping database preparation for local file-based databases.");
  process.exit(0);
}

console.log("Preparing remote ANATOMIQ database...");
run("npx", ["prisma", "db", "push", "--accept-data-loss", "--skip-generate"]);
run("npx", ["tsx", "prisma/seed.ts"]);
