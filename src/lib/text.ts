import { sha256 } from "@/lib/utils";

export type SemanticChunk = {
  sequence: number;
  heading: string | null;
  text: string;
  tokenEstimate: number;
  sourceHash: string;
};

export function normalizeWhitespace(input: string) {
  return input.replace(/\r/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function estimateTokens(text: string) {
  return Math.ceil(text.length / 4);
}

export function extractJson<T>(raw: string): T {
  const fenced = raw.match(/```json\s*([\s\S]*?)```/i)?.[1];
  const candidate = fenced ?? raw;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");

  if (start === -1 || end === -1 || end < start) {
    throw new Error("Could not locate JSON object in model output.");
  }

  return JSON.parse(candidate.slice(start, end + 1)) as T;
}

export function createSourceSnippet(text: string, maxLength = 240) {
  const compact = normalizeWhitespace(text).replace(/\s+/g, " ");
  return compact.length <= maxLength ? compact : `${compact.slice(0, maxLength - 1)}…`;
}

export function tokenize(text: string) {
  return normalizeWhitespace(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

export function tokenSimilarity(a: string, b: string) {
  const aTokens = new Set(tokenize(a));
  const bTokens = new Set(tokenize(b));
  const shared = [...aTokens].filter((token) => bTokens.has(token)).length;

  return shared / Math.max(1, Math.min(aTokens.size, bTokens.size));
}

export function cosineSimilarity(a: number[], b: number[]) {
  if (!a.length || !b.length || a.length !== b.length) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    normA += a[index] * a[index];
    normB += b[index] * b[index];
  }

  if (!normA || !normB) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function parseParagraphHeading(paragraph: string) {
  const firstLine = paragraph.split("\n")[0]?.trim();

  if (!firstLine) {
    return null;
  }

  if (firstLine.length < 90 && /^[A-Z0-9][A-Za-z0-9 ,:()/-]+$/.test(firstLine)) {
    return firstLine;
  }

  return null;
}

export function splitIntoSemanticChunks(input: string, maxChars = 1500) {
  const text = normalizeWhitespace(input);
  const paragraphs = text.split("\n\n").filter(Boolean);
  const chunks: SemanticChunk[] = [];
  let buffer = "";
  let heading: string | null = null;
  let sequence = 0;

  const flush = () => {
    const normalized = normalizeWhitespace(buffer);

    if (!normalized) {
      return;
    }

    sequence += 1;
    chunks.push({
      sequence,
      heading,
      text: normalized,
      tokenEstimate: estimateTokens(normalized),
      sourceHash: sha256(normalized),
    });

    buffer = "";
    heading = null;
  };

  for (const paragraph of paragraphs) {
    const maybeHeading = parseParagraphHeading(paragraph);

    if (maybeHeading && buffer.length > maxChars * 0.65) {
      flush();
    }

    if (!heading && maybeHeading) {
      heading = maybeHeading;
    }

    const nextValue = buffer ? `${buffer}\n\n${paragraph}` : paragraph;

    if (nextValue.length > maxChars && buffer) {
      flush();
      buffer = paragraph;
      if (!heading) {
        heading = maybeHeading;
      }
      continue;
    }

    buffer = nextValue;
  }

  flush();
  return chunks;
}
