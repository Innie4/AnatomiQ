import type { QuestionType } from "@prisma/client";

export function buildImageExtractionPrompt() {
  return [
    "You are extracting course source material from an uploaded teaching asset.",
    "Return only faithful text from the image or scanned page.",
    "Preserve labels, numbered callouts, headings, captions, and relevant wording.",
    "Do not add outside knowledge or fill in missing labels.",
  ].join(" ");
}

export function buildPdfRepairPrompt() {
  return [
    "You are reading a course PDF as source material for exam generation.",
    "Extract the original wording as faithfully as possible.",
    "Preserve section headings, figure references, numbered lists, and terminology.",
    "Do not infer missing content or add any facts not visible in the file.",
  ].join(" ");
}

export function buildConceptExtractionPrompt(payload: {
  courseName: string;
  topicName: string;
  subtopicName?: string | null;
  chunks: Array<{ sequence: number; heading: string | null; text: string }>;
}) {
  const source = payload.chunks
    .map(
      (chunk) =>
        `Chunk ${chunk.sequence}${chunk.heading ? ` (${chunk.heading})` : ""}:\n${chunk.text}`,
    )
    .join("\n\n");

  return `
You are structuring course teaching material for a grounded knowledge graph.

Course: ${payload.courseName}
Topic: ${payload.topicName}
Subtopic: ${payload.subtopicName ?? "Not provided"}

Return strict JSON with this shape:
{
  "materialOverview": "string",
  "chunks": [
    {
      "sequence": 1,
      "heading": "string or null",
      "suggestedSubtopic": "string or null",
      "conceptSummary": "string",
      "concepts": [
        {
          "name": "string",
          "description": "string or null",
          "facts": ["fact 1", "fact 2"]
        }
      ]
    }
  ]
}

Rules:
- Use only the provided source text.
- Do not add facts from general knowledge.
- Each fact must be explicitly supportable from the chunk it belongs to.
- Keep concept names concise and subject-specific.

Source:
${source}
`.trim();
}

export function buildQuestionGenerationPrompt(payload: {
  courseName: string;
  topicName: string;
  subtopicName?: string | null;
  questionType: QuestionType;
  count: number;
  chunks: Array<{ sequence: number; heading: string | null; text: string }>;
}) {
  const source = payload.chunks
    .map(
      (chunk) =>
        `Chunk ${chunk.sequence}${chunk.heading ? ` (${chunk.heading})` : ""}:\n${chunk.text}`,
    )
    .join("\n\n");

  return `
You are generating exam questions for AcademIQ.

Course: ${payload.courseName}
Topic: ${payload.topicName}
Subtopic: ${payload.subtopicName ?? "Not provided"}
Question type: ${payload.questionType}
Requested count: ${payload.count}

Return strict JSON with this shape:
{
  "questions": [
    {
      "type": "${payload.questionType}",
      "stem": "string",
      "options": ["A", "B", "C", "D"],
      "answer": "string",
      "explanation": "string or null",
      "difficulty": "FOUNDATIONAL | INTERMEDIATE | ADVANCED",
      "sourceChunkSequences": [1],
      "sourceSnippet": "short excerpt from source"
    }
  ]
}

Rules:
- Questions must come strictly from the provided source chunks.
- Do not use outside knowledge, even if it seems obvious.
- Every question must cite one or more provided chunk sequences.
- Source snippets must be direct or lightly compressed excerpts of the source.
- Avoid duplicated wording across stems.
- For MCQ, provide exactly 4 options and make only one option correct.
- For SHORT_ANSWER and THEORY, do not include options.
- Answers and explanations must remain grounded in the provided text.

Source chunks:
${source}
`.trim();
}
