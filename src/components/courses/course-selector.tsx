"use client";

import { useState, useEffect } from "react";
import { BookOpen, Check, Loader2 } from "lucide-react";
import { useCourses } from "@/hooks/use-courses";

type CourseSelectorProps = {
  onCoursesChange?: (courses: string[]) => void;
};

export function CourseSelector({ onCoursesChange }: CourseSelectorProps) {
  const { courses, loading: coursesLoading } = useCourses();
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUserCourses();
  }, []);

  const fetchUserCourses = async () => {
    try {
      const token = localStorage.getItem("anatomiq:auth-token");
      if (!token) return;

      const response = await fetch("/api/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedCourses(data.user.selectedCourses || []);
      }
    } catch (error) {
      console.error("Error fetching user courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCourse = async (courseSlug: string) => {
    const newSelection = selectedCourses.includes(courseSlug)
      ? selectedCourses.filter((slug) => slug !== courseSlug)
      : [...selectedCourses, courseSlug];

    setSelectedCourses(newSelection);
    await saveCourses(newSelection);
    onCoursesChange?.(newSelection);
  };

  const saveCourses = async (courses: string[]) => {
    setSaving(true);
    try {
      const token = localStorage.getItem("anatomiq:auth-token");
      if (!token) return;

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
  };

  if (loading || coursesLoading) {
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

      <div className="space-y-2">
        {courses.map((course) => (
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

      {selectedCourses.length === 0 && (
        <p className="text-sm text-slate-500 text-center py-4">
          Select at least one course to get started
        </p>
      )}
    </div>
  );
}
