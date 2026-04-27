import { getTopicCoverage } from "@/lib/topic-coverage";

export async function getTopicTree(search?: string) {
  return getTopicCoverage(search);
}
