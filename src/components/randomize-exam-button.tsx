"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shuffle, LoaderCircle } from "lucide-react";

const topics = [
  "cardiovascular-system",
  "respiratory-system",
  "nervous-system",
  "skeletal-system",
  "muscular-system",
  "digestive-system",
  "urinary-system",
  "reproductive-system",
];

const types = ["MCQ", "SHORT_ANSWER", "THEORY", "MIXED"] as const;
const timerOptions = [0, 15, 30, 45, 60];

export function RandomizeExamButton({ className }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRandomizeExam() {
    setLoading(true);

    try {
      // Generate random exam parameters
      const randomTopic = topics[Math.floor(Math.random() * topics.length)];
      const randomType = types[Math.floor(Math.random() * types.length)];
      const randomCount = Math.floor(Math.random() * 13) + 8; // 8-20 questions
      const randomTimer = timerOptions[Math.floor(Math.random() * timerOptions.length)];

      // Call the start-exam API
      const response = await fetch("/api/start-exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseSlug: "human-anatomy",
          topicSlug: randomTopic,
          type: randomType,
          count: randomCount,
          durationMinutes: randomTimer,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start exam");
      }

      const examData = await response.json();

      // Store in sessionStorage
      sessionStorage.setItem("anatomiq:active-exam", JSON.stringify(examData));

      // Navigate to exam session
      router.push("/exam-session");
    } catch (error) {
      console.error("Failed to randomize exam:", error);
      alert("Failed to start random exam. Please try again.");
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
