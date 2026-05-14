"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, Check, Loader2, Search } from "lucide-react";
import { useCourses } from "@/hooks/use-courses";

type CourseSelectorProps = {
  onCoursesChange?: (courses: string[]) => void;
  compact?: boolean;
};

const semesterLabels = {
  FIRST: "First semester",
  SECOND: "Second semester",
};

export function CourseSelector({ onCoursesChange, compact = false }: CourseSelectorProps) {
  const { courses, loading: coursesLoading } = useCourses();
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");

  const fetchUserCourses = useCallback(async () => {
    try {
      if (typeof window === "undefined") return;
      const token = localStorage.getItem("anatomiq:auth-token");
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch("/api/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedCourses(data.selectedCourses || data.user?.selectedCourses || []);
      }
    } catch (error) {
      console.error("Error fetching user courses:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveCourses = useCallback(async (courses: string[]) => {
    setSaving(true);
    try {
      if (typeof window === "undefined") return;
      const token = localStorage.getItem("anatomiq:auth-token");
      if (!token) {
        setSaving(false);
        return;
      }

      await fetch("/api/profile/courses", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ selectedCourses: courses }),
      });
    } catch (error) {
      console.error("Error saving courses:", error);
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchUserCourses();
  }, [fetchUserCourses]);

  const toggleCourse = async (courseSlug: string) => {
    const newSelection = selectedCourses.includes(courseSlug)
      ? selectedCourses.filter((slug) => slug !== courseSlug)
      : [...selectedCourses, courseSlug];

    setSelectedCourses(newSelection);
    await saveCourses(newSelection);
    onCoursesChange?.(newSelection);
  };

  const filteredCourses = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) {
      return courses;
    }

    return courses.filter((course) =>
      `${course.code} ${course.name} ${course.department} ${course.description ?? ""}`
        .toLowerCase()
        .includes(search),
    );
  }, [courses, query]);

  // Prevent hydration mismatch
  if (!mounted || loading || coursesLoading) {
    return (
      <div className="p-6 text-center">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
        <p className="text-sm text-slate-600 mt-2">Loading courses...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-slate-900">My Courses</h3>
        </div>
        {saving && (
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving...
          </span>
        )}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search courses by code, title, or department..."
          className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div className={compact ? "space-y-2" : "grid gap-4 md:grid-cols-2"}>
        {(["FIRST", "SECOND"] as const).map((semester) => {
          const semesterCourses = filteredCourses.filter((course) => course.semester === semester);
          if (!semesterCourses.length) {
            return null;
          }

          return (
            <div key={semester} className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {semesterLabels[semester]}
              </p>
              {semesterCourses.map((course) => (
                <label
                  key={course.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedCourses.includes(course.slug)
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={selectedCourses.includes(course.slug)}
                      onChange={() => toggleCourse(course.slug)}
                      className="peer sr-only"
                    />
                    <div
                      className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-all ${
                        selectedCourses.includes(course.slug)
                          ? "border-blue-600 bg-blue-600"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {selectedCourses.includes(course.slug) && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-slate-900 truncate">
                      {course.name}
                    </div>
                    <div className="text-xs text-slate-500">{course.code}</div>
                  </div>
                </label>
              ))}
            </div>
          );
        })}
      </div>

      {selectedCourses.length === 0 && (
        <p className="text-sm text-slate-500 text-center py-4">
          Select at least one course to get started
        </p>
      )}

      {filteredCourses.length === 0 && (
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm text-slate-500">
          No courses match that search.
        </p>
      )}
    </div>
  );
}
