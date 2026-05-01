import { z } from "zod";

export const uploadMaterialSchema = z.object({
  title: z.string().min(3),
  courseName: z.string().min(3),
  topicName: z.string().min(2),
  subtopicName: z.string().optional().nullable(),
});

export const processMaterialSchema = z.object({
  materialId: z.string().cuid(),
});

export const uploadManualQuestionBatchSchema = z.object({
  materialId: z.string().cuid(),
  type: z.enum(["MCQ", "SHORT_ANSWER", "THEORY"]),
  defaultDifficulty: z.enum(["FOUNDATIONAL", "INTERMEDIATE", "ADVANCED"]).default("INTERMEDIATE"),
  input: z.string().min(10),
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
  durationMinutes: z.number().int().min(0).max(180).optional(),
});

export const gradeMcqSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().cuid(),
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
