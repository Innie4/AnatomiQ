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

export const QUESTION_COUNT_OPTIONS = Array.from({ length: 30 }, (_, index) => index + 1);

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
