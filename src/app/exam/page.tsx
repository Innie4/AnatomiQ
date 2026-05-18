import { ExamClient } from "@/components/exam/exam-client";
import { SiteFooter } from "@/components/site-footer";
import { getTopicTree } from "@/lib/topics";
import { db } from "@/lib/db";
import { hasDatabase } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function ExamPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string; topic?: string; subtopic?: string }>;
}) {
  const topics = await getTopicTree();
  const params = await searchParams;

  // Fetch available courses
  let courses: Array<{ id: string; code: string; name: string; slug: string }> = [];
  if (hasDatabase) {
    try {
      courses = await db.course.findMany({
        where: {
          Material: {
            some: {},
          },
        },
        select: {
          id: true,
          code: true,
          name: true,
          slug: true,
        },
        orderBy: { code: "asc" },
      });
    } catch {
      courses = [];
    }
  } else {
    courses = [];
  }

  return (
    <div className="shell flex flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <ExamClient
          courses={courses}
          topics={topics.map((topic) => ({
            id: topic.id,
            name: topic.name,
            slug: topic.slug,
            childTopics: topic.childTopics,
          }))}
          initialCourse={params.course}
          initialTopic={params.topic}
          initialSubtopic={params.subtopic}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
