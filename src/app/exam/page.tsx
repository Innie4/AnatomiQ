import { ExamClient } from "@/components/exam/exam-client";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getTopicTree } from "@/lib/topics";

export const dynamic = "force-dynamic";

export default async function ExamPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; subtopic?: string }>;
}) {
  const topics = await getTopicTree();
  const params = await searchParams;

  return (
    <div className="shell flex flex-1 flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <ExamClient
          topics={topics.map((topic) => ({
            id: topic.id,
            name: topic.name,
            slug: topic.slug,
            childTopics: topic.childTopics,
          }))}
          initialTopic={params.topic}
          initialSubtopic={params.subtopic}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
