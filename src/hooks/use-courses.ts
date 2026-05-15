import { useState, useEffect } from "react";

type Course = {
  id: string;
  code: string;
  name: string;
  slug: string;
  semester: "FIRST" | "SECOND";
  department: string;
  description: string | null;
};

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchCourses = async () => {
      try {
        const response = await fetch("/api/courses");
        if (!response.ok) {
          throw new Error("Failed to fetch courses");
        }

        const data = await response.json();
        if (!cancelled) setCourses(data.courses);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load courses");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchCourses();
    return () => { cancelled = true; };
  }, []);

  return { courses, loading, error };
}
