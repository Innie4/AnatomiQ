"use client";

import Link from "next/link";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Database,
  Eye,
  EyeOff,
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

import { MaterialQuestionManager } from "@/components/upload/material-question-manager";

type UploadResult = {
  material: { id: string; title: string; status: string; storageUrl: string; topic: string; subtopic: string | null };
};

type ProcessResult = {
  result: { extractedCharacters: number; chunkCount: number; extractionMethod: string };
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
  statusDistribution: Array<{ label: string; value: number; status: string }>;
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
    questionCount: number;
    sourcePages: number | null;
    createdAt: string;
    extractionMethod: string | null;
  }>;
  topicCoverage: Array<{ id: string; name: string; slug: string; materialCount: number; questionCount: number; subtopicCount: number }>;
};

type AdminMaterialOption = {
  id: string;
  title: string;
  status: string;
  topicName: string;
  subtopicName: string | null;
  linkedQuestionCount: number;
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
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [title, setTitle] = useState("");
  const [courseName, setCourseName] = useState("Human Anatomy");
  const [topicName, setTopicName] = useState("");
  const [subtopicName, setSubtopicName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [materials, setMaterials] = useState<AdminMaterialOption[]>([]);
  const [details, setDetails] = useState<ProcessResult["result"] | null>(null);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [overviewLoading, setOverviewLoading] = useState(false);

  async function loadMaterials(search?: string) {
    const query = search?.trim() ? `?q=${encodeURIComponent(search.trim())}` : "";
    const response = await fetch(`/api/admin-materials${query}`, {
      headers: { "x-admin-upload-key": adminKey },
    });
    const payload = (await response.json()) as { materials?: AdminMaterialOption[]; error?: string };
    if (!response.ok) {
      throw new Error(payload.error || "Could not load material targets.");
    }
    setMaterials(payload.materials ?? []);
  }

  async function loadOverview() {
    if (!adminKey.trim()) {
      setMessage({ tone: "error", text: "Enter the admin upload key to unlock the dashboard." });
      return;
    }
    setOverviewLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin-overview", {
        headers: { "x-admin-upload-key": adminKey },
      });
      const payload = (await response.json()) as AdminOverview & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Could not load the admin dashboard.");
      }
      setOverview(payload);
      await loadMaterials();
    } catch (error) {
      setOverview(null);
      setMaterials([]);
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Could not load the admin dashboard." });
    } finally {
      setOverviewLoading(false);
    }
  }

  async function handleUpload() {
    if (!adminKey.trim()) {
      setMessage({ tone: "error", text: "Enter the admin upload key before uploading." });
      return;
    }
    if (!file) {
      setMessage({ tone: "error", text: "Select a file before uploading." });
      return;
    }
    if (!topicName.trim()) {
      setMessage({ tone: "error", text: "Enter a topic before uploading." });
      return;
    }
    setLoading(true);
    setMessage(null);
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
        headers: { "x-admin-upload-key": adminKey },
        body: formData,
      });
      const uploadPayload = (await uploadResponse.json()) as UploadResult & { error?: string };
      if (!uploadResponse.ok) {
        throw new Error(uploadPayload.error || "Upload failed.");
      }
      const processResponse = await fetch("/api/process-material", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-upload-key": adminKey },
        body: JSON.stringify({ materialId: uploadPayload.material.id }),
      });
      const processPayload = (await processResponse.json()) as ProcessResult & { error?: string };
      if (!processResponse.ok) {
        throw new Error(processPayload.error || "Processing failed.");
      }
      setMessage({ tone: "success", text: `${uploadPayload.material.title} uploaded and processed successfully.` });
      setDetails(processPayload.result);
      setFile(null);
      setTitle("");
      await loadOverview();
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Upload failed." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div suppressHydrationWarning className="space-y-8">
      <section className="glass-panel rounded-[2rem] border border-white/80 p-6 sm:p-8">
        <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">Faculty operations</p>
            <h1 className="display-title mt-2 text-4xl text-slate-950 sm:text-5xl">Material upload and processing dashboard</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Manage anatomy source files, grounded knowledge chunks, and faculty-authored question banks from one workspace.
            </p>
          </div>
          <div className="rounded-[1.75rem] border border-sky-100 bg-[linear-gradient(160deg,rgba(45,140,255,0.12),rgba(24,176,143,0.08))] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-700">Access gate</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">Unlock dashboard controls</h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-sky-700">
                <LockKeyhole className="h-6 w-6" />
              </div>
            </div>
            <label className="mt-5 block space-y-2">
              <span className="text-sm font-semibold text-slate-700">Admin upload key</span>
              <div className="relative">
                <input
                  type={showAdminKey ? "text" : "password"}
                  value={adminKey}
                  onChange={(event) => setAdminKey(event.target.value)}
                  className="w-full rounded-2xl border border-white/80 bg-white px-4 py-3 pr-12 outline-none"
                  placeholder="Enter ADMIN_UPLOAD_KEY"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminKey(!showAdminKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showAdminKey ? "Hide admin key" : "Show admin key"}
                >
                  {showAdminKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </label>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => void loadOverview()}
                disabled={overviewLoading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
              >
                {overviewLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                {overview ? "Refresh dashboard" : "Unlock dashboard"}
              </button>
              <Link href="/topics" className="inline-flex items-center justify-center rounded-2xl border border-white/80 bg-white px-5 py-3 text-sm font-semibold text-slate-700">
                Review topic map
              </Link>
            </div>
            {message ? (
              <div className={`mt-4 flex items-start gap-3 rounded-2xl px-4 py-3 text-sm ${message.tone === "error" ? "border border-rose-100 bg-rose-50 text-rose-700" : "border border-emerald-100 bg-emerald-50 text-emerald-700"}`}>
                {message.tone === "error" ? <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />}
                <span>{message.text}</span>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {overview ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total materials", value: overview.summary.totalMaterials, helper: "Uploaded anatomy assets", icon: Database },
            { label: "Ready materials", value: overview.summary.readyMaterials, helper: "Processed sources", icon: CheckCircle2 },
            { label: "Knowledge chunks", value: overview.summary.totalChunks, helper: "Semantic sections", icon: Layers3 },
            { label: "Question bank", value: overview.summary.totalQuestions, helper: "Stored questions", icon: FileChartColumn },
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

      <section className="grid gap-6 xl:grid-cols-2">
        <section className="glass-panel rounded-[2rem] border border-white/80 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-700">Upload composer</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-950">Add new anatomy material</h2>
            </div>
            <UploadCloud className="h-8 w-8 text-sky-700" />
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <input value={title} onChange={(event) => setTitle(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none" placeholder="Title" />
            <input value={courseName} onChange={(event) => setCourseName(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none" placeholder="Course" />
            <input value={topicName} onChange={(event) => setTopicName(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none" placeholder="Topic" />
            <input value={subtopicName} onChange={(event) => setSubtopicName(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none" placeholder="Subtopic" />
            <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.txt" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="md:col-span-2 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-5 outline-none" />
          </div>
          <div className="mt-6 flex items-center gap-3">
            <button onClick={() => void handleUpload()} disabled={loading} className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#2d8cff,#18b08f)] px-6 py-4 text-sm font-semibold text-white disabled:opacity-70">
              {loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
              {loading ? "Uploading and processing..." : "Upload and process"}
            </button>
            <p className="text-sm text-slate-500">Files are stored, extracted, chunked, and indexed immediately.</p>
          </div>
          {details ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white/85 p-4"><p className="text-xs uppercase tracking-[0.16em] text-slate-500">Characters</p><p className="mt-2 text-2xl font-semibold text-slate-950">{details.extractedCharacters.toLocaleString()}</p></div>
              <div className="rounded-2xl border border-slate-200 bg-white/85 p-4"><p className="text-xs uppercase tracking-[0.16em] text-slate-500">Chunks</p><p className="mt-2 text-2xl font-semibold text-slate-950">{details.chunkCount}</p></div>
              <div className="rounded-2xl border border-slate-200 bg-white/85 p-4"><p className="text-xs uppercase tracking-[0.16em] text-slate-500">Method</p><p className="mt-2 text-lg font-semibold text-slate-950">{details.extractionMethod}</p></div>
            </div>
          ) : null}
        </section>
      </section>

      <MaterialQuestionManager
        adminKey={adminKey}
        materials={materials}
        onRefreshMaterials={loadMaterials}
        onRefreshOverview={loadOverview}
        overviewLoading={overviewLoading}
      />

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <section className="glass-panel rounded-[2rem] border border-white/80 p-6">
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
                    <div className={`rounded-full border px-3 py-1 text-sm font-semibold ${statusClasses(item.status)}`}>{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white/80 p-5 text-sm leading-6 text-slate-600">Unlock the dashboard to inspect processing states, recent uploads, and anatomy coverage.</div>
          )}
        </section>

        <section className="glass-panel rounded-[2rem] border border-white/80 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-700">Recent materials</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Latest upload activity</h2>
            </div>
            <button onClick={() => void loadOverview()} disabled={overviewLoading} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-70">
              {overviewLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </button>
          </div>
          <div className="mt-6 space-y-4">
            {overview?.recentMaterials.length ? overview.recentMaterials.map((material) => {
              const Icon = detectFileIcon(material.fileName);
              return (
                <div key={material.id} className="rounded-[1.5rem] border border-slate-200 bg-white/85 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700"><Icon className="h-6 w-6" /></div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-950">{material.title}</h3>
                        <p className="mt-1 text-sm text-slate-500">{material.course} · {material.topic}{material.subtopic ? ` / ${material.subtopic}` : ""}</p>
                        <p className="mt-2 text-sm text-slate-500">{material.fileName} · Uploaded {new Date(material.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${statusClasses(material.status)}`}>{material.status.toLowerCase().replace("_", " ")}</span>
                      <a href={material.storageUrl} target="_blank" rel="noreferrer" className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">Open file</a>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">{material.chunkCount} chunks indexed</div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">{material.questionCount} linked questions</div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">{material.sourcePages ?? 0} pages detected</div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">{material.extractionMethod ?? "Awaiting extraction details"}</div>
                  </div>
                </div>
              );
            }) : <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 text-sm text-slate-600">No uploaded anatomy material has been recorded yet.</div>}
          </div>
        </section>
      </section>

      {overview ? (
        <section className="glass-panel rounded-[2rem] border border-white/80 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-700">Topic coverage</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Where the source library is strongest</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {overview.topicCoverage.map((topic) => (
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
                <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                  <span>{topic.questionCount} questions</span>
                  <Link href={`/exam?topic=${topic.slug}`} className="font-semibold text-sky-700">
                    Open exam
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
