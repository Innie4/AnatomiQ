import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TopicExplorer } from "@/components/topics/topic-explorer";
import { getTopicTree } from "@/lib/topics";

export const dynamic = "force-dynamic";

export default async function TopicsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const topics = await getTopicTree(q);

  return (
    <div className="shell flex flex-1 flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <TopicExplorer topics={topics} search={q} />
      </main>
      <SiteFooter />
    </div>
  );
}
