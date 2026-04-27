import { Difficulty, QuestionType, type ContentChunk } from "@prisma/client";

import { createSourceSnippet, normalizeWhitespace } from "@/lib/text";

type LocalQuestionDraft = {
  type: QuestionType;
  stem: string;
  options?: string[];
  answer: string;
  explanation: string;
  difficulty: Difficulty;
  sourceChunkSequences: number[];
  sourceSnippet: string;
};

function splitSentences(text: string) {
  return normalizeWhitespace(text)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 30);
}

function toDifficulty(length: number) {
  if (length < 110) {
    return Difficulty.FOUNDATIONAL;
  }

  if (length < 180) {
    return Difficulty.INTERMEDIATE;
  }

  return Difficulty.ADVANCED;
}

function buildMcqDraft(
  chunk: ContentChunk,
  sentence: string,
  distractors: string[],
): LocalQuestionDraft | null {
  const uniqueOptions = Array.from(new Set([sentence, ...distractors]));
  const options = uniqueOptions.slice(0, 4);

  if (options.length < 4) {
    return null;
  }

  return {
    type: QuestionType.MCQ,
    stem: `Which option best matches the uploaded anatomy material for ${chunk.heading ?? "this topic"}?`,
    options,
    answer: sentence,
    explanation: "The correct option is the exact grounded statement pulled from the uploaded source material.",
    difficulty: toDifficulty(sentence.length),
    sourceChunkSequences: [chunk.sequence],
    sourceSnippet: createSourceSnippet(sentence),
  };
}

function buildShortAnswerDraft(chunk: ContentChunk, sentence: string): LocalQuestionDraft {
  return {
    type: QuestionType.SHORT_ANSWER,
    stem: `State the key anatomy point conveyed in this source passage from ${chunk.heading ?? "the uploaded material"}.`,
    answer: sentence,
    explanation: "This answer is lifted directly from the uploaded material to preserve grounding.",
    difficulty: toDifficulty(sentence.length),
    sourceChunkSequences: [chunk.sequence],
    sourceSnippet: createSourceSnippet(sentence),
  };
}

function buildTheoryDraft(chunk: ContentChunk): LocalQuestionDraft {
  const chunkSnippet = createSourceSnippet(chunk.text, 320);

  return {
    type: QuestionType.THEORY,
    stem: `Using only the uploaded material, discuss the anatomy points covered in this passage: "${chunkSnippet}"`,
    answer: normalizeWhitespace(chunk.text),
    explanation: "The structured reference answer reproduces the content of the cited chunk only.",
    difficulty: toDifficulty(chunk.text.length),
    sourceChunkSequences: [chunk.sequence],
    sourceSnippet: chunkSnippet,
  };
}

export function generateLocalQuestionDrafts(params: {
  type: QuestionType;
  count: number;
  chunks: ContentChunk[];
}) {
  const drafts: LocalQuestionDraft[] = [];
  const sentencePool = params.chunks.flatMap((chunk) =>
    splitSentences(chunk.text).map((sentence) => ({ chunk, sentence })),
  );

  if (params.type === QuestionType.MCQ) {
    for (let index = 0; index < sentencePool.length && drafts.length < params.count + 3; index += 1) {
      const current = sentencePool[index];
      const distractors = sentencePool
        .filter((item) => item.chunk.id !== current.chunk.id || item.sentence !== current.sentence)
        .map((item) => item.sentence);
      const draft = buildMcqDraft(current.chunk, current.sentence, distractors);

      if (draft) {
        drafts.push(draft);
      }
    }

    return drafts;
  }

  if (params.type === QuestionType.SHORT_ANSWER) {
    for (const item of sentencePool) {
      drafts.push(buildShortAnswerDraft(item.chunk, item.sentence));
      if (drafts.length >= params.count + 3) {
        break;
      }
    }

    return drafts;
  }

  for (const chunk of params.chunks) {
    drafts.push(buildTheoryDraft(chunk));
    if (drafts.length >= params.count + 3) {
      break;
    }
  }

  return drafts;
}
