import fs from "node:fs/promises";
import path from "node:path";

import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  env,
  hasS3,
  hasSupabaseStorage,
  requireEnv,
  usesLocalStorage,
  usesS3Storage,
  usesSupabaseStorage,
} from "@/lib/env";

let s3Client: S3Client | null = null;
let supabaseClient: SupabaseClient | null = null;

function getClient() {
  if (!hasS3) {
    throw new Error("S3 is not configured.");
  }

  if (!s3Client) {
    s3Client = new S3Client({
      region: requireEnv(env.awsRegion, "AWS_REGION"),
      credentials: {
        accessKeyId: requireEnv(env.awsAccessKeyId, "AWS_ACCESS_KEY_ID"),
        secretAccessKey: requireEnv(env.awsSecretAccessKey, "AWS_SECRET_ACCESS_KEY"),
      },
    });
  }

  return s3Client;
}

function getSupabaseClient() {
  if (!hasSupabaseStorage) {
    throw new Error("Supabase Storage is not configured.");
  }

  if (!supabaseClient) {
    supabaseClient = createClient(
      requireEnv(env.supabaseUrl, "SUPABASE_URL"),
      requireEnv(env.supabaseServiceRoleKey, "SUPABASE_SERVICE_ROLE_KEY"),
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );
  }

  return supabaseClient;
}

function localRoot() {
  return path.join(process.cwd(), "storage");
}

export function normalizeStorageKey(key: string) {
  const normalized = key
    .replace(/\\/g, "/")
    .split("/")
    .filter(Boolean);

  if (!normalized.length || normalized.some((segment) => segment === "." || segment === "..")) {
    throw new Error("Invalid storage key.");
  }

  return normalized.join("/");
}

export function resolveLocalStoragePath(key: string) {
  const target = path.resolve(localRoot(), normalizeStorageKey(key));
  const root = localRoot();

  if (!target.startsWith(root)) {
    throw new Error("Invalid storage path.");
  }

  return target;
}

function buildLocalUrl(key: string) {
  return `/api/material-file/${normalizeStorageKey(key).split("/").map(encodeURIComponent).join("/")}`;
}

function buildS3PublicUrl(key: string) {
  if (env.awsS3PublicBaseUrl) {
    return `${env.awsS3PublicBaseUrl.replace(/\/$/, "")}/${key}`;
  }

  return `https://${requireEnv(env.awsS3Bucket, "AWS_S3_BUCKET")}.s3.${requireEnv(
    env.awsRegion,
    "AWS_REGION",
  )}.amazonaws.com/${key}`;
}

function buildSupabasePublicUrl(key: string) {
  const client = getSupabaseClient();
  const bucket = requireEnv(env.supabaseStorageBucket, "SUPABASE_STORAGE_BUCKET");
  const { data } = client.storage.from(bucket).getPublicUrl(normalizeStorageKey(key));
  return data.publicUrl;
}

export async function uploadBufferToStorage(params: {
  key: string;
  buffer: Buffer;
  contentType: string;
}) {
  const normalizedKey = normalizeStorageKey(params.key);

  if (usesSupabaseStorage) {
    const client = getSupabaseClient();
    const bucket = requireEnv(env.supabaseStorageBucket, "SUPABASE_STORAGE_BUCKET");
    const { error } = await client.storage.from(bucket).upload(normalizedKey, params.buffer, {
      contentType: params.contentType,
      upsert: true,
    });

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    return {
      key: normalizedKey,
      url: buildSupabasePublicUrl(normalizedKey),
    };
  }

  if (usesS3Storage) {
    if (!hasS3) {
      throw new Error("S3 storage is not configured.");
    }

    const client = getClient();
    const bucket = requireEnv(env.awsS3Bucket, "AWS_S3_BUCKET");

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: normalizedKey,
        Body: params.buffer,
        ContentType: params.contentType,
      }),
    );

    return {
      key: normalizedKey,
      url: buildS3PublicUrl(normalizedKey),
    };
  }

  if (!usesLocalStorage) {
    throw new Error("Remote storage is not configured. Set Supabase Storage credentials.");
  }

  const filePath = resolveLocalStoragePath(normalizedKey);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, params.buffer);

  return {
    key: normalizedKey,
    url: buildLocalUrl(normalizedKey),
  };
}

export async function downloadBufferFromStorage(key: string) {
  const normalizedKey = normalizeStorageKey(key);

  if (usesSupabaseStorage) {
    const client = getSupabaseClient();
    const bucket = requireEnv(env.supabaseStorageBucket, "SUPABASE_STORAGE_BUCKET");
    const { data, error } = await client.storage.from(bucket).download(normalizedKey);

    if (error || !data) {
      throw new Error(`Supabase download failed: ${error?.message ?? "No data returned"}`);
    }

    return Buffer.from(await data.arrayBuffer());
  }

  if (usesS3Storage) {
    if (!hasS3) {
      throw new Error("S3 storage is not configured.");
    }

    const client = getClient();
    const bucket = requireEnv(env.awsS3Bucket, "AWS_S3_BUCKET");
    const response = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: normalizedKey,
      }),
    );

    const bytes = await response.Body?.transformToByteArray();

    if (!bytes) {
      throw new Error(`Could not download S3 object: ${normalizedKey}`);
    }

    return Buffer.from(bytes);
  }

  if (!usesLocalStorage) {
    throw new Error("Remote storage is not configured. Set Supabase Storage credentials.");
  }

  const filePath = resolveLocalStoragePath(normalizedKey);
  return fs.readFile(filePath);
}

export async function uploadBufferToS3(params: {
  key: string;
  buffer: Buffer;
  contentType: string;
}) {
  return uploadBufferToStorage(params);
}

export async function downloadBufferFromS3(key: string) {
  return downloadBufferFromStorage(key);
}
