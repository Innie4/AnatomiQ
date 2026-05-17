"use client";

import { useState } from "react";
import { UploadCloud, LoaderCircle, AlertCircle, CheckCircle2 } from "lucide-react";
import { toFriendlyError } from "@/lib/friendly-errors";

type UploadResult = {
  material: {
    id: string;
    title: string;
    status: string;
    storageUrl: string;
    topic: string;
    subtopic: string | null;
  };
};

type ProcessResult = {
  result: {
    extractedCharacters: number;
    chunkCount: number;
    extractionMethod: string;
  };
};

export function MaterialUploader({ adminKey, onSuccess }: { adminKey: string; onSuccess?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [courseCode, setCourseCode] = useState("GEN101");
  const [courseName, setCourseName] = useState("");
  const [topicName, setTopicName] = useState("");
  const [subtopicName, setSubtopicName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [details, setDetails] = useState<ProcessResult["result"] | null>(null);

  async function handleUpload() {
    if (!file || !title || !courseCode || !courseName || !topicName) {
      setMessage({ tone: "error", text: "Please fill in all required fields and select a file." });
      return;
    }

    setLoading(true);
    setMessage(null);
    setDetails(null);

    try {
      // Upload material
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      formData.append("courseCode", courseCode);
      formData.append("courseName", courseName);
      formData.append("topicName", topicName);
      if (subtopicName) {
        formData.append("subtopicName", subtopicName);
      }

      const uploadResponse = await fetch("/api/upload-material", {
        method: "POST",
        headers: { "x-admin-upload-key": adminKey },
        body: formData,
      });

      const uploadPayload = (await uploadResponse.json()) as UploadResult;

      if (!uploadResponse.ok) {
        throw new Error("Upload failed");
      }

      // Process material
      const processResponse = await fetch("/api/process-material", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-upload-key": adminKey,
        },
        body: JSON.stringify({ materialId: uploadPayload.material.id }),
      });

      const processPayload = (await processResponse.json()) as ProcessResult;

      if (!processResponse.ok) {
        throw new Error("Processing failed");
      }

      setMessage({
        tone: "success",
        text: `${uploadPayload.material.title} uploaded and processed successfully.`,
      });
      setDetails(processPayload.result);

      // Reset form
      setFile(null);
      setTitle("");
      setTopicName("");
      setSubtopicName("");

      // Trigger parent refresh
      onSuccess?.();
    } catch (error) {
      setMessage({ tone: "error", text: toFriendlyError(error) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Upload New Material</h2>
        <p className="mt-1 text-sm text-slate-600">
          Add course materials that will be processed and indexed for exam generation
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`flex items-start gap-3 rounded-2xl px-4 py-3 text-sm ${
            message.tone === "error"
              ? "border border-rose-100 bg-rose-50 text-rose-700"
              : "border border-emerald-100 bg-emerald-50 text-emerald-700"
          }`}
        >
          {message.tone === "error" ? (
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Upload Form */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="material-title" className="mb-2 block text-sm font-medium text-slate-700">
                Title <span className="text-rose-500">*</span>
              </label>
              <input
                id="material-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition-colors focus:border-[#0969da] focus:ring-2 focus:ring-[#0969da]/20"
                placeholder="e.g., Biology Fundamentals"
              />
            </div>

            <div>
              <label htmlFor="course-code" className="mb-2 block text-sm font-medium text-slate-700">
                Course Code <span className="text-rose-500">*</span>
              </label>
              <input
                id="course-code"
                type="text"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition-colors focus:border-[#0969da] focus:ring-2 focus:ring-[#0969da]/20"
                placeholder="e.g., GEN101"
              />
            </div>

            <div>
              <label htmlFor="course-name" className="mb-2 block text-sm font-medium text-slate-700">
                Course Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="course-name"
                type="text"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition-colors focus:border-[#0969da] focus:ring-2 focus:ring-[#0969da]/20"
                placeholder="e.g., General Studies"
              />
            </div>

            <div>
              <label htmlFor="topic-name" className="mb-2 block text-sm font-medium text-slate-700">
                Topic <span className="text-rose-500">*</span>
              </label>
              <input
                id="topic-name"
                type="text"
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition-colors focus:border-[#0969da] focus:ring-2 focus:ring-[#0969da]/20"
                placeholder="e.g., Introductory Biology"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="subtopic-name" className="mb-2 block text-sm font-medium text-slate-700">
                Subtopic (Optional)
              </label>
              <input
                id="subtopic-name"
                type="text"
                value={subtopicName}
                onChange={(e) => setSubtopicName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition-colors focus:border-[#0969da] focus:ring-2 focus:ring-[#0969da]/20"
                placeholder="e.g., Cell Structure"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="material-file" className="mb-2 block text-sm font-medium text-slate-700">
                File <span className="text-rose-500">*</span>
              </label>
              <input
                id="material-file"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.txt"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full rounded-xl border-2 border-dashed border-slate-300 bg-white px-4 py-6 outline-none transition-colors hover:border-[#0969da] focus:border-[#0969da]"
              />
              <p className="mt-2 text-sm text-slate-500">
                Accepted formats: PDF, PNG, JPG, JPEG, WEBP, TXT
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button
              onClick={() => void handleUpload()}
              disabled={loading || !file || !title || !courseCode || !courseName || !topicName}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0969da] to-[#0ca678] px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none"
            >
              {loading ? (
                <LoaderCircle className="h-5 w-5 animate-spin" />
              ) : (
                <UploadCloud className="h-5 w-5" />
              )}
              {loading ? "Uploading and processing..." : "Upload and process"}
            </button>
            <p className="text-sm text-slate-600">
              Files are stored, extracted, chunked, and indexed immediately.
            </p>
          </div>
        </div>
      </div>

      {/* Processing Details */}
      {details && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
          <h3 className="text-lg font-semibold text-emerald-900">Processing Complete</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-sm text-emerald-700">Extraction Method</p>
              <p className="mt-1 text-lg font-semibold text-emerald-900">
                {details.extractionMethod}
              </p>
            </div>
            <div>
              <p className="text-sm text-emerald-700">Characters Extracted</p>
              <p className="mt-1 text-lg font-semibold text-emerald-900">
                {details.extractedCharacters.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-emerald-700">Knowledge Chunks</p>
              <p className="mt-1 text-lg font-semibold text-emerald-900">
                {details.chunkCount}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
