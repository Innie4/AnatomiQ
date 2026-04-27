"use client";

import Link from "next/link";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Database,
  FileChartColumn,
  FileImage,
  FileText,
  Layers3,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import { useState } from "react";

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

type AdminOverview = {
  summary: {
    totalMaterials: number;
    readyMaterials: number;
    processingMaterials: number;
    failedMaterials: number;
    totalChunks: number;
    totalQuestions: number;
    totalConcepts: number;
  };
  statusDistribution: Array<{
    label: string;
    value: number;
    status: string;
  }>;
  recentMaterials: Array<{
    id: string;
    title: string;
    fileName: string;
    status: string;
    storageUrl: string;
    course: string;
    topic: string;
    subtopic: string | null;
    chunkCount: number;
    sourcePages: number | null;
    createdAt: string;
    updatedAt: string;
    extractionMethod: string | null;
  }>;
  topicCoverage: Array<{
    id: string;
    name: string;
    slug: string;
    materialCount: number;
    questionCount: number;
    subtopicCount: number;
  }>;
};

function statusClasses(status: string) {
  switch (status) {
    case "READY":
      return "border-emerald-100 bg-emerald-50 text-emerald-700";
    case "PROCESSING":
      return "border-amber-100 bg-amber-50 text-amber-700";
    case "FAILED":
      return "border-rose-100 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function formatStatus(status: string) {
  return status.toLowerCase().replace("_", " ");
}

function detectFileIcon(fileName: string) {
  const lower = fileName.toLowerCase();

  if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".webp")) {
    return FileImage;
  }

  if (lower.endsWith(".pdf")) {
    return FileText;
  }

  return FileChartColumn;
}

export function UploadConsole() {
  const [adminKey, setAdminKey] = useState("");
  const [title, setTitle] = useState("");
  const [courseName, setCourseName] = useState("Human Anatomy");
  const [topicName, setTopicName] = useState("");
  const [subtopicName, setSubtopicName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [details, setDetails] = useState<ProcessResult["result"] | null>(null);
  const [overview, setOverview] = useState<AdminOverview | null>(null);

  async function loadOverview() {
    if (!adminKey.trim()) {
      setError("Enter the admin upload key to unlock the dashboard.");
      return;
    }

    setOverviewLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin-overview", {
        method: "GET",
        headers: {
          "x-admin-upload-key": adminKey,
        },
      });
      const payload = (await response.json()) as AdminOverview & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Could not load the admin dashboard.");
      }

      setOverview(payload);
    } catch (requestError) {
      setOverview(null);
      setError(requestError instanceof Error ? requestError.message : "Could not load the admin dashboard.");
    } finally {
      setOverviewLoading(false);
    }
  }

  async function handleUpload() {
    if (!file) {
      setError("Select a file before uploading.");
      return;
    }

    if (!topicName.trim()) {
      setError("Enter a topic before uploading.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setDetails(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title || file.name);
      formData.append("courseName", courseName);
      formData.append("topicName", topicName);
      formData.append("subtopicName", subtopicName);

      const uploadResponse = await fetch("/api/upload-material", {
        method: "POST",
        headers: {
          "x-admin-upload-key": adminKey,
        },
        body: formData,
      });
      const uploadPayload = (await uploadResponse.json()) as UploadResult & { error?: string };

      if (!uploadResponse.ok) {
        throw new Error(uploadPayload.error || "Upload failed.");
      }

      const processResponse = await fetch("/api/process-material", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-upload-key": adminKey,
        },
        body: JSON.stringify({
          materialId: uploadPayload.material.id,
        }),
      });
      const processPayload = (await processResponse.json()) as ProcessResult & { error?: string };

      if (!processResponse.ok) {
        throw new Error(processPayload.error || "Processing failed.");
      }

      setSuccess(`${uploadPayload.material.title} uploaded and processed successfully.`);
      setDetails(processPayload.result);
      setFile(null);
      setTitle("");

      if (adminKey.trim()) {
        await loadOverview();
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Upload failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div suppressHydrationWarning className="space-y-8">
      <section className="glass-panel rounded-[2rem] border border-white/80 p-6 shadow-[0_20px_70px_rgba(31,78,126,0.1)] sm:p-8">
        <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">Faculty operations</p>
            <h1 className="display-title mt-2 text-4xl text-slate-950 sm:text-5xl">Material upload and processing dashboard</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Manage anatomy source files, process them into grounded knowledge chunks, and monitor question-bank readiness
              from a single workspace.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {[
                "PDF textbooks",
                "Lecture notes",
                "Anatomy diagrams",
                "Chunked knowledge graph",
              ].map((item) => (
                <span key={item} className="rounded-full border border-slate-200 bg-white/85 px-4 py-2 text-sm text-slate-600">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-sky-100 bg-[linear-gradient(160deg,rgba(45,140,255,0.12),rgba(24,176,143,0.08))] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-700">Access gate</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">Unlock dashboard controls</h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-sky-700 shadow-sm">
                <LockKeyhole className="h-6 w-6" />
              </div>
            </div>

            <label className="mt-5 block space-y-2">
              <span className="text-sm font-semibold text-slate-700">Admin upload key</span>
              <input
                type="password"
                value={adminKey}
                onChange={(event) => setAdminKey(event.target.value)}
                className="w-full rounded-2xl border border-white/80 bg-white px-4 py-3 outline-none"
                placeholder="Enter ADMIN_UPLOAD_KEY"
              />
            </label>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => void loadOverview()}
                disabled={overviewLoading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {overviewLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                {overview ? "Refresh dashboard" : "Unlock dashboard"}
              </button>
              <Link
                href="/topics"
                className="inline-flex items-center justify-center rounded-2xl border border-white/80 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:-translate-y-0.5"
              >
                Review topic map
              </Link>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-600">
              Upload access stays environment-protected. No faculty account system is exposed in the interface.
            </p>
          </div>
        </div>
      </section>

      {overview ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total materials",
              value: overview.summary.totalMaterials,
              helper: "All uploaded anatomy assets",
              icon: Database,
            },
            {
              label: "Ready materials",
              value: overview.summary.readyMaterials,
              helper: "Fully processed sources",
              icon: CheckCircle2,
            },
            {
              label: "Knowledge chunks",
              value: overview.summary.totalChunks,
              helper: "Semantic source sections",
              icon: Layers3,
            },
            {
              label: "Question bank",
              value: overview.summary.totalQuestions,
              helper: "Stored grounded questions",
              icon: FileChartColumn,
            },
          ].map((item) => (
            <div key={item.label} className="glass-panel rounded-[1.5rem] border border-white/80 p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
                <item.icon className="h-5 w-5 text-sky-700" />
              </div>
              <p className="mt-4 text-4xl font-semibold text-slate-950">{item.value.toLocaleString()}</p>
              <p className="mt-2 text-sm text-slate-500">{item.helper}</p>
            </div>
          ))}
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="glass-panel rounded-[2rem] border border-white/80 p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-700">Upload composer</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-950">Add new anatomy material</h2>
            </div>
            <UploadCloud className="h-8 w-8 text-sky-700" />
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Title</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
                placeholder="Gross Anatomy Lecture 4"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Course</span>
              <input
                value={courseName}
                onChange={(event) => setCourseName(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Topic</span>
              <input
                value={topicName}
                onChange={(event) => setTopicName(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
                placeholder="Thorax"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Subtopic</span>
              <input
                value={subtopicName}
                onChange={(event) => setSubtopicName(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
                placeholder="Mediastinum"
              />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">Material file</span>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.txt"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="w-full rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-5 outline-none"
              />
            </label>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              onClick={() => void handleUpload()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#2d8cff,#18b08f)] px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-cyan-200/60 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
              {loading ? "Uploading and processing..." : "Upload and process"}
            </button>
            <p className="text-sm text-slate-500">Files are pushed to storage, extracted, chunked, and indexed immediately.</p>
          </div>

          {error ? (
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          {success ? (
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <span>{success}</span>
            </div>
          ) : null}
        </section>

        <section className="space-y-6">
          <div className="glass-panel rounded-[2rem] border border-white/80 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-700">Pipeline health</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">Processing visibility</h2>
              </div>
              <Activity className="h-7 w-7 text-sky-700" />
            </div>

            {overview ? (
              <div className="mt-6 grid gap-3">
                {overview.statusDistribution.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-200 bg-white/85 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                        <p className="mt-1 text-sm text-slate-500">Current material state</p>
                      </div>
                      <div className={`rounded-full border px-3 py-1 text-sm font-semibold ${statusClasses(item.status)}`}>
                        {item.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-white/80 p-5 text-sm leading-6 text-slate-600">
                Unlock the dashboard to inspect processing states, recent uploads, and anatomy coverage.
              </div>
            )}
          </div>

          {details ? (
            <div className="glass-panel rounded-[2rem] border border-white/80 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-700">Latest processing result</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white/85 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Characters</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">
                    {details.extractedCharacters.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/85 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Chunks</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">{details.chunkCount}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/85 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Method</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">{details.extractionMethod}</p>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </section>

      {overview ? (
        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="glass-panel rounded-[2rem] border border-white/80 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-700">Recent materials</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">Latest upload activity</h2>
              </div>
              <button
                onClick={() => void loadOverview()}
                disabled={overviewLoading}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {overviewLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Refresh
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {overview.recentMaterials.length ? (
                overview.recentMaterials.map((material) => {
                  const Icon = detectFileIcon(material.fileName);

                  return (
                    <div key={material.id} className="rounded-[1.5rem] border border-slate-200 bg-white/85 p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                            <Icon className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-slate-950">{material.title}</h3>
                            <p className="mt-1 text-sm text-slate-500">
                              {material.course} · {material.topic}
                              {material.subtopic ? ` / ${material.subtopic}` : ""}
                            </p>
                            <p className="mt-2 text-sm text-slate-500">
                              {material.fileName} · Uploaded {new Date(material.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${statusClasses(material.status)}`}>
                            {formatStatus(material.status)}
                          </span>
                          <a
                            href={material.storageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 hover:border-sky-200 hover:text-sky-700"
                          >
                            Open file
                          </a>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                          {material.chunkCount} chunks indexed
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                          {material.sourcePages ?? 0} pages detected
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                          {material.extractionMethod ?? "Awaiting extraction details"}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 text-sm text-slate-600">
                  No uploaded anatomy material has been recorded yet.
                </div>
              )}
            </div>
          </section>

          <section className="glass-panel rounded-[2rem] border border-white/80 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-700">Topic coverage</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Where your source library is strongest</h2>

            <div className="mt-6 space-y-4">
              {overview.topicCoverage.length ? (
                overview.topicCoverage.map((topic) => (
                  <div key={topic.id} className="rounded-[1.5rem] border border-slate-200 bg-white/85 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-950">{topic.name}</h3>
                        <p className="mt-1 text-sm text-slate-500">{topic.subtopicCount} mapped subtopics</p>
                      </div>
                      <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
                        {topic.materialCount} materials
                      </span>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                        {topic.questionCount} generated questions
                      </div>
                      <Link
                        href={`/exam?topic=${topic.slug}`}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:border-sky-200 hover:text-sky-700"
                      >
                        Open exam mode
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 text-sm text-slate-600">
                  Topic coverage will appear here after the first upload is processed.
                </div>
              )}
            </div>
          </section>
        </section>
      ) : null}
    </div>
  );
}
