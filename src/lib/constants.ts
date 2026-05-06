export const APP_NAME = "ANATOMIQ";
export const APP_TAGLINE = "Smarter anatomy. Better recall.";

export const MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024;
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

export const DEFAULT_ANATOMY_TOPICS = [
  {
    name: "General Anatomy",
    slug: "general-anatomy",
    summary: "Foundational terminology, body planes, and organization of the human body.",
    children: ["Anatomical Terminology", "Body Planes", "Surface Anatomy"],
  },
  {
    name: "Upper Limb",
    slug: "upper-limb",
    summary: "Regional anatomy of the shoulder, arm, forearm, and hand.",
    children: ["Shoulder Region", "Arm", "Forearm", "Hand"],
  },
  {
    name: "Thorax",
    slug: "thorax",
    summary: "Thoracic wall, lungs, pleura, mediastinum, and heart anatomy.",
    children: ["Thoracic Wall", "Lungs and Pleura", "Mediastinum", "Heart"],
  },
  {
    name: "Neuroanatomy",
    slug: "neuroanatomy",
    summary: "Brain, spinal cord, cranial nerves, and clinically relevant pathways.",
    children: ["Brain", "Spinal Cord", "Cranial Nerves", "Meninges"],
  },
];
