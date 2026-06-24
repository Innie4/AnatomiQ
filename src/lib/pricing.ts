export const PRICING = {
  FREE: {
    name: "Free",
    tier: "FREE" as const,
    monthly: 0,
    annual: 0,
    features: [
      "Access to all anatomy topics",
      "Basic exam generation",
      "Limited to 5 exams per day",
      "Standard question types",
      "Community support",
    ],
    limits: {
      examsPerDay: 5,
      questionsPerExam: 20,
      timerEnabled: false,
    },
  },
  STARTER: {
    name: "Starter",
    tier: "STARTER" as const,
    monthly: 500,
    annual: 5000, // ~2 months free
    features: [
      "Everything in Free",
      "Unlimited exam generation",
      "Up to 50 questions per exam",
      "Timed exam mode",
      "Question randomization",
      "Performance tracking",
      "Priority support",
    ],
    limits: {
      examsPerDay: null,
      questionsPerExam: 50,
      timerEnabled: true,
    },
    popular: true,
  },
  PRO: {
    name: "Pro",
    tier: "PRO" as const,
    monthly: 1000,
    annual: 10000, // ~2 months free
    features: [
      "Everything in Starter",
      "Unlimited questions per exam",
      "Advanced analytics dashboard",
      "Custom exam templates",
      "Export exam results",
      "Offline exam mode",
      "Dedicated support",
      "Early access to new features",
    ],
    limits: {
      examsPerDay: null,
      questionsPerExam: null,
      timerEnabled: true,
    },
    badge: "Best Value",
  },
  PREMIUM: {
    name: "Premium",
    tier: "PREMIUM" as const,
    monthly: 2500,
    annual: 25000, // ~2 months free
    features: [
      "Everything in Pro",
      "AI-powered question generation",
      "Personalized study recommendations",
      "Detailed performance analytics",
      "Priority 24/7 support",
      "Ad-free experience",
      "Downloadable study materials",
      "Multi-device sync",
    ],
    limits: {
      examsPerDay: null,
      questionsPerExam: null,
      timerEnabled: true,
    },
  },
} as const;

export type SubscriptionTier = keyof typeof PRICING;

export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}

export function calculateAnnualSavings(tier: SubscriptionTier): number {
  const plan = PRICING[tier];
  const monthlyTotal = plan.monthly * 12;
  return monthlyTotal - plan.annual;
}
