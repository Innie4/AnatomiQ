"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      category: "General",
      questions: [
        {
          q: "What is AcademIQ?",
          a: "AcademIQ is an AI-powered anatomy learning and exam generation platform designed specifically for medical students and faculty at the University of Uyo.",
        },
        {
          q: "Is AcademIQ free to use?",
          a: "AcademIQ offers a free tier with basic features. Premium tiers (STARTER and PRO) unlock unlimited exams, advanced features, and priority support.",
        },
        {
          q: "What courses are available?",
          a: "Currently, we offer Human Anatomy, Physiology, Biochemistry, Pharmacology, Pathology, Microbiology, and Law courses.",
        },
      ],
    },
    {
      category: "Exams",
      questions: [
        {
          q: "How are exam questions generated?",
          a: "Questions are generated from uploaded course materials using AI, ensuring they are grounded in your actual learning content.",
        },
        {
          q: "Can I review my exam answers?",
          a: "Yes! After completing an exam, you can review all questions, your answers, and detailed explanations.",
        },
        {
          q: "Are exam results saved?",
          a: "Yes. Signed-in users have completed exam results saved to their History page, while the immediate review screen remains available after submission.",
        },
      ],
    },
    {
      category: "Account & Billing",
      questions: [
        {
          q: "How do I upgrade my subscription?",
          a: "Go to the Pricing page and select your desired plan. You can upgrade or downgrade at any time.",
        },
        {
          q: "What payment methods do you accept?",
          a: "We accept all major payment methods through Paystack and Flutterwave, including cards and bank transfers.",
        },
        {
          q: "Can I cancel my subscription?",
          a: "Yes, you can cancel anytime from your Profile settings. You'll continue to have access until the end of your billing period.",
        },
      ],
    },
    {
      category: "Referrals",
      questions: [
        {
          q: "How does the referral program work?",
          a: "Share your unique referral code with friends. When they sign up using your code, you both benefit from the referral program.",
        },
        {
          q: "Where can I find my referral code?",
          a: "Your referral code is available on your Profile page in the Referrals section.",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 py-16 px-4">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h1>
          <p className="text-lg text-slate-600">
            Find quick answers to common questions about AcademIQ
          </p>
        </div>

        {faqs.map((category, categoryIndex) => (
          <div key={category.category} className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">{category.category}</h2>
            <div className="space-y-2">
              {category.questions.map((faq, qIndex) => {
                const index = categoryIndex * 100 + qIndex;
                const isOpen = openIndex === index;
                return (
                  <div key={index} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <button
                      onClick={() => setOpenIndex(isOpen ? null : index)}
                      className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                    >
                      <span className="font-semibold text-slate-900">{faq.q}</span>
                      <ChevronDown
                        className={`h-5 w-5 text-slate-400 transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-4 text-slate-600">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
