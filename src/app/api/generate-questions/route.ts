import { handleRouteError, ok, fail } from "@/lib/api";
import { parseJsonString } from "@/lib/json";
import { ensureQuestionBank } from "@/lib/questions";
import { generateQuestionSchema } from "@/lib/schemas";
import { rateLimit, getClientIP } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    // Apply rate limiting (20 requests per 15 minutes)
    const clientIP = getClientIP(new Headers(request.headers));
    const rateLimitResult = await rateLimit(clientIP, 'questionGeneration');

    if (!rateLimitResult.success) {
      return fail(
        'Too many question generation requests. Please try again later.',
        429,
        {
          'Retry-After': String(Math.ceil((rateLimitResult.reset - Date.now()) / 1000)),
          'X-RateLimit-Limit': String(rateLimitResult.limit),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': String(rateLimitResult.reset),
        }
      );
    }

    const payload = generateQuestionSchema.parse(await request.json());
    const result = await ensureQuestionBank(payload);
    return ok({
      topic: result.selection.topicName,
      subtopic: result.selection.subtopicName ?? null,
      questions: result.questions.map((question) => ({
        id: question.id,
        type: question.type,
        stem: question.stem,
        options: parseJsonString<string[] | null>(question.options, null),
        answer: question.answer,
        explanation: question.explanation,
        difficulty: question.difficulty,
        sourceSnippet: question.sourceSnippet,
      })),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
