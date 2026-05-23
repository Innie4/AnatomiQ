export const APP_NAME = "ANATOMIQ";
export const APP_TAGLINE = "Smarter learning. Better recall.";

export const MAX_UPLOAD_SIZE_MB = 50;
export const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;
export const MATERIAL_TEXT_PREVIEW_LIMIT = 1200;
export const QUESTION_BATCH_LIMIT = 12;
export const QUESTION_EMBEDDING_THRESHOLD = 0.94;
export const QUESTION_TOKEN_SIMILARITY_THRESHOLD = 0.82;

export const SUPPORTED_UPLOAD_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/plain",
] as const;

export const DEPARTMENT_OPTIONS = [
  "Human Anatomy",
  "Medicine and Surgery",
  "Nursing Science",
  "Physiology",
  "Biochemistry",
  "Medical Laboratory Science",
  "Pharmacy",
  "Radiography",
  "Dentistry",
  "Public Health",
] as const;

export const EXAM_TYPE_OPTIONS = [
  { label: "MCQ", value: "MCQ" },
  { label: "Short answer", value: "SHORT_ANSWER" },
  { label: "Theory", value: "THEORY" },
  { label: "Mixed mode", value: "MIXED" },
] as const;

export const QUESTION_COUNT_OPTIONS = [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100] as const;

export const TIMER_OPTIONS = [
  { label: "No timer", value: 0 },
  { label: "20 minutes", value: 20 },
  { label: "40 minutes", value: 40 },
  { label: "60 minutes (1 hour)", value: 60 },
  { label: "80 minutes", value: 80 },
  { label: "100 minutes", value: 100 },
  { label: "120 minutes (2 hours)", value: 120 },
  { label: "140 minutes", value: 140 },
  { label: "160 minutes", value: 160 },
  { label: "180 minutes (3 hours)", value: 180 },
] as const;
