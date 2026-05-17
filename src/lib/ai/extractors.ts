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
    // Polyfill missing browser APIs that pdfjs-dist (via pdf-parse) might expect in serverless environments
    if (typeof global.DOMMatrix === "undefined") {
      console.log("[extractors] Polyfilling DOMMatrix for pdf-parse");
      (global as any).DOMMatrix = class DOMMatrix {
        a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
      };
    }
    if (typeof global.ImageData === "undefined") {
      console.log("[extractors] Polyfilling ImageData for pdf-parse");
      (global as any).ImageData = class ImageData {
        width: number;
        height: number;
        data: Uint8ClampedArray;
        constructor(width: number, height: number) {
          this.width = width;
          this.height = height;
          this.data = new Uint8ClampedArray(width * height * 4);
        }
      };
    }
    if (typeof global.Path2D === "undefined") {
      console.log("[extractors] Polyfilling Path2D for pdf-parse");
      (global as any).Path2D = class Path2D {};
    }

    // Lazy import to avoid loading pdf-parse in serverless environments where it's not needed
    console.log("[extractors] Dynamically importing pdf-parse for PDF extraction");
    const { PDFParse } = await import("pdf-parse");

    console.log("[extractors] Parsing PDF buffer");
    const parser = new PDFParse({ data: params.buffer });
    const parsed = await parser.getText();
    await parser.destroy();
    const normalized = normalizeWhitespace(parsed.text || "");

    console.log(`[extractors] PDF parsed: ${normalized.length} chars, ${parsed.total} pages`);

    if (normalized.length >= 800 || !hasOpenAi) {
      return {
        text: normalized,
        pageCount: parsed.total,
        method: normalized.length >= 800 ? "pdf-parse" : "pdf-parse-empty",
      };
    }

    console.log("[extractors] PDF text too short, using OpenAI vision for repair");
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
    console.log(`[extractors] Extracting text from image using ${hasOpenAi ? "OpenAI vision" : "Tesseract OCR"}`);
    const extracted = hasOpenAi
      ? await extractTextViaVision({
          buffer: params.buffer,
          fileName: params.fileName,
          mimeType: params.mimeType,
          prompt: buildImageExtractionPrompt(),
        })
      : await extractImageTextLocally(params.buffer);

    console.log(`[extractors] Image text extracted: ${extracted.length} chars`);
    return {
      text: extracted,
      pageCount: 1,
      method: hasOpenAi ? "openai-image-vision" : "tesseract-image-ocr",
    };
  }

  console.log("[extractors] Treating as plain text");
  return {
    text: normalizeWhitespace(params.buffer.toString("utf8")),
    pageCount: 1,
    method: "plain-text",
  };
}
