import { ResultsClient } from "@/components/results/results-client";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function ResultsPage() {
  return (
    <div className="shell flex flex-1 flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <ResultsClient />
      </main>
      <SiteFooter />
    </div>
  );
}
