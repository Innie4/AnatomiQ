import { handleRouteError, ok } from "@/lib/api";
import { parseJsonString } from "@/lib/json";
import { ensureQuestionBank } from "@/lib/questions";
import { generateQuestionSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
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
