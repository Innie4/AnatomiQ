"use client";

import { useEffect, useEffectEvent, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  PencilLine,
  Plus,
  Save,
  Search,
  Trash2,
  Upload,
} from "lucide-react";

import { countManualQuestionBlocks } from "@/lib/manual-question-batch";

type MaterialOption = {
  id: string;
  title: string;
  status: string;
  topicName: string;
  subtopicName: string | null;
  linkedQuestionCount: number;
};

type ManualQuestionRecord = {
  id: string;
  materialId: string | null;
  manualOrder: number | null;
  type: "MCQ" | "SHORT_ANSWER" | "THEORY";
  stem: string;
  options: string[] | null;
  answer: string;
  explanation: string | null;
  difficulty: "FOUNDATIONAL" | "INTERMEDIATE" | "ADVANCED";
  updatedAt: string;
};

type EditableQuestion = {
  id?: string;
  manualOrder: number;
  type: "MCQ" | "SHORT_ANSWER" | "THEORY";
  stem: string;
  optionsText: string;
  answer: string;
  explanation: string;
};

const numberedTemplate = `Questions
1. Which chamber forms the apex of the heart?
2. State the nerve supply of the diaphragm.

Options
1. Right ventricle | Left ventricle | Right atrium | Left atrium

Answers
1. B
2. The phrenic nerve supplies the diaphragm.

Explanations
1. The apex of the heart is formed by the left ventricle.
2. The phrenic nerve is the principal motor supply of the diaphragm.`;

function buildEmptyQuestion(nextOrder: number): EditableQuestion {
  return {
    manualOrder: nextOrder,
    type: "MCQ",
    stem: "",
    optionsText: "",
    answer: "",
    explanation: "",
  };
}

function toEditableQuestion(question: ManualQuestionRecord): EditableQuestion {
  return {
    id: question.id,
    manualOrder: question.manualOrder ?? 1,
    type: question.type,
    stem: question.stem,
    optionsText: (question.options ?? []).join("\n"),
    answer: question.answer,
    explanation: question.explanation ?? "",
  };
}

function toPayload(question: EditableQuestion) {
  return {
    manualOrder: question.manualOrder,
    type: question.type,
    stem: question.stem,
    answer: question.answer,
    explanation: question.explanation,
    difficulty: "INTERMEDIATE" as const,
    options:
      question.type === "MCQ"
        ? question.optionsText
            .split("\n")
            .map((option) => option.trim())
            .filter(Boolean)
        : undefined,
  };
}

export function MaterialQuestionManager({
  adminKey,
  materials,
  onRefreshMaterials,
  onRefreshOverview,
  overviewLoading,
}: {
  adminKey: string;
  materials: MaterialOption[];
  onRefreshMaterials: (search?: string) => Promise<void>;
  onRefreshOverview: () => Promise<void>;
  overviewLoading: boolean;
}) {
  const [materialSearch, setMaterialSearch] = useState("");
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [bulkType, setBulkType] = useState<"MCQ" | "SHORT_ANSWER" | "THEORY">("MCQ");
  const [bulkInput, setBulkInput] = useState("");
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [viewType, setViewType] = useState<"MCQ" | "SHORT_ANSWER" | "THEORY">("MCQ");
  const [questions, setQuestions] = useState<EditableQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [draftQuestion, setDraftQuestion] = useState<EditableQuestion>(buildEmptyQuestion(1));
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [savingQuestionId, setSavingQuestionId] = useState<string | null>(null);
  const [questionMessage, setQuestionMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  const activeMaterialId = selectedMaterialId || materials[0]?.id || "";
  const selectedMaterial = materials.find((material) => material.id === activeMaterialId) ?? null;
  const estimatedBlocks = bulkInput.trim() ? countManualQuestionBlocks(bulkInput) : 0;

  const syncQuestions = useEffectEvent(async () => {
    if (!activeMaterialId || !adminKey.trim()) {
      return;
    }

    await loadQuestions(activeMaterialId, viewType);
  });

  useEffect(() => {
    void syncQuestions();
  }, [activeMaterialId, adminKey, viewType]);

  useEffect(() => {
    // Update draft question type when viewType changes
    setDraftQuestion((prev) => ({
      ...prev,
      type: viewType,
      optionsText: viewType === "MCQ" ? prev.optionsText : "",
    }));
  }, [viewType]);

  async function loadQuestions(materialId = activeMaterialId, type = viewType) {
    if (!materialId || !adminKey.trim()) {
      return;
    }

    setLoadingQuestions(true);
    setQuestionMessage(null);

    try {
      const response = await fetch(`/api/material-questions?materialId=${encodeURIComponent(materialId)}&type=${encodeURIComponent(type)}`, {
        headers: {
          "x-admin-upload-key": adminKey,
        },
      });
      const payload = (await response.json()) as { questions?: ManualQuestionRecord[]; error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Could not load linked manual questions.");
      }

      const mapped = (payload.questions ?? []).map(toEditableQuestion);
      setQuestions(mapped);
      setCurrentQuestionIndex(0);
      setDraftQuestion(buildEmptyQuestion(Math.max(1, ...mapped.map((question) => question.manualOrder + 1), 1)));
    } catch (error) {
      setQuestionMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "Could not load linked manual questions.",
      });
    } finally {
      setLoadingQuestions(false);
    }
  }

  async function refreshEverything(search?: string) {
    await onRefreshMaterials(search);
    await onRefreshOverview();
    await loadQuestions();
  }

  async function handleBulkUpload() {
    if (!adminKey.trim()) {
      setBulkMessage({ tone: "error", text: "Enter the admin upload key before uploading question banks." });
      return;
    }

    if (!activeMaterialId) {
      setBulkMessage({ tone: "error", text: "Select a material before uploading a question bank." });
      return;
    }

    if (!bulkInput.trim() && !bulkFile) {
      setBulkMessage({ tone: "error", text: "Paste numbered content or choose a PDF/text file." });
      return;
    }

    setBulkLoading(true);
    setBulkMessage(null);

    try {
      let response: Response;

      if (bulkFile) {
        const formData = new FormData();
        formData.append("materialId", activeMaterialId);
        formData.append("type", bulkType);
        formData.append("defaultDifficulty", "INTERMEDIATE");
        if (bulkInput.trim()) {
          formData.append("input", bulkInput);
        }
        formData.append("file", bulkFile);

        response = await fetch("/api/upload-manual-questions", {
          method: "POST",
          headers: { "x-admin-upload-key": adminKey },
          body: formData,
        });
      } else {
        response = await fetch("/api/upload-manual-questions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-upload-key": adminKey,
          },
          body: JSON.stringify({
            materialId: activeMaterialId,
            type: bulkType,
            defaultDifficulty: "INTERMEDIATE",
            input: bulkInput,
          }),
        });
      }

      const payload = (await response.json()) as {
        createdCount: number;
        updatedCount: number;
        skippedCount: number;
        totalSubmitted: number;
        extractionMethod?: string | null;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Bulk upload failed.");
      }

      setBulkInput("");
      setBulkFile(null);
      setBulkMessage({
        tone: "success",
        text: `${payload.createdCount} created, ${payload.updatedCount} updated, ${payload.skippedCount} skipped out of ${payload.totalSubmitted}.${
          payload.extractionMethod ? ` Parsed via ${payload.extractionMethod}.` : ""
        }`,
      });
      await refreshEverything(materialSearch);
    } catch (error) {
      setBulkMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "Bulk upload failed.",
      });
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleCreateQuestion() {
    if (!activeMaterialId) {
      setQuestionMessage({ tone: "error", text: "Choose a material before adding questions." });
      return;
    }

    setSavingQuestionId("new");
    setQuestionMessage(null);

    try {
      const response = await fetch("/api/material-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-upload-key": adminKey,
        },
        body: JSON.stringify({
          materialId: activeMaterialId,
          ...toPayload(draftQuestion),
        }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Could not create the question.");
      }

      setQuestionMessage({ tone: "success", text: "Question added successfully." });
      await refreshEverything(materialSearch);
    } catch (error) {
      setQuestionMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "Could not create the question.",
      });
    } finally {
      setSavingQuestionId(null);
    }
  }

  async function handleSaveQuestion(question: EditableQuestion) {
    if (!question.id) {
      return;
    }

    setSavingQuestionId(question.id);
    setQuestionMessage(null);

    try {
      const response = await fetch(`/api/material-questions/${question.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-upload-key": adminKey,
        },
        body: JSON.stringify(toPayload(question)),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Could not save the question.");
      }

      setQuestionMessage({ tone: "success", text: `Question ${question.manualOrder} saved successfully.` });
      await refreshEverything(materialSearch);
    } catch (error) {
      setQuestionMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "Could not save the question.",
      });
    } finally {
      setSavingQuestionId(null);
    }
  }

  async function handleDeleteQuestion(questionId: string, manualOrder: number) {
    setSavingQuestionId(questionId);
    setQuestionMessage(null);

    try {
      const response = await fetch(`/api/material-questions/${questionId}`, {
        method: "DELETE",
        headers: {
          "x-admin-upload-key": adminKey,
        },
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Could not remove the question.");
      }

      setQuestionMessage({ tone: "success", text: `Question ${manualOrder} removed.` });
      await refreshEverything(materialSearch);
    } catch (error) {
      setQuestionMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "Could not remove the question.",
      });
    } finally {
      setSavingQuestionId(null);
    }
  }

  function renderQuestionEditor(
    question: EditableQuestion,
    onChange: (next: EditableQuestion) => void,
    isNew = false,
  ) {
    // Get all existing question numbers
    const existingNumbers = new Set(questions.map((q) => q.manualOrder));

    // If editing an existing question, include its current number
    if (!isNew && question.id) {
      const currentQuestion = questions.find((q) => q.id === question.id);
      if (currentQuestion) {
        existingNumbers.delete(currentQuestion.manualOrder);
      }
    }

    // Generate available numbers (1 to max + 10 to allow gaps)
    const maxNumber = Math.max(0, ...questions.map((q) => q.manualOrder));
    const availableNumbers = Array.from({ length: maxNumber + 10 }, (_, i) => i + 1).filter(
      (num) => !existingNumbers.has(num)
    );

    return (
      <div className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Question number</span>
            <select
              value={question.manualOrder}
              onChange={(event) => onChange({ ...question, manualOrder: Number(event.target.value) })}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
            >
              {availableNumbers.map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Type</span>
            <select
              value={question.type}
              onChange={(event) =>
                onChange({
                  ...question,
                  type: event.target.value as EditableQuestion["type"],
                  optionsText:
                    event.target.value === "MCQ" ? question.optionsText : "",
                })
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
            >
              <option value="MCQ">MCQ</option>
              <option value="SHORT_ANSWER">Subjective</option>
              <option value="THEORY">Theory</option>
            </select>
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Question</span>
          <textarea
            value={question.stem}
            onChange={(event) => onChange({ ...question, stem: event.target.value })}
            rows={3}
            className="w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 outline-none"
          />
        </label>

        {question.type === "MCQ" ? (
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Options</span>
            <textarea
              value={question.optionsText}
              onChange={(event) => onChange({ ...question, optionsText: event.target.value })}
              rows={4}
              className="w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 outline-none"
              placeholder={"Option A\nOption B\nOption C\nOption D"}
            />
          </label>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Answer</span>
            <textarea
              value={question.answer}
              onChange={(event) => onChange({ ...question, answer: event.target.value })}
              rows={3}
              className="w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 outline-none"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Explanation</span>
            <textarea
              value={question.explanation}
              onChange={(event) => onChange({ ...question, explanation: event.target.value })}
              rows={3}
              className="w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 outline-none"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          {isNew ? (
            <button
              onClick={() => void handleCreateQuestion()}
              disabled={savingQuestionId === "new"}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-[#0969da] to-[#0ca678] px-5 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {savingQuestionId === "new" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add question
            </button>
          ) : (
            <>
              <button
                onClick={() => question.id && void handleDeleteQuestion(question.id, question.manualOrder)}
                disabled={savingQuestionId === question.id}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#ef4444] text-white px-5 py-3 text-sm font-semibold shadow-lg hover:shadow-xl hover:bg-[#dc2626] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </button>
              <button
                onClick={() => void handleSaveQuestion(question)}
                disabled={savingQuestionId === question.id}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-[#0969da] to-[#0ca678] px-5 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {savingQuestionId === question.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save changes
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="glass-panel rounded-[2rem] border border-white/80 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-700">Bulk authoring</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-950">Upload numbered questions, answers, and explanations</h2>
          </div>
          <Upload className="h-8 w-8 text-sky-700" />
        </div>

        <div className="mt-8 grid gap-4">
          <div className="flex gap-3">
            <input
              value={materialSearch}
              onChange={(event) => setMaterialSearch(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
              placeholder="Search materials by title or topic"
            />
            <button
              onClick={() => void onRefreshMaterials(materialSearch)}
              disabled={!adminKey.trim() || overviewLoading}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 disabled:opacity-70"
            >
              <Search className="h-4 w-4" />
              Search
            </button>
          </div>

          <select
              value={activeMaterialId}
              onChange={(event) => setSelectedMaterialId(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
          >
            <option value="">Select a material</option>
            {materials.map((material) => (
              <option key={material.id} value={material.id}>
                {material.title} - {material.topicName}
                {material.subtopicName ? ` / ${material.subtopicName}` : ""}
              </option>
            ))}
          </select>

          <div>
            <select
              value={bulkType}
              onChange={(event) => setBulkType(event.target.value as typeof bulkType)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
            >
              <option value="MCQ">MCQ</option>
              <option value="SHORT_ANSWER">Subjective</option>
              <option value="THEORY">Theory</option>
            </select>
          </div>

          <textarea
            value={bulkInput}
            onChange={(event) => setBulkInput(event.target.value)}
            className="min-h-[260px] rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 font-mono text-sm outline-none"
            placeholder={numberedTemplate}
          />

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Or upload numbered text/PDF</span>
            <input
              type="file"
              accept=".txt,.pdf,text/plain,application/pdf"
              onChange={(event) => setBulkFile(event.target.files?.[0] ?? null)}
              className="w-full rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-5 outline-none"
            />
          </label>

          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4 text-sm leading-6 text-slate-600">
            Numbered bulk uploads must keep matching numbers across <span className="font-mono">Questions</span>,
            <span className="font-mono"> Answers</span>, and <span className="font-mono">Explanations</span>. MCQ
            uploads also require numbered <span className="font-mono">Options</span>.
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-3 text-sm text-slate-500">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2">
                {estimatedBlocks} question{estimatedBlocks === 1 ? "" : "s"} detected
              </span>
              {selectedMaterial ? (
                <span className="rounded-full border border-slate-200 bg-white px-3 py-2">
                  {selectedMaterial.linkedQuestionCount} linked question{selectedMaterial.linkedQuestionCount === 1 ? "" : "s"}
                </span>
              ) : null}
            </div>
            <button
              onClick={() => void handleBulkUpload()}
              disabled={bulkLoading}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-[#0969da] to-[#0ca678] px-5 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {bulkLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {bulkLoading ? "Uploading..." : "Upload numbered bank"}
            </button>
          </div>

          {bulkMessage ? (
            <div
              className={`flex items-start gap-3 rounded-2xl px-4 py-3 text-sm ${
                bulkMessage.tone === "error"
                  ? "border border-rose-100 bg-rose-50 text-rose-700"
                  : "border border-emerald-100 bg-emerald-50 text-emerald-700"
              }`}
            >
              {bulkMessage.tone === "error" ? (
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              )}
              <span>{bulkMessage.text}</span>
            </div>
          ) : null}
        </div>
      </section>

      <section className="glass-panel rounded-[2rem] border border-white/80 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-700">Question manager</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-950">Add, edit, and remove linked questions</h2>
          </div>
          <PencilLine className="h-8 w-8 text-sky-700" />
        </div>

        {selectedMaterial ? (
          <p className="mt-3 text-sm text-slate-500">
            Managing questions for <span className="font-semibold text-slate-900">{selectedMaterial.title}</span>
          </p>
        ) : (
          <p className="mt-3 text-sm text-slate-500">Select a material to begin managing manual questions.</p>
        )}

        <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white/85 p-5">
          <h3 className="text-lg font-semibold text-slate-950">Add one question</h3>
          <div className="mt-4">{renderQuestionEditor(draftQuestion, setDraftQuestion, true)}</div>
        </div>

        {questionMessage ? (
          <div
            className={`mt-4 flex items-start gap-3 rounded-2xl px-4 py-3 text-sm ${
              questionMessage.tone === "error"
                ? "border border-rose-100 bg-rose-50 text-rose-700"
                : "border border-emerald-100 bg-emerald-50 text-emerald-700"
            }`}
          >
            {questionMessage.tone === "error" ? (
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            )}
            <span>{questionMessage.text}</span>
          </div>
        ) : null}

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-700">Question type:</span>
              <select
                value={viewType}
                onChange={(event) => setViewType(event.target.value as typeof viewType)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
              >
                <option value="MCQ">MCQ</option>
                <option value="SHORT_ANSWER">Subjective</option>
                <option value="THEORY">Theory</option>
              </select>
            </div>
            <div className="text-sm text-slate-500">
              {questions.length} question{questions.length === 1 ? "" : "s"}
            </div>
          </div>

          {loadingQuestions ? (
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-4 text-sm text-slate-600">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Loading linked questions...
            </div>
          ) : questions.length ? (
            <>
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex flex-wrap gap-2">
                  {questions.map((question, index) => (
                    <button
                      key={question.id}
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={`flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-semibold transition-colors ${
                        index === currentQuestionIndex
                          ? "border-sky-600 bg-sky-600 text-white"
                          : "border-slate-300 bg-white text-slate-700 hover:border-sky-400 hover:bg-sky-50"
                      }`}
                    >
                      {question.manualOrder}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-white/85 p-5">
                {renderQuestionEditor(
                  questions[currentQuestionIndex],
                  (next) =>
                    setQuestions((current) =>
                      current.map((item) => (item.id === questions[currentQuestionIndex].id ? next : item)),
                    ),
                )}
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <span className="text-sm text-slate-600">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <button
                  onClick={() => setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  disabled={currentQuestionIndex === questions.length - 1}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 text-sm text-slate-600">
              No {viewType === "MCQ" ? "MCQ" : viewType === "SHORT_ANSWER" ? "Subjective" : "Theory"} questions have been linked to this material yet.
            </div>
          )}
        </div>
      </section>
    </section>
  );
}
