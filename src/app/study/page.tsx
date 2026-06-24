"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Shuffle,
  CheckCircle,
  XCircle,
  Brain,
} from "lucide-react";

type Flashcard = {
  id: string;
  question: string;
  answer: string;
  explanation?: string | null;
  topic: string;
  course?: string;
  difficulty: string;
};

export default function StudyModePage() {
  const router = useRouter();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [masteredCards, setMasteredCards] = useState<Set<string>>(new Set());
  const [difficultCards, setDifficultCards] = useState<Set<string>>(new Set());

  const loadFlashcards = useCallback(async () => {
    try {
      const token = localStorage.getItem("academiq:auth-token");
      if (!token) {
        router.push("/signin");
        return;
      }

      const response = await fetch("/api/flashcards", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to load flashcards");
      }

      const data = await response.json();
      setFlashcards(data.flashcards || []);
    } catch (err) {
      console.error("Failed to load flashcards:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadFlashcards();
  }, [loadFlashcards]);

  const handleFlip = () => {
    setFlipped(!flipped);
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setFlipped(false);
    }
  };

  const handleShuffle = () => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setFlashcards(shuffled);
    setCurrentIndex(0);
    setFlipped(false);
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setFlipped(false);
    setMasteredCards(new Set());
    setDifficultCards(new Set());
  };

  const markMastered = () => {
    const card = flashcards[currentIndex];
    if (!card) return;

    setMasteredCards((prev) => new Set(prev).add(card.id));
    setDifficultCards((prev) => {
      const next = new Set(prev);
      next.delete(card.id);
      return next;
    });
    handleNext();
  };

  const markDifficult = () => {
    const card = flashcards[currentIndex];
    if (!card) return;

    setDifficultCards((prev) => new Set(prev).add(card.id));
    setMasteredCards((prev) => {
      const next = new Set(prev);
      next.delete(card.id);
      return next;
    });
    handleNext();
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "FOUNDATIONAL":
        return "bg-green-100 text-green-700";
      case "INTERMEDIATE":
        return "bg-blue-100 text-blue-700";
      case "ADVANCED":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading study materials...</p>
        </div>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];
  const progress = ((currentIndex + 1) / flashcards.length) * 100;

  if (!currentCard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 px-4 py-16">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow">
          <Brain className="mx-auto mb-4 h-12 w-12 text-blue-600" />
          <h1 className="text-3xl font-bold text-slate-900">No flashcards yet</h1>
          <p className="mt-3 text-slate-600">Upload and process material, or generate exam questions, to build your study deck.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 py-16 px-4">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <Brain className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Study Mode</h1>
          <p className="text-lg text-slate-600">Master concepts with interactive flashcards</p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow">
            <BookOpen className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-900">{flashcards.length}</p>
            <p className="text-sm text-slate-600">Total Cards</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow">
            <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{masteredCards.size}</p>
            <p className="text-sm text-slate-600">Mastered</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow">
            <XCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-600">{difficultCards.size}</p>
            <p className="text-sm text-slate-600">Difficult</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700">
              Card {currentIndex + 1} of {flashcards.length}
            </span>
            <span className="text-sm text-slate-600">{progress.toFixed(0)}% Complete</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-green-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Flashcard */}
        {currentCard && (
          <div
            className="relative h-96 mb-6 cursor-pointer perspective-1000"
            onClick={handleFlip}
          >
            <div
              className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
                flipped ? "rotate-y-180" : ""
              }`}
            >
              {/* Front */}
              <div className="absolute inset-0 bg-white rounded-2xl border-2 border-slate-200 shadow-xl backface-hidden p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(
                        currentCard.difficulty
                      )}`}
                    >
                      {currentCard.difficulty}
                    </span>
                    <span className="text-sm text-slate-600">{currentCard.course || currentCard.topic}</span>
                  </div>
                  <div className="flex items-center justify-center h-full min-h-[200px]">
                    <p className="text-2xl font-bold text-slate-900 text-center">
                      {currentCard.question}
                    </p>
                  </div>
                </div>
                <p className="text-center text-slate-500 text-sm">Click to reveal answer</p>
              </div>

              {/* Back */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-green-600 rounded-2xl border-2 border-blue-600 shadow-xl backface-hidden rotate-y-180 p-8 flex flex-col justify-between text-white">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-medium">
                      {currentCard.difficulty}
                    </span>
                    <span className="text-sm opacity-90">{currentCard.topic}</span>
                  </div>
                  <div className="flex items-center justify-center h-full min-h-[200px]">
                    <p className="text-lg leading-relaxed whitespace-pre-line">
                      {currentCard.answer}
                    </p>
                    {currentCard.explanation ? (
                      <p className="mt-4 text-sm leading-6 text-white/80">{currentCard.explanation}</p>
                    ) : null}
                  </div>
                </div>
                <p className="text-center opacity-90 text-sm">Click to see question</p>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="px-6 py-3 rounded-xl border-2 border-slate-300 font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ChevronLeft className="h-5 w-5" />
            Previous
          </button>

          <div className="flex gap-3">
            <button
              onClick={markDifficult}
              className="px-4 py-3 rounded-xl bg-red-100 text-red-700 font-semibold hover:bg-red-200 transition-colors flex items-center gap-2"
            >
              <XCircle className="h-5 w-5" />
              Difficult
            </button>
            <button
              onClick={markMastered}
              className="px-4 py-3 rounded-xl bg-green-100 text-green-700 font-semibold hover:bg-green-200 transition-colors flex items-center gap-2"
            >
              <CheckCircle className="h-5 w-5" />
              Mastered
            </button>
          </div>

          <button
            onClick={handleNext}
            disabled={currentIndex === flashcards.length - 1}
            className="px-6 py-3 rounded-xl bg-gradient-to-br from-[#0969da] to-[#0ca678] font-semibold text-white hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
          >
            Next
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleShuffle}
            className="px-6 py-3 rounded-xl border-2 border-slate-300 font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <Shuffle className="h-5 w-5" />
            Shuffle
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-3 rounded-xl border-2 border-slate-300 font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <RotateCcw className="h-5 w-5" />
            Reset Progress
          </button>
        </div>
      </div>

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}
