import Link from "next/link";
import { Book, FileQuestion, User, CreditCard, HelpCircle } from "lucide-react";

export default function HelpPage() {
  const sections = [
    {
      icon: Book,
      title: "Getting Started",
      description: "Learn the basics of using AnatomiQ",
      items: [
        "Creating your account",
        "Selecting your courses",
        "Navigating the dashboard",
        "Understanding your profile",
      ],
    },
    {
      icon: FileQuestion,
      title: "Taking Exams",
      description: "Master the exam feature",
      items: [
        "Starting an exam",
        "Question types explained",
        "Timer and navigation",
        "Reviewing your results",
      ],
    },
    {
      icon: User,
      title: "Profile & Settings",
      description: "Manage your account",
      items: [
        "Updating your profile",
        "Changing your password",
        "Managing notifications",
        "Course selection",
      ],
    },
    {
      icon: CreditCard,
      title: "Subscriptions",
      description: "Understanding plans and billing",
      items: [
        "Subscription tiers explained",
        "Upgrading your plan",
        "Payment methods",
        "Billing history",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 py-16 px-4">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <HelpCircle className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Help Center</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Find answers to your questions and learn how to make the most of AnatomiQ
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.title} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{section.title}</h2>
                    <p className="text-sm text-slate-600">{section.description}</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {section.items.map((item) => (
                    <li key={item} className="text-slate-700 hover:text-blue-600 cursor-pointer flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-lg text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Still Need Help?</h2>
          <p className="text-slate-600 mb-6">
            Can&apos;t find what you&apos;re looking for? Check our FAQ or contact support.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/faq"
              className="px-6 py-3 rounded-xl bg-gradient-to-br from-[#0969da] to-[#0ca678] font-semibold text-white hover:scale-105 transition-transform"
            >
              View FAQ
            </Link>
            <Link
              href="/contact"
              className="px-6 py-3 rounded-xl border-2 border-slate-300 font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
