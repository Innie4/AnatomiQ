"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, FileText, BookOpen, HelpCircle, Filter } from "lucide-react";
import { Suspense } from "react";

type SearchResults = {
  topics: Array<{
    id: string;
    name: string;
    slug: string;
    summary: string | null;
    course: {
      name: string;
      slug: string;
    };
  }>;
  materials: Array<{
    id: string;
    title: string;
    kind: string;
    course: {
      name: string;
      slug: string;
    };
    topic: {
      name: string;
      slug: string;
    };
  }>;
  questions: Array<{
    id: string;
    stem: string;
    type: string;
    course: {
      name: string;
      slug: string;
    };
    topic: {
      name: string;
      slug: string;
    };
  }>;
};

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [counts, setCounts] = useState({ topics: 0, materials: 0, questions: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "topics" | "materials" | "questions">("all");

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setError("Search query must be at least 2 characters");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/auth/signin");
        return;
      }

      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      setResults(data.results);
      setCounts(data.counts);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const getTotalResults = () => {
    return counts.topics + counts.materials + counts.questions;
  };

  const shouldShow = (type: string) => {
    return filter === "all" || filter === type;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 py-16 px-4">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <Search className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Search</h1>
          <p className="text-lg text-slate-600">
            Find topics, materials, and questions across all courses
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for topics, materials, or questions..."
              className="w-full pl-14 pr-4 py-4 rounded-2xl border-2 border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 rounded-xl bg-gradient-to-br from-[#0969da] to-[#0ca678] font-semibold text-white hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 mb-8">
            {error}
          </div>
        )}

        {results && (
          <>
            {/* Filter Tabs */}
            <div className="flex items-center gap-4 mb-6">
              <Filter className="h-5 w-5 text-slate-600" />
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                    filter === "all"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  All ({getTotalResults()})
                </button>
                <button
                  onClick={() => setFilter("topics")}
                  className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                    filter === "topics"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  Topics ({counts.topics})
                </button>
                <button
                  onClick={() => setFilter("materials")}
                  className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                    filter === "materials"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  Materials ({counts.materials})
                </button>
                <button
                  onClick={() => setFilter("questions")}
                  className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                    filter === "questions"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  Questions ({counts.questions})
                </button>
              </div>
            </div>

            {getTotalResults() === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-lg">
                <Search className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">No Results Found</h2>
                <p className="text-slate-600">
                  Try a different search term or adjust your filters
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Topics Section */}
                {shouldShow("topics") && results.topics.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <BookOpen className="h-6 w-6 text-blue-600" />
                      Topics
                    </h2>
                    <div className="space-y-3">
                      {results.topics.map((topic) => (
                        <div
                          key={topic.id}
                          className="bg-white rounded-xl border border-slate-200 p-4 shadow hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() =>
                            router.push(`/courses/${topic.course.slug}/topics/${topic.slug}`)
                          }
                        >
                          <h3 className="font-bold text-slate-900 mb-1">{topic.name}</h3>
                          {topic.summary && (
                            <p className="text-slate-600 text-sm mb-2">{topic.summary}</p>
                          )}
                          <p className="text-blue-600 text-sm font-medium">{topic.course.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Materials Section */}
                {shouldShow("materials") && results.materials.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <FileText className="h-6 w-6 text-green-600" />
                      Materials
                    </h2>
                    <div className="space-y-3">
                      {results.materials.map((material) => (
                        <div
                          key={material.id}
                          className="bg-white rounded-xl border border-slate-200 p-4 shadow hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-bold text-slate-900 mb-1">{material.title}</h3>
                              <p className="text-slate-600 text-sm">
                                {material.course.name} • {material.topic.name}
                              </p>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                              {material.kind}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Questions Section */}
                {shouldShow("questions") && results.questions.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <HelpCircle className="h-6 w-6 text-purple-600" />
                      Questions
                    </h2>
                    <div className="space-y-3">
                      {results.questions.map((question) => (
                        <div
                          key={question.id}
                          className="bg-white rounded-xl border border-slate-200 p-4 shadow hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-slate-900 flex-1">{question.stem}</p>
                            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium ml-3">
                              {question.type}
                            </span>
                          </div>
                          <p className="text-slate-600 text-sm">
                            {question.course.name} • {question.topic.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 flex items-center justify-center">
          <div className="text-center">
            <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Loading search...</p>
          </div>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
