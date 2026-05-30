import { z } from "zod";

const requiredTrimmedString = (minLength: number, fieldName: string) =>
  z
    .string({ error: `${fieldName} is required.` })
    .trim()
    .min(minLength, `${fieldName} is required.`);

export const uploadMaterialSchema = z.object({
  title: requiredTrimmedString(3, "Material title"),
  courseCode: requiredTrimmedString(2, "Course code"),
  courseName: requiredTrimmedString(3, "Course name"),
  department: requiredTrimmedString(2, "Department"),
  topicName: requiredTrimmedString(2, "Topic"),
  subtopicName: z.string().trim().optional().nullable(),
});

export const uploadMaterialSignedUrlSchema = uploadMaterialSchema.extend({
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  fileSize: z.number().int().positive(),
});

export const uploadMaterialDirectSchema = uploadMaterialSignedUrlSchema.extend({
  storageKey: z.string().min(1),
});

export const updateMaterialsSchema = z.object({
  materialIds: z.array(z.string().uuid()).min(1).max(100),
  title: z.string().trim().min(3).optional(),
  courseCode: requiredTrimmedString(2, "Course code"),
  courseName: requiredTrimmedString(3, "Course name"),
  department: requiredTrimmedString(2, "Department"),
  topicName: requiredTrimmedString(2, "Topic"),
  subtopicName: z.string().trim().optional().nullable(),
});

export const processMaterialSchema = z.object({
  materialId: z.string().uuid(),
});

export const uploadManualQuestionBatchSchema = z.object({
  materialId: z.string().uuid(),
  type: z.enum(["MCQ", "SHORT_ANSWER", "THEORY"]),
  defaultDifficulty: z.enum(["FOUNDATIONAL", "INTERMEDIATE", "ADVANCED"]).default("INTERMEDIATE"),
  input: z.string().min(10),
});

const manualQuestionBaseSchema = z.object({
  manualOrder: z.number().int().positive().optional(),
  type: z.enum(["MCQ", "SHORT_ANSWER", "THEORY"]),
  stem: z.string().min(5),
  answer: z.string().min(1),
  explanation: z.string().min(3),
  difficulty: z.enum(["FOUNDATIONAL", "INTERMEDIATE", "ADVANCED"]),
  options: z.array(z.string().min(1)).optional(),
});

export const createManualQuestionSchema = z
  .object({
    materialId: z.string().uuid(),
  })
  .merge(manualQuestionBaseSchema)
  .superRefine((value, ctx) => {
    if (value.type === "MCQ" && value.options?.length !== 4) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "MCQ questions require exactly four options.",
        path: ["options"],
      });
    }
  });

export const updateManualQuestionSchema = manualQuestionBaseSchema.superRefine((value, ctx) => {
  if (value.type === "MCQ" && value.options?.length !== 4) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "MCQ questions require exactly four options.",
      path: ["options"],
    });
  }
});

export const materialQuestionQuerySchema = z.object({
  materialId: z.string().uuid(),
  type: z.preprocess(
    (value) => (value == null || value === "" ? undefined : value),
    z.enum(["MCQ", "SHORT_ANSWER", "THEORY"]).optional(),
  ),
});

export const gradeExamSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().uuid(),
      response: z.string(),
    }),
  ),
});

export const generateQuestionSchema = z.object({
  topicSlug: z.string().min(1),
  subtopicSlug: z.string().optional(),
  type: z.enum(["MCQ", "SHORT_ANSWER", "THEORY"]),
  count: z.number().int().min(1).max(20),
});

export const startExamSchema = z.object({
  topicSlug: z.string().min(1),
  subtopicSlug: z.string().optional(),
  type: z.enum(["MCQ", "SHORT_ANSWER", "THEORY", "MIXED"]),
  count: z.number().int().min(1).max(30),
  durationMinutes: z.number({ error: "Timer is required." }).int().min(1, "Timer is required.").max(180),
});

export const gradeMcqSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().uuid(),
      selectedOption: z.string().min(1),
    }),
  ),
});

export const aiConceptExtractionSchema = z.object({
  materialOverview: z.string(),
  chunks: z.array(
    z.object({
      sequence: z.number().int(),
      heading: z.string().nullable(),
      suggestedSubtopic: z.string().nullable(),
      conceptSummary: z.string(),
      concepts: z.array(
        z.object({
          name: z.string(),
          description: z.string().nullable(),
          facts: z.array(z.string()).min(1),
        }),
      ),
    }),
  ),
});

export const aiQuestionsSchema = z.object({
  questions: z.array(
    z.object({
      type: z.enum(["MCQ", "SHORT_ANSWER", "THEORY"]),
      stem: z.string(),
      options: z.array(z.string()).optional(),
      answer: z.string(),
      explanation: z.string().nullable(),
      difficulty: z.enum(["FOUNDATIONAL", "INTERMEDIATE", "ADVANCED"]),
      sourceChunkSequences: z.array(z.number().int()).min(1),
      sourceSnippet: z.string(),
    }),
  ),
});
