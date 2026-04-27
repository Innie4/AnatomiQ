import fs from "node:fs/promises";
import path from "node:path";

import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { env, hasS3, requireEnv, usesLocalStorage } from "@/lib/env";

let s3Client: S3Client | null = null;

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

function localRoot() {
  return path.resolve(process.cwd(), "storage");
}

export function resolveLocalStoragePath(key: string) {
  const target = path.resolve(localRoot(), key);
  const root = localRoot();

  if (!target.startsWith(root)) {
    throw new Error("Invalid storage path.");
  }

  return target;
}

function buildLocalUrl(key: string) {
  return `/api/material-file/${key.split("/").map(encodeURIComponent).join("/")}`;
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

export async function uploadBufferToS3(params: {
  key: string;
  buffer: Buffer;
  contentType: string;
}) {
  if (usesLocalStorage || !hasS3) {
    const filePath = resolveLocalStoragePath(params.key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, params.buffer);

    return {
      key: params.key,
      url: buildLocalUrl(params.key),
    };
  }

  const client = getClient();
  const bucket = requireEnv(env.awsS3Bucket, "AWS_S3_BUCKET");

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: params.key,
      Body: params.buffer,
      ContentType: params.contentType,
    }),
  );

  return {
    key: params.key,
    url: buildS3PublicUrl(params.key),
  };
}

export async function downloadBufferFromS3(key: string) {
  if (usesLocalStorage || !hasS3) {
    const filePath = resolveLocalStoragePath(key);
    return fs.readFile(filePath);
  }

  const client = getClient();
  const bucket = requireEnv(env.awsS3Bucket, "AWS_S3_BUCKET");
  const response = await client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );

  const bytes = await response.Body?.transformToByteArray();

  if (!bytes) {
    throw new Error(`Could not download S3 object: ${key}`);
  }

  return Buffer.from(bytes);
}
