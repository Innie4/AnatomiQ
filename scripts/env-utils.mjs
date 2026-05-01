import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

export function loadAppEnv() {
  loadEnvConfig(process.cwd());
}

export function parseRequiredUrl(value, label) {
  if (!value?.trim()) {
    throw new Error(`${label} is required.`);
  }

  try {
    return new URL(value.trim());
  } catch (error) {
    throw new Error(`${label} is not a valid URL: ${error.message}`);
  }
}

export function validateSupabaseDatabaseUrls() {
  const databaseUrl = parseRequiredUrl(process.env.DATABASE_URL, "DATABASE_URL");
  const directUrl = parseRequiredUrl(process.env.DIRECT_URL, "DIRECT_URL");

  if (!databaseUrl.hostname.includes("pooler.supabase.com") || databaseUrl.port !== "6543") {
    throw new Error("DATABASE_URL must point to the Supabase transaction pooler on port 6543.");
  }

  const directIsSessionPooler =
    directUrl.hostname.includes("pooler.supabase.com") && directUrl.port === "5432";
  const directIsDirectHost = directUrl.hostname.startsWith("db.") && directUrl.port === "5432";

  if (!directIsSessionPooler && !directIsDirectHost) {
    throw new Error(
      "DIRECT_URL must point to either the Supavisor session pooler on port 5432 or the direct Supabase host on port 5432.",
    );
  }

  if (!databaseUrl.searchParams.get("pgbouncer")) {
    throw new Error("DATABASE_URL must include pgbouncer=true.");
  }

  if (!databaseUrl.password || !directUrl.password) {
    throw new Error("Database credentials are incomplete. URL-encode reserved password characters before saving the URLs.");
  }

  return { databaseUrl, directUrl };
}

export function getRequiredEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}
