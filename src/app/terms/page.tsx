import { Scale } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 py-16 px-4">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <Scale className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Terms of Service</h1>
          <p className="text-lg text-slate-600">
            Last updated: May 12, 2026
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-lg space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-slate-700 leading-relaxed">
              By accessing and using AnatomiQ ("the Service"), you accept and agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use the Service. We reserve the right to modify these terms
              at any time, and your continued use constitutes acceptance of any changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">2. User Accounts</h2>
            <p className="text-slate-700 leading-relaxed mb-3">
              To use AnatomiQ, you must create an account with accurate information. You are responsible for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized access</li>
              <li>Ensuring you are at least 18 years old or have parental consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Acceptable Use</h2>
            <p className="text-slate-700 leading-relaxed mb-3">
              You agree not to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
              <li>Share your account with others or allow unauthorized access</li>
              <li>Use the Service for any illegal or unauthorized purpose</li>
              <li>Attempt to reverse engineer, hack, or compromise the platform</li>
              <li>Copy, distribute, or resell exam questions or course materials</li>
              <li>Upload malicious code, viruses, or harmful content</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Use automated tools to scrape or extract data from the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Subscriptions and Payments</h2>
            <p className="text-slate-700 leading-relaxed">
              AnatomiQ offers both free and paid subscription tiers. Paid subscriptions are billed monthly or annually
              as selected. You authorize us to charge your payment method for all fees. Subscriptions automatically renew
              unless canceled before the renewal date. Refunds are provided at our discretion and only for unused portions
              of paid subscriptions. We reserve the right to change pricing with 30 days' notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Intellectual Property</h2>
            <p className="text-slate-700 leading-relaxed">
              All content on AnatomiQ, including exam questions, course materials, software, designs, and trademarks,
              are owned by AnatomiQ or its licensors. You are granted a limited, non-exclusive, non-transferable license
              to access and use the Service for personal, educational purposes only. You may not reproduce, distribute,
              modify, or create derivative works without our express written permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">6. AI-Generated Content</h2>
            <p className="text-slate-700 leading-relaxed">
              AnatomiQ uses artificial intelligence to generate exam questions based on uploaded course materials.
              While we strive for accuracy, AI-generated content may contain errors or inconsistencies. The Service
              is intended as a study aid and should not be the sole basis for exam preparation. We do not guarantee
              the accuracy, completeness, or reliability of AI-generated questions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Limitation of Liability</h2>
            <p className="text-slate-700 leading-relaxed">
              AnatomiQ is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental,
              special, or consequential damages arising from your use of the Service, including but not limited to exam
              performance, lost data, or service interruptions. Our total liability shall not exceed the amount you paid
              for the Service in the past 12 months.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Termination</h2>
            <p className="text-slate-700 leading-relaxed">
              We reserve the right to suspend or terminate your account at any time for violations of these Terms,
              fraudulent activity, or any conduct we deem harmful to the Service or other users. You may delete your
              account at any time from your Profile settings. Upon termination, your right to use the Service ceases
              immediately, and we may delete your data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">9. Governing Law</h2>
            <p className="text-slate-700 leading-relaxed">
              These Terms are governed by the laws of the Federal Republic of Nigeria. Any disputes shall be resolved
              in the courts of Akwa Ibom State. If any provision is found unenforceable, the remaining provisions remain
              in full effect.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">10. Contact Information</h2>
            <p className="text-slate-700 leading-relaxed">
              For questions about these Terms, please contact us at legal@anatomiq.com or through our Contact page.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
