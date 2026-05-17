"use client";

import { useState } from "react";
import { MessageCircle, X, Bug, Lightbulb, Send } from "lucide-react";

const WHATSAPP_NUMBER = "+2348066023759";

type FeedbackType = "problem" | "suggestion";

export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType | null>(null);
  const [message, setMessage] = useState("");
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = () => {
    if (!feedbackType || !message.trim()) return;

    const typeLabel = feedbackType === "problem" ? "Problem/Bug" : "Suggestion";
    const fullMessage = `*${typeLabel}*\n\n${message.trim()}`;
    const encodedMessage = encodeURIComponent(fullMessage);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER.replace("+", "")}?text=${encodedMessage}`;

    window.open(whatsappUrl, "_blank");
    setIsSent(true);

    setTimeout(() => {
      setIsOpen(false);
      setFeedbackType(null);
      setMessage("");
      setIsSent(false);
    }, 2000);
  };

  const handleClose = () => {
    setIsOpen(false);
    setFeedbackType(null);
    setMessage("");
    setIsSent(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 lg:bottom-10 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#0969da] to-[#0ca678] text-white shadow-lg transition-all hover:scale-110 hover:shadow-xl active:scale-95"
        aria-label="Open feedback form"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-24 lg:bottom-10 right-6 z-50 w-80 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">Send Feedback</h3>
        <button
          onClick={handleClose}
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Close feedback"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {isSent ? (
        <div className="flex flex-col items-center py-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Send className="h-6 w-6 text-green-600" />
          </div>
          <p className="mt-3 text-sm font-medium text-slate-700">Opening WhatsApp...</p>
        </div>
      ) : (
        <>
          <p className="mb-3 text-sm text-slate-500">What type of feedback is this?</p>
          <div className="mb-4 flex gap-3">
            <button
              onClick={() => setFeedbackType("problem")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                feedbackType === "problem"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Bug className="h-4 w-4" />
              Problem/Bug
            </button>
            <button
              onClick={() => setFeedbackType("suggestion")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                feedbackType === "suggestion"
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Lightbulb className="h-4 w-4" />
              Suggestion
            </button>
          </div>

          {feedbackType && (
            <div className="space-y-3">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  feedbackType === "problem"
                    ? "Describe the problem or bug you encountered..."
                    : "Share your suggestion or idea..."
                }
                className="w-full resize-none rounded-xl border border-slate-200 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0969da] focus:outline-none focus:ring-2 focus:ring-[rgba(9,105,218,0.1)]"
                rows={4}
              />
              <button
                onClick={handleSubmit}
                disabled={!message.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0969da] to-[#0ca678] px-4 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                Send via WhatsApp
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}