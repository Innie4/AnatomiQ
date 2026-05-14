"use client";

import { useEffect, useState } from "react";
import { AlertCircle, BookOpen, CheckCircle2, LoaderCircle, Plus } from "lucide-react";

type AdminCourse = {
  id: string;
  code: string;
  name: string;
  slug: string;
  semester: "FIRST" | "SECOND";
  department: string;
  description: string | null;
  _count?: {
    Topic: number;
    Material: number;
    Question: number;
  };
};

const semesterLabel = {
  FIRST: "First semester",
  SECOND: "Second semester",
};

export function CourseManager({ adminKey }: { adminKey: string }) {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [form, setForm] = useState({
    code: "",
    name: "",
    semester: "FIRST" as "FIRST" | "SECOND",
    department: "Human Anatomy",
    description: "",
  });

  async function loadCourses() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/courses", {
        headers: { "x-admin-upload-key": adminKey },
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Failed to load courses.");
      }

      setCourses(payload.courses || []);
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Failed to load courses." });
    } finally {
      setLoading(false);
    }
  }

  async function saveCourse(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-upload-key": adminKey,
        },
        body: JSON.stringify(form),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Failed to save course.");
      }

      setMessage({ tone: "success", text: `${payload.course.code} saved.` });
      setForm({
        code: "",
        name: "",
        semester: "FIRST",
        department: "Human Anatomy",
        description: "",
      });
      await loadCourses();
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Failed to save course." });
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (adminKey) {
      void loadCourses();
    }
  }, [adminKey]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">Academic setup</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">Courses</h1>
        <p className="mt-2 text-sm text-slate-600">Add courses with their course code and semester before students select them.</p>
      </div>

      {message ? (
        <div className={`flex items-start gap-3 rounded-2xl px-4 py-3 text-sm ${message.tone === "error" ? "border border-rose-100 bg-rose-50 text-rose-700" : "border border-emerald-100 bg-emerald-50 text-emerald-700"}`}>
          {message.tone === "error" ? <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />}
          <span>{message.text}</span>
        </div>
      ) : null}

      <form onSubmit={saveCourse} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Course code</span>
            <input
              value={form.code}
              onChange={(event) => setForm((value) => ({ ...value, code: event.target.value.toUpperCase() }))}
              className="w-full rounded-xl border border-slate-200 px-4 py-3"
              placeholder="ANA201"
              required
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Course name</span>
            <input
              value={form.name}
              onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-4 py-3"
              placeholder="Gross Anatomy"
              required
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Semester</span>
            <select
              value={form.semester}
              onChange={(event) => setForm((value) => ({ ...value, semester: event.target.value as "FIRST" | "SECOND" }))}
              className="w-full rounded-xl border border-slate-200 px-4 py-3"
            >
              <option value="FIRST">First semester</option>
              <option value="SECOND">Second semester</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Department</span>
            <input
              value={form.department}
              onChange={(event) => setForm((value) => ({ ...value, department: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-4 py-3"
              required
            />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-semibold text-slate-700">Description</span>
            <textarea
              value={form.description}
              onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))}
              className="min-h-24 w-full rounded-xl border border-slate-200 px-4 py-3"
              placeholder="Optional course note for the catalog"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0969da] to-[#0ca678] px-5 py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-60"
        >
          {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Save course
        </button>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <LoaderCircle className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {courses.map((course) => (
              <div key={course.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-950">{course.code} - {course.name}</div>
                    <div className="text-sm text-slate-500">{semesterLabel[course.semester]} / {course.department}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                  <span className="rounded-full bg-slate-100 px-3 py-1">{course._count?.Topic ?? 0} topics</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">{course._count?.Material ?? 0} materials</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">{course._count?.Question ?? 0} questions</span>
                </div>
              </div>
            ))}
            {!courses.length ? <div className="p-8 text-center text-sm text-slate-600">No courses have been added yet.</div> : null}
          </div>
        )}
      </div>
    </div>
  );
}
