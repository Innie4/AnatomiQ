import { SiteFooter } from "@/components/site-footer";
import { TopicExplorer } from "@/components/topics/topic-explorer";
import { getTopicTree } from "@/lib/topics";

export const dynamic = "force-dynamic";

export default async function TopicsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; course?: string }>;
}) {
  const { q, course } = await searchParams;
  const topics = await getTopicTree(q, course);

  return (
    <div className="shell flex flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <TopicExplorer topics={topics} search={q} activeCourse={course} />
      </main>
      <SiteFooter />
    </div>
  );
}
