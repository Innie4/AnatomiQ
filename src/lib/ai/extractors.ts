import { PDFParse } from "pdf-parse";

import { getOpenAiClient } from "@/lib/ai/client";
import { buildImageExtractionPrompt, buildPdfRepairPrompt } from "@/lib/ai/prompts";
import { env, hasOpenAi } from "@/lib/env";
import { normalizeWhitespace } from "@/lib/text";

function toBase64(buffer: Buffer) {
  return buffer.toString("base64");
}

async function extractTextViaVision(params: {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  prompt: string;
}) {
  if (!hasOpenAi) {
    throw new Error("OpenAI is not configured.");
  }

  const openai = getOpenAiClient();
  const fileInputType = params.mimeType === "application/pdf" ? "input_file" : "input_image";
  const filePayload =
    fileInputType === "input_file"
      ? {
          type: "input_file" as const,
          filename: params.fileName,
          file_data: `data:${params.mimeType};base64,${toBase64(params.buffer)}`,
        }
      : {
          type: "input_image" as const,
          image_url: `data:${params.mimeType};base64,${toBase64(params.buffer)}`,
          detail: "auto" as const,
        };

  const response = await openai.responses.create({
    model: env.openAiExtractionModel,
    input: [
      {
        role: "user",
        content: [
          filePayload,
          {
            type: "input_text",
            text: params.prompt,
          },
        ],
      },
    ],
    max_output_tokens: 6000,
  });

  return normalizeWhitespace(response.output_text);
}

async function extractImageTextLocally(buffer: Buffer) {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");

  try {
    const result = await worker.recognize(buffer);
    return normalizeWhitespace(result.data.text || "");
  } finally {
    await worker.terminate();
  }
}

export async function extractMaterialText(params: {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
}) {
  if (params.mimeType === "application/pdf") {
    const parser = new PDFParse({ data: params.buffer });
    const parsed = await parser.getText();
    await parser.destroy();
    const normalized = normalizeWhitespace(parsed.text || "");

    if (normalized.length >= 800 || !hasOpenAi) {
      return {
        text: normalized,
        pageCount: parsed.total,
        method: normalized.length >= 800 ? "pdf-parse" : "pdf-parse-empty",
      };
    }

    const repaired = await extractTextViaVision({
      buffer: params.buffer,
      fileName: params.fileName,
      mimeType: params.mimeType,
      prompt: buildPdfRepairPrompt(),
    });

    return {
      text: repaired,
      pageCount: parsed.total,
      method: "openai-pdf-vision",
    };
  }

  if (params.mimeType.startsWith("image/")) {
    const extracted = hasOpenAi
      ? await extractTextViaVision({
          buffer: params.buffer,
          fileName: params.fileName,
          mimeType: params.mimeType,
          prompt: buildImageExtractionPrompt(),
        })
      : await extractImageTextLocally(params.buffer);

    return {
      text: extracted,
      pageCount: 1,
      method: hasOpenAi ? "openai-image-vision" : "tesseract-image-ocr",
    };
  }

  return {
    text: normalizeWhitespace(params.buffer.toString("utf8")),
    pageCount: 1,
    method: "plain-text",
  };
}
