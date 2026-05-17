"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shuffle, LoaderCircle } from "lucide-react";

const types = ["MCQ", "SHORT_ANSWER", "THEORY", "MIXED"] as const;
const timerOptions = [0, 15, 30, 45, 60];

type TopicOption = {
  id: string;
  slug: string;
  name: string;
  courseSlug: string;
  isSubtopic: boolean;
};

type ChildTopic = {
  id: string;
  slug: string;
  name: string;
};

type TopicData = {
  id: string;
  slug: string;
  name: string;
  childTopics?: ChildTopic[];
};

type StartExamPayload = {
  topicSlug: string;
  subtopicSlug?: string;
  type: (typeof types)[number];
  count: number;
  durationMinutes?: number;
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
      const allTopics: TopicOption[] = [];

      // Flatten all topics and subtopics into a single array
      if (topicsData.topics && Array.isArray(topicsData.topics)) {
        (topicsData.topics as TopicData[]).forEach((topic) => {
          // Add main topic (topic slug IS the courseSlug)
          allTopics.push({
            id: topic.id,
            slug: topic.slug,
            name: topic.name,
            courseSlug: topic.slug,
            isSubtopic: false,
          });

          // Add subtopics if they exist (childTopics, not children)
          if (topic.childTopics && Array.isArray(topic.childTopics)) {
            topic.childTopics.forEach((subtopic) => {
              allTopics.push({
                id: subtopic.id,
                slug: subtopic.slug,
                name: subtopic.name,
                courseSlug: topic.slug, // Parent topic's slug is the courseSlug
                isSubtopic: true,
              });
            });
          }
        });
      }

      if (allTopics.length === 0) {
        throw new Error("No topics available");
      }

      // Filter topics that have processed material by checking available question types
      const topicsWithMaterial: TopicOption[] = [];

      for (const topic of allTopics) {
        try {
          const params = new URLSearchParams({ topicSlug: topic.courseSlug });
          if (topic.isSubtopic) {
            params.set("subtopicSlug", topic.slug);
          }

          const availabilityResponse = await fetch(`/api/topic-question-types?${params}`);
          if (availabilityResponse.ok) {
            const data = await availabilityResponse.json();
            // Only include topics that have at least one available question type
            if (data.availableTypes && data.availableTypes.length > 0) {
              topicsWithMaterial.push(topic);
            }
          }
        } catch {
          // Skip topics that error out
          continue;
        }
      }

      if (topicsWithMaterial.length === 0) {
        throw new Error("No topics with processed material available. Please upload and process course material first.");
      }

      // Generate random exam parameters from topics with material only
      const randomTopic = topicsWithMaterial[Math.floor(Math.random() * topicsWithMaterial.length)];
      const randomType = types[Math.floor(Math.random() * types.length)];
      const randomCount = Math.floor(Math.random() * 13) + 8; // 8-20 questions
      const randomTimer = timerOptions[Math.floor(Math.random() * timerOptions.length)];

      // Build payload based on whether it's a subtopic or main topic
      const payload: StartExamPayload = {
        topicSlug: randomTopic.courseSlug, // Always use the parent topic slug
        type: randomType,
        count: randomCount,
      };

      // Add subtopicSlug only if this is a subtopic
      if (randomTopic.isSubtopic) {
        payload.subtopicSlug = randomTopic.slug;
      }

      // Only add durationMinutes if it's greater than 0
      if (randomTimer > 0) {
        payload.durationMinutes = randomTimer;
      }

      console.log("Randomize exam payload:", JSON.stringify(payload, null, 2));
      console.log("Random topic selected:", randomTopic);

      const response = await fetch("/api/start-exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error Response:", errorData);
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
