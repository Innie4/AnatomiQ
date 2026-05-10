"use client";

import { useEffect, useState } from "react";
import { Database, CheckCircle2, Layers3, FileChartColumn, RefreshCw, LoaderCircle, AlertCircle } from "lucide-react";

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
    course: string;
    topic: string;
    subtopic: string | null;
    questionCount: number;
    createdAt: string;
  }>;
};

export function OverviewStats({ adminKey }: { adminKey: string }) {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadOverview() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin-overview", {
        headers: { "x-admin-upload-key": adminKey },
      });

      if (!response.ok) {
        throw new Error("Failed to load overview");
      }

      const data = await response.json();
      setOverview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load overview");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (adminKey) {
      void loadOverview();
    }
  }, [adminKey]);

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-rose-700">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (loading && !overview) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-12">
        <LoaderCircle className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!overview) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Dashboard Overview</h2>
          <p className="mt-1 text-sm text-slate-600">System statistics and recent activity</p>
        </div>
        <button
          onClick={() => void loadOverview()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition-all hover:border-[#0969da] hover:bg-[#f0f6ff] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total Materials",
            value: overview.summary.totalMaterials,
            helper: "Uploaded anatomy assets",
            icon: Database,
            color: "text-blue-600",
          },
          {
            label: "Ready Materials",
            value: overview.summary.readyMaterials,
            helper: "Processed sources",
            icon: CheckCircle2,
            color: "text-emerald-600",
          },
          {
            label: "Knowledge Chunks",
            value: overview.summary.totalChunks,
            helper: "Semantic sections",
            icon: Layers3,
            color: "text-purple-600",
          },
          {
            label: "Question Bank",
            value: overview.summary.totalQuestions,
            helper: "Stored questions",
            icon: FileChartColumn,
            color: "text-amber-600",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {item.label}
              </p>
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </div>
            <p className="mt-4 text-4xl font-bold text-slate-900">
              {item.value.toLocaleString()}
            </p>
            <p className="mt-2 text-sm text-slate-600">{item.helper}</p>
          </div>
        ))}
      </div>

      {/* Recent Materials */}
      {overview.recentMaterials.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Recent Materials</h3>
          <div className="mt-4 space-y-3">
            {overview.recentMaterials.slice(0, 5).map((material) => (
              <div
                key={material.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4"
              >
                <div>
                  <p className="font-medium text-slate-900">{material.title}</p>
                  <p className="text-sm text-slate-600">
                    {material.topic}
                    {material.subtopic && ` / ${material.subtopic}`}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      material.status === "READY"
                        ? "bg-emerald-100 text-emerald-700"
                        : material.status === "PROCESSING"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {material.status}
                  </span>
                  <span className="text-sm text-slate-600">
                    {material.questionCount} questions
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
