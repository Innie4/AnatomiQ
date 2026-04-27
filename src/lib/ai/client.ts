import OpenAI from "openai";

import { env, requireEnv } from "@/lib/env";

let client: OpenAI | null = null;

export function getOpenAiClient() {
  if (!client) {
    client = new OpenAI({
      apiKey: requireEnv(env.openAiApiKey, "OPENAI_API_KEY"),
    });
  }

  return client;
}
