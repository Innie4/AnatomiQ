import { getTopicCoverage } from "@/lib/topic-coverage";

export async function getTopicTree(search?: string, courseSlug?: string) {
  return getTopicCoverage(search, courseSlug);
}
