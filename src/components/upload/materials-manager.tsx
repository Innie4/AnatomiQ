"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Edit3, FileText, LoaderCircle, Search, Trash2 } from "lucide-react";
import { toFriendlyError } from "@/lib/friendly-errors";

type AdminMaterialOption = {
  id: string;
  title: string;
  status: string;
  courseName: string;
  courseCode: string;
  courseSlug: string;
  department: string;
  topicName: string;
  subtopicName: string | null;
  linkedQuestionCount: number;
  createdAt: string;
};

type EditForm = {
  title: string;
  courseCode: string;
  courseName: string;
  department: string;
  topicName: string;
  subtopicName: string;
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

function emptyEditForm(): EditForm {
  return {
    title: "",
    courseCode: "",
    courseName: "",
    department: "Human Anatomy",
    topicName: "",
    subtopicName: "",
  };
}

export function MaterialsManager({ adminKey }: { adminKey: string }) {
  const [materials, setMaterials] = useState<AdminMaterialOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [busyAction, setBusyAction] = useState<"delete" | "edit" | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(emptyEditForm);

  const selectedMaterials = useMemo(
    () => materials.filter((material) => selectedIds.includes(material.id)),
    [materials, selectedIds],
  );
  const allSelected = materials.length > 0 && selectedIds.length === materials.length;
  const canEdit = selectedIds.length > 0 && editForm.courseCode && editForm.courseName && editForm.department && editForm.topicName;

  const loadMaterials = useCallback(async (query = "") => {
    setLoading(true);
    try {
      const url = query
        ? `/api/admin-materials?q=${encodeURIComponent(query)}`
        : "/api/admin-materials";

      const response = await fetch(url, {
        headers: { "x-admin-upload-key": adminKey },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("academiq:admin-key");
          sessionStorage.setItem("academiq:key-cleared", "true");
          window.location.reload();
          return;
        }
        throw new Error("Failed to load materials");
      }

      const data = await response.json();
      const nextMaterials = data.materials || [];
      setMaterials(nextMaterials);
      setSelectedIds((current) => current.filter((id) => nextMaterials.some((material: AdminMaterialOption) => material.id === id)));
    } catch (error) {
      setMessage({ tone: "error", text: toFriendlyError(error) });
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  function toggleSelection(material: AdminMaterialOption) {
    setSelectedIds((current) =>
      current.includes(material.id) ? current.filter((id) => id !== material.id) : [...current, material.id],
    );
  }

  function hydrateEditForm(material: AdminMaterialOption) {
    setEditForm({
      title: material.title,
      courseCode: material.courseCode,
      courseName: material.courseName,
      department: material.department,
      topicName: material.topicName,
      subtopicName: material.subtopicName ?? "",
    });
  }

  function handleSelectOnly(material: AdminMaterialOption) {
    setSelectedIds([material.id]);
    hydrateEditForm(material);
  }

  async function handleBulkDelete() {
    if (!selectedIds.length) {
      return;
    }

    const label = selectedIds.length === 1 ? selectedMaterials[0]?.title ?? "this material" : `${selectedIds.length} materials`;
    if (!confirm(`Delete ${label}? This removes linked questions and chunks too.`)) {
      return;
    }

    setBusyAction("delete");
    setMessage(null);

    try {
      const response = await fetch(`/api/delete-material`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-admin-upload-key": adminKey,
        },
        body: JSON.stringify({ materialIds: selectedIds }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete materials");
      }

      setMessage({ tone: "success", text: `${label} deleted successfully.` });
      setSelectedIds([]);
      await loadMaterials(searchQuery);
    } catch (error) {
      setMessage({ tone: "error", text: toFriendlyError(error) });
    } finally {
      setBusyAction(null);
    }
  }

  async function handleBulkEdit() {
    if (!canEdit) {
      setMessage({ tone: "error", text: "Select materials and fill course, department, and topic fields before applying edits." });
      return;
    }

    setBusyAction("edit");
    setMessage(null);

    try {
      const response = await fetch("/api/admin-materials", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-upload-key": adminKey,
        },
        body: JSON.stringify({
          materialIds: selectedIds,
          title: selectedIds.length === 1 ? editForm.title : undefined,
          courseCode: editForm.courseCode,
          courseName: editForm.courseName,
          department: editForm.department,
          topicName: editForm.topicName,
          subtopicName: editForm.subtopicName || null,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Failed to update materials");
      }

      setMessage({ tone: "success", text: `${payload.updatedCount} material${payload.updatedCount === 1 ? "" : "s"} updated.` });
      await loadMaterials(searchQuery);
    } catch (error) {
      setMessage({ tone: "error", text: toFriendlyError(error) });
    } finally {
      setBusyAction(null);
    }
  }

  useEffect(() => {
    if (adminKey) {
      void loadMaterials();
    }
  }, [adminKey, loadMaterials]);

  useEffect(() => {
    if (selectedMaterials.length === 1) {
      hydrateEditForm(selectedMaterials[0]);
    } else if (selectedMaterials.length > 1) {
      const first = selectedMaterials[0];
      setEditForm({
        title: "",
        courseCode: first?.courseCode ?? "",
        courseName: first?.courseName ?? "",
        department: first?.department ?? "Human Anatomy",
        topicName: first?.topicName ?? "",
        subtopicName: first?.subtopicName ?? "",
      });
    } else {
      setEditForm(emptyEditForm());
    }
  }, [selectedMaterials]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Manage Materials</h2>
        <p className="mt-1 text-sm text-slate-600">
          Select one or many materials, move them between course topics, or remove them in a batch.
        </p>
      </div>

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

      <div className="grid gap-4 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
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
                placeholder="Search materials by title, course, department, topic, or subtopic..."
                className="flex-1 bg-transparent outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() => setSelectedIds(allSelected ? [] : materials.map((material) => material.id))}
                className="h-4 w-4 rounded border-slate-300"
              />
              Select all visible
            </label>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>{selectedIds.length} selected</span>
              <button
                onClick={() => void handleBulkDelete()}
                disabled={!selectedIds.length || busyAction !== null}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-3 py-2 font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busyAction === "delete" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete selected
              </button>
            </div>
          </div>

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
                {materials.map((material) => {
                  const selected = selectedIds.includes(material.id);

                  return (
                    <div
                      key={material.id}
                      className={`flex items-start gap-4 p-5 transition-colors ${
                        selected ? "bg-sky-50/70" : "hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleSelection(material)}
                        className="mt-1 h-4 w-4 rounded border-slate-300"
                        aria-label={`Select ${material.title}`}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="font-semibold text-slate-900">{material.title}</h3>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(material.status)}`}>
                            {material.status}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                          <span>{material.department}</span>
                          <span>/</span>
                          <span>{material.courseCode} - {material.courseName}</span>
                          <span>/</span>
                          <span>{material.topicName}{material.subtopicName ? ` / ${material.subtopicName}` : ""}</span>
                          <span>/</span>
                          <span>{material.linkedQuestionCount} questions</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSelectOnly(material)}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                      >
                        <Edit3 className="h-4 w-4" />
                        Edit
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-24 xl:self-start">
          <div className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-sky-700" />
            <h3 className="font-semibold text-slate-950">Selection editor</h3>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Move selected materials into a department, course, topic, and optional subtopic. Title edits apply only when one material is selected.
          </p>

          <div className="mt-5 space-y-3">
            <input
              value={editForm.title}
              onChange={(event) => setEditForm((current) => ({ ...current, title: event.target.value }))}
              disabled={selectedIds.length !== 1}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none disabled:bg-slate-50 disabled:text-slate-400"
              placeholder="Material title"
              aria-label="Material title"
            />
            <input
              value={editForm.department}
              onChange={(event) => setEditForm((current) => ({ ...current, department: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
              placeholder="Department"
              aria-label="Department"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={editForm.courseCode}
                onChange={(event) => setEditForm((current) => ({ ...current, courseCode: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                placeholder="Course code"
                aria-label="Course code"
              />
              <input
                value={editForm.courseName}
                onChange={(event) => setEditForm((current) => ({ ...current, courseName: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                placeholder="Course name"
                aria-label="Course name"
              />
            </div>
            <input
              value={editForm.topicName}
              onChange={(event) => setEditForm((current) => ({ ...current, topicName: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
              placeholder="Topic"
              aria-label="Topic"
            />
            <input
              value={editForm.subtopicName}
              onChange={(event) => setEditForm((current) => ({ ...current, subtopicName: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
              placeholder="Subtopic"
              aria-label="Subtopic"
            />
            <button
              onClick={() => void handleBulkEdit()}
              disabled={!canEdit || busyAction !== null}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busyAction === "edit" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Apply to selected
            </button>
          </div>
        </aside>
      </div>

      {materials.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-600">
          Showing {materials.length} material{materials.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
