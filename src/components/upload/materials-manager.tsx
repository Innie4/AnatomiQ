"use client";

import { useEffect, useState } from "react";
import { Search, Trash2, LoaderCircle, AlertCircle, CheckCircle2, FileText } from "lucide-react";
import { toFriendlyError } from "@/lib/friendly-errors";

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
      return "bg-emerald-100 text-emerald-700";
    case "PROCESSING":
      return "bg-amber-100 text-amber-700";
    case "FAILED":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export function MaterialsManager({ adminKey }: { adminKey: string }) {
  const [materials, setMaterials] = useState<AdminMaterialOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadMaterials(query = "") {
    setLoading(true);
    try {
      const url = query
        ? `/api/admin-materials?q=${encodeURIComponent(query)}`
        : "/api/admin-materials";

      const response = await fetch(url, {
        headers: { "x-admin-upload-key": adminKey },
      });

      if (!response.ok) {
        throw new Error("Failed to load materials");
      }

      const data = await response.json();
      setMaterials(data.materials || []);
    } catch (error) {
      setMessage({ tone: "error", text: toFriendlyError(error) });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(materialId: string, title: string) {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(materialId);
    setMessage(null);

    try {
      const response = await fetch(`/api/delete-material`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-admin-upload-key": adminKey,
        },
        body: JSON.stringify({ materialId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete material");
      }

      setMessage({ tone: "success", text: `"${title}" deleted successfully.` });
      await loadMaterials(searchQuery);
    } catch (error) {
      setMessage({ tone: "error", text: toFriendlyError(error) });
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    if (adminKey) {
      void loadMaterials();
    }
  }, [adminKey]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Manage Materials</h2>
        <p className="mt-1 text-sm text-slate-600">
          View, search, and delete uploaded materials
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

      {/* Search */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              void loadMaterials(e.target.value);
            }}
            placeholder="Search materials by title, topic, or subtopic..."
            className="flex-1 bg-transparent outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Materials List */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <LoaderCircle className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : materials.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-4 text-slate-600">
              {searchQuery ? "No materials found matching your search." : "No materials uploaded yet."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {materials.map((material) => (
              <div
                key={material.id}
                className="flex items-center justify-between p-6 transition-colors hover:bg-slate-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-slate-900">{material.title}</h3>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(
                        material.status
                      )}`}
                    >
                      {material.status}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-sm text-slate-600">
                    <span>
                      {material.topicName}
                      {material.subtopicName && ` / ${material.subtopicName}`}
                    </span>
                    <span>•</span>
                    <span>{material.linkedQuestionCount} questions</span>
                  </div>
                </div>

                <button
                  onClick={() => void handleDelete(material.id, material.title)}
                  disabled={deletingId === material.id}
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition-all hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deletingId === material.id ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      {materials.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-600">
          Showing {materials.length} material{materials.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
