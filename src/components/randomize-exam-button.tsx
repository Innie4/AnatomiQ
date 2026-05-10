"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shuffle, LoaderCircle } from "lucide-react";

const types = ["MCQ", "SHORT_ANSWER", "THEORY", "MIXED"] as const;
const timerOptions = [0, 15, 30, 45, 60];

type Topic = {
  id: string;
  slug: string;
  name: string;
  courseSlug: string;
};

export function RandomizeExamButton({ className }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRandomizeExam() {
    setLoading(true);

    try {
      // Fetch all available topics from API
      const topicsResponse = await fetch("/api/topics");
      if (!topicsResponse.ok) {
        throw new Error("Failed to fetch topics");
      }

      const topicsData = await topicsResponse.json();
      const allTopics: Topic[] = [];

      // Flatten all topics and subtopics into a single array
      if (topicsData.topics && Array.isArray(topicsData.topics)) {
        topicsData.topics.forEach((topic: any) => {
          // Add main topic
          allTopics.push({
            id: topic.id,
            slug: topic.slug,
            name: topic.name,
            courseSlug: topic.courseSlug,
          });

          // Add subtopics if they exist
          if (topic.children && Array.isArray(topic.children)) {
            topic.children.forEach((subtopic: any) => {
              allTopics.push({
                id: subtopic.id,
                slug: subtopic.slug,
                name: subtopic.name,
                courseSlug: topic.courseSlug,
              });
            });
          }
        });
      }

      if (allTopics.length === 0) {
        throw new Error("No topics available");
      }

      // Generate random exam parameters from available options
      const randomTopic = allTopics[Math.floor(Math.random() * allTopics.length)];
      const randomType = types[Math.floor(Math.random() * types.length)];
      const randomCount = Math.floor(Math.random() * 13) + 8; // 8-20 questions
      const randomTimer = timerOptions[Math.floor(Math.random() * timerOptions.length)];

      // Call the start-exam API
      const response = await fetch("/api/start-exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseSlug: randomTopic.courseSlug,
          topicSlug: randomTopic.slug,
          type: randomType,
          count: randomCount,
          durationMinutes: randomTimer,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to start exam");
      }

      const examData = await response.json();

      // Store in sessionStorage
      sessionStorage.setItem("anatomiq:active-exam", JSON.stringify(examData));

      // Navigate to exam session
      router.push("/exam-session");
    } catch (error) {
      console.error("Failed to randomize exam:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to start random exam";
      alert(`${errorMessage}. Please try again.`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={() => void handleRandomizeExam()}
      disabled={loading}
      className={className}
    >
      {loading ? (
        <>
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Shuffle className="h-4 w-4" />
          Randomize Exam
        </>
      )}
    </button>
  );
}
