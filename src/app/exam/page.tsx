import { ExamClient } from "@/components/exam/exam-client";
import { SiteFooter } from "@/components/site-footer";
import { getExamCourseCatalog } from "@/lib/course-catalog";

export const dynamic = "force-dynamic";

export default async function ExamPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string; topic?: string; subtopic?: string }>;
}) {
  const courses = await getExamCourseCatalog();
  const params = await searchParams;

  return (
    <div className="shell flex flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <ExamClient
          courses={courses}
          initialCourse={params.course}
          initialTopic={params.topic}
          initialSubtopic={params.subtopic}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
