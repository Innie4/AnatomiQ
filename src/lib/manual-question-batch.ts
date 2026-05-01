import { Difficulty, QuestionType } from "@prisma/client";

export type ManualQuestionBatchItem = {
  type: QuestionType;
  stem: string;
  answer: string;
  options?: string[];
  explanation?: string | null;
  difficulty: Difficulty;
};

function normalizeFieldName(field: string) {
  return field.trim().toLowerCase();
}

function mapDifficulty(value: string | undefined, fallback: Difficulty) {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim().toUpperCase().replace(/\s+/g, "_");

  if (
    normalized === Difficulty.FOUNDATIONAL ||
    normalized === Difficulty.INTERMEDIATE ||
    normalized === Difficulty.ADVANCED
  ) {
    return normalized;
  }

  throw new Error(`Invalid difficulty value: ${value}`);
}

function normalizeOptionLine(line: string) {
  return line.replace(/^[-*]\s*/, "").replace(/^[A-D][.)]\s*/i, "").trim();
}

function splitBlocks(input: string) {
  return input
    .replace(/\r\n/g, "\n")
    .split(/\n\s*---+\s*\n/g)
    .map((block) => block.trim())
    .filter(Boolean);
}

export function parseManualQuestionBatch(params: {
  type: QuestionType;
  defaultDifficulty: Difficulty;
  input: string;
}) {
  const blocks = splitBlocks(params.input);

  if (!blocks.length) {
    throw new Error("Add at least one question block before uploading.");
  }

  return blocks.map((block, index) => {
    const lines = block.split("\n");
    const fields = new Map<string, string[]>();
    let currentField: string | null = null;

    for (const rawLine of lines) {
      const line = rawLine.trimEnd();

      if (!line.trim()) {
        continue;
      }

      const fieldMatch = line.match(/^(question|q|answer|a|explanation|options|difficulty)\s*:\s*(.*)$/i);

      if (fieldMatch) {
        currentField = normalizeFieldName(fieldMatch[1]);
        const remainder = fieldMatch[2].trim();
        const normalizedField =
          currentField === "q"
            ? "question"
            : currentField === "a"
              ? "answer"
              : currentField;

        if (!fields.has(normalizedField)) {
          fields.set(normalizedField, []);
        }

        if (remainder) {
          fields.get(normalizedField)?.push(
            normalizedField === "options" ? normalizeOptionLine(remainder) : remainder,
          );
        }

        currentField = normalizedField;
        continue;
      }

      if (!currentField) {
        throw new Error(`Question block ${index + 1} contains text before a supported field label.`);
      }

      if (!fields.has(currentField)) {
        fields.set(currentField, []);
      }

      fields.get(currentField)?.push(
        currentField === "options" ? normalizeOptionLine(line) : line.trim(),
      );
    }

    const stem = fields.get("question")?.join(" ").trim();
    const rawAnswer = fields.get("answer")?.join(" ").trim();
    const explanation = fields.get("explanation")?.join(" ").trim() || null;
    const options = (fields.get("options") ?? []).map((option) => option.trim()).filter(Boolean);
    const difficulty = mapDifficulty(fields.get("difficulty")?.join(" ").trim(), params.defaultDifficulty);

    if (!stem) {
      throw new Error(`Question block ${index + 1} is missing a Question field.`);
    }

    if (!rawAnswer) {
      throw new Error(`Question block ${index + 1} is missing an Answer field.`);
    }

    if (params.type === QuestionType.MCQ) {
      if (options.length !== 4) {
        throw new Error(`Question block ${index + 1} must include exactly four options for MCQ uploads.`);
      }

      const answerIndex = ["A", "B", "C", "D"].indexOf(rawAnswer.trim().toUpperCase());
      const answer = answerIndex >= 0 ? options[answerIndex] : rawAnswer;

      if (!options.some((option) => option.trim().toLowerCase() === answer.trim().toLowerCase())) {
        throw new Error(`Question block ${index + 1} has an answer that does not match the provided options.`);
      }

      return {
        type: params.type,
        stem,
        answer,
        options,
        explanation,
        difficulty,
      } satisfies ManualQuestionBatchItem;
    }

    return {
      type: params.type,
      stem,
      answer: rawAnswer,
      explanation,
      difficulty,
    } satisfies ManualQuestionBatchItem;
  });
}

export function countManualQuestionBlocks(input: string) {
  return splitBlocks(input).length;
}
