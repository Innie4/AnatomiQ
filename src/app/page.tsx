import { HomeDashboard } from "@/components/home/home-dashboard";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublicAnalytics } from "@/lib/analytics";
import { getTopicTree } from "@/lib/topics";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [topics, analytics] = await Promise.all([getTopicTree(), getPublicAnalytics()]);

  return (
    <div className="shell flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1">
        <HomeDashboard topics={topics} analytics={analytics} />
      </main>
      <SiteFooter />
    </div>
  );
}
