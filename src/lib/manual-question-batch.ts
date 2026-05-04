import { Difficulty, QuestionType } from "@prisma/client";

import { normalizeWhitespace, tokenSimilarity } from "@/lib/text";

export type ManualQuestionBatchItem = {
  manualOrder?: number;
  type: QuestionType;
  stem: string;
  answer: string;
  options?: string[];
  explanation: string;
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

function parseLegacyBlocks(params: {
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
    const explanation = fields.get("explanation")?.join(" ").trim();
    const options = (fields.get("options") ?? []).map((option) => option.trim()).filter(Boolean);
    const difficulty = mapDifficulty(fields.get("difficulty")?.join(" ").trim(), params.defaultDifficulty);

    if (!stem) {
      throw new Error(`Question block ${index + 1} is missing a Question field.`);
    }

    if (!rawAnswer) {
      throw new Error(`Question block ${index + 1} is missing an Answer field.`);
    }

    if (!explanation) {
      throw new Error(`Question block ${index + 1} is missing an Explanation field.`);
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
        manualOrder: index + 1,
        type: params.type,
        stem,
        answer,
        options,
        explanation,
        difficulty,
      } satisfies ManualQuestionBatchItem;
    }

    return {
      manualOrder: index + 1,
      type: params.type,
      stem,
      answer: rawAnswer,
      explanation,
      difficulty,
    } satisfies ManualQuestionBatchItem;
  });
}

type SectionName = "questions" | "answers" | "explanations" | "options" | "difficulties";

function parseSectionLines(lines: string[]) {
  const sections = new Map<SectionName, string[]>();
  let currentSection: SectionName | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const normalized = line.trim().toLowerCase().replace(/:$/, "");

    if (
      normalized === "questions" ||
      normalized === "answers" ||
      normalized === "explanations" ||
      normalized === "options" ||
      normalized === "difficulties"
    ) {
      currentSection = normalized;
      if (!sections.has(currentSection)) {
        sections.set(currentSection, []);
      }
      continue;
    }

    if (!currentSection) {
      continue;
    }

    sections.get(currentSection)?.push(line);
  }

  return sections;
}

function parseNumberedEntries(lines: string[], label: string) {
  const entries = new Map<number, string[]>();
  let currentNumber: number | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      continue;
    }

    const numberedMatch = line.match(/^(\d+)[.)]\s*(.*)$/);

    if (numberedMatch) {
      currentNumber = Number(numberedMatch[1]);
      entries.set(currentNumber, []);

      if (numberedMatch[2].trim()) {
        entries.get(currentNumber)?.push(numberedMatch[2].trim());
      }

      continue;
    }

    if (currentNumber === null) {
      throw new Error(`${label} section contains content without a question number.`);
    }

    entries.get(currentNumber)?.push(line);
  }

  if (!entries.size) {
    throw new Error(`${label} section is empty.`);
  }

  return entries;
}

function parseOptionEntry(lines: string[]) {
  const directSplit = lines
    .flatMap((line) => line.split(/\s*\|\s*/g))
    .map((value) => normalizeOptionLine(value))
    .filter(Boolean);

  if (directSplit.length === 4) {
    return directSplit;
  }

  const parsed: string[] = [];

  for (const line of lines) {
    const fragments = line.match(/[A-D][.)]\s*[^A-D]+(?=(?:\s+[A-D][.)]\s*)|$)/gi);

    if (fragments?.length) {
      for (const fragment of fragments) {
        const normalized = normalizeOptionLine(fragment);
        if (normalized) {
          parsed.push(normalized);
        }
      }
      continue;
    }

    const normalized = normalizeOptionLine(line);
    if (normalized) {
      parsed.push(normalized);
    }
  }

  return parsed.filter(Boolean);
}

function ensureMatchingNumbers(
  questions: Map<number, string[]>,
  target: Map<number, string[]>,
  label: string,
) {
  const questionNumbers = [...questions.keys()].sort((a, b) => a - b);
  const targetNumbers = [...target.keys()].sort((a, b) => a - b);

  if (questionNumbers.length !== targetNumbers.length) {
    throw new Error(`${label} count does not match the number of questions.`);
  }

  for (const questionNumber of questionNumbers) {
    if (!target.has(questionNumber)) {
      throw new Error(`${label} is missing entry number ${questionNumber}.`);
    }
  }
}

function parseNumberedSections(params: {
  type: QuestionType;
  defaultDifficulty: Difficulty;
  input: string;
}) {
  const sections = parseSectionLines(params.input.replace(/\r\n/g, "\n").split("\n"));
  const questionLines = sections.get("questions");
  const answerLines = sections.get("answers");
  const explanationLines = sections.get("explanations");

  if (!questionLines || !answerLines || !explanationLines) {
    throw new Error("Numbered uploads must include Questions, Answers, and Explanations sections.");
  }

  const questions = parseNumberedEntries(questionLines, "Questions");
  const answers = parseNumberedEntries(answerLines, "Answers");
  const explanations = parseNumberedEntries(explanationLines, "Explanations");
  const options = sections.get("options") ? parseNumberedEntries(sections.get("options") ?? [], "Options") : null;
  const difficulties = sections.get("difficulties")
    ? parseNumberedEntries(sections.get("difficulties") ?? [], "Difficulties")
    : null;

  ensureMatchingNumbers(questions, answers, "Answers");
  ensureMatchingNumbers(questions, explanations, "Explanations");

  if (params.type === QuestionType.MCQ) {
    if (!options) {
      throw new Error("MCQ numbered uploads must include an Options section.");
    }

    ensureMatchingNumbers(questions, options, "Options");
  }

  return [...questions.keys()]
    .sort((a, b) => a - b)
    .map((manualOrder) => {
      const stem = normalizeWhitespace((questions.get(manualOrder) ?? []).join(" ")).trim();
      const rawAnswer = normalizeWhitespace((answers.get(manualOrder) ?? []).join(" ")).trim();
      const explanation = normalizeWhitespace((explanations.get(manualOrder) ?? []).join(" ")).trim();
      const difficulty = mapDifficulty(
        difficulties ? normalizeWhitespace((difficulties.get(manualOrder) ?? []).join(" ")).trim() : undefined,
        params.defaultDifficulty,
      );

      if (!stem) {
        throw new Error(`Question ${manualOrder} is empty.`);
      }

      if (!rawAnswer) {
        throw new Error(`Answer ${manualOrder} is empty.`);
      }

      if (!explanation) {
        throw new Error(`Explanation ${manualOrder} is empty.`);
      }

      if (params.type !== QuestionType.MCQ) {
        return {
          manualOrder,
          type: params.type,
          stem,
          answer: rawAnswer,
          explanation,
          difficulty,
        } satisfies ManualQuestionBatchItem;
      }

      const parsedOptions = parseOptionEntry(options?.get(manualOrder) ?? []);

      if (parsedOptions.length !== 4) {
        throw new Error(`Options for question ${manualOrder} must contain exactly four choices.`);
      }

      const answerIndex = ["A", "B", "C", "D"].indexOf(rawAnswer.trim().toUpperCase());
      const answer = answerIndex >= 0 ? parsedOptions[answerIndex] : rawAnswer;

      if (!parsedOptions.some((option) => tokenSimilarity(option, answer) >= 1)) {
        throw new Error(`Answer ${manualOrder} does not match the provided options.`);
      }

      return {
        manualOrder,
        type: params.type,
        stem,
        answer,
        options: parsedOptions,
        explanation,
        difficulty,
      } satisfies ManualQuestionBatchItem;
    });
}

function looksLikeNumberedUpload(input: string) {
  const normalized = input.toLowerCase();
  return normalized.includes("\nquestions") && normalized.includes("\nanswers") && normalized.includes("\nexplanations");
}

export function parseManualQuestionBatch(params: {
  type: QuestionType;
  defaultDifficulty: Difficulty;
  input: string;
}) {
  const normalized = normalizeWhitespace(params.input);
  return looksLikeNumberedUpload(`\n${normalized}`)
    ? parseNumberedSections({ ...params, input: normalized })
    : parseLegacyBlocks({ ...params, input: normalized });
}

export function countManualQuestionBlocks(input: string) {
  const normalized = normalizeWhitespace(input);

  if (!normalized) {
    return 0;
  }

  try {
    return parseManualQuestionBatch({
      type: QuestionType.SHORT_ANSWER,
      defaultDifficulty: Difficulty.INTERMEDIATE,
      input: normalized,
    }).length;
  } catch {
    return splitBlocks(normalized).length;
  }
}
