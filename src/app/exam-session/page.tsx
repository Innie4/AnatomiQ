import { redirect } from "next/navigation";
import { ExamSessionClient } from "@/components/exam/exam-session-client";

export default function ExamSessionPage() {
  // This page is client-only, no server-side rendering needed
  return <ExamSessionClient />;
}
