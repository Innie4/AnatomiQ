const getEnv = (key: string) => process.env[key];

export const env = {
  databaseUrl: getEnv("DATABASE_URL"),
  directUrl: getEnv("DIRECT_URL"),
  openAiApiKey: getEnv("OPENAI_API_KEY"),
  openAiQuestionModel: getEnv("OPENAI_QUESTION_MODEL") || "gpt-5-mini",
  openAiExtractionModel: getEnv("OPENAI_EXTRACTION_MODEL") || "gpt-5-mini",
  openAiEmbeddingModel: getEnv("OPENAI_EMBEDDING_MODEL") || "text-embedding-3-small",
  adminUploadKey: getEnv("ADMIN_UPLOAD_KEY"),
  storageMode: getEnv("STORAGE_MODE") || "supabase",
  localStorageDir: getEnv("LOCAL_STORAGE_DIR") || "storage",
  supabaseUrl: getEnv("SUPABASE_URL") || getEnv("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseServiceRoleKey: getEnv("SUPABASE_SERVICE_ROLE_KEY"),
  supabaseStorageBucket: getEnv("SUPABASE_STORAGE_BUCKET") || "anatomiq-materials",
  awsAccessKeyId: getEnv("AWS_ACCESS_KEY_ID"),
  awsSecretAccessKey: getEnv("AWS_SECRET_ACCESS_KEY"),
  awsRegion: getEnv("AWS_REGION"),
  awsS3Bucket: getEnv("AWS_S3_BUCKET"),
  awsS3PublicBaseUrl: getEnv("AWS_S3_PUBLIC_BASE_URL"),
  appUrl: getEnv("NEXT_PUBLIC_APP_URL") || "http://localhost:3000",
};

export const hasDatabase = Boolean(env.databaseUrl);
export const hasOpenAi = Boolean(env.openAiApiKey);
export const usesLocalStorage = env.storageMode === "local";
export const usesSupabaseStorage = env.storageMode === "supabase";
export const usesS3Storage = env.storageMode === "s3";
export const hasSupabaseStorage = Boolean(
  env.supabaseUrl && env.supabaseServiceRoleKey && env.supabaseStorageBucket,
);
export const hasS3 = Boolean(
  env.awsAccessKeyId && env.awsSecretAccessKey && env.awsRegion && env.awsS3Bucket,
);

export function requireEnv(value: string | undefined, label: string) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${label}`);
  }

  return value;
}
