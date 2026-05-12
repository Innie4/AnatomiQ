import { Shield } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 py-16 px-4">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <Shield className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Privacy Policy</h1>
          <p className="text-lg text-slate-600">
            Last updated: May 12, 2026
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-lg space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Introduction</h2>
            <p className="text-slate-700 leading-relaxed">
              AnatomiQ ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains
              how we collect, use, disclose, and safeguard your information when you use our platform. By using AnatomiQ,
              you consent to the practices described in this policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Information We Collect</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Personal Information</h3>
                <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
                  <li>Full name and email address (required for account creation)</li>
                  <li>University matriculation number</li>
                  <li>Course selections and enrollment information</li>
                  <li>Payment information (processed securely through third-party providers)</li>
                  <li>Profile photo and bio (optional)</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Usage Information</h3>
                <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
                  <li>Exam results, scores, and performance analytics</li>
                  <li>Questions answered and study session data</li>
                  <li>Login timestamps and session duration</li>
                  <li>Device information, IP address, and browser type</li>
                  <li>Referral activity and subscription status</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-slate-700 leading-relaxed mb-3">
              We use your information to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
              <li>Provide, maintain, and improve the Service</li>
              <li>Generate personalized exam questions using AI</li>
              <li>Process payments and manage subscriptions</li>
              <li>Send account notifications, exam results, and service updates</li>
              <li>Track referrals and distribute rewards</li>
              <li>Analyze usage patterns to enhance user experience</li>
              <li>Detect and prevent fraud, abuse, or security issues</li>
              <li>Comply with legal obligations and enforce our Terms of Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Information Sharing</h2>
            <p className="text-slate-700 leading-relaxed mb-3">
              We do not sell your personal information. We may share your data with:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
              <li><strong>Service Providers:</strong> Payment processors (Paystack, Flutterwave), email services, and cloud hosting providers</li>
              <li><strong>AI Services:</strong> OpenAI and other AI providers for question generation (course materials only, not personal data)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and users' safety</li>
              <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Data Security</h2>
            <p className="text-slate-700 leading-relaxed">
              We implement industry-standard security measures to protect your data, including encryption in transit
              (HTTPS/TLS), hashed passwords (bcrypt), secure token-based authentication (JWT), and regular security audits.
              However, no system is completely secure, and we cannot guarantee absolute security. You are responsible for
              keeping your account credentials confidential.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Data Retention</h2>
            <p className="text-slate-700 leading-relaxed">
              We retain your personal information for as long as your account is active or as needed to provide services.
              Exam results and performance data are retained indefinitely to track progress over time. If you delete your
              account, most personal information is permanently removed within 30 days, though some data may be retained
              for legal or security purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Your Rights</h2>
            <p className="text-slate-700 leading-relaxed mb-3">
              You have the right to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
              <li>Access and download your personal data</li>
              <li>Correct inaccurate or incomplete information</li>
              <li>Delete your account and associated data</li>
              <li>Opt out of marketing communications</li>
              <li>Object to certain data processing activities</li>
              <li>Request data portability in a machine-readable format</li>
            </ul>
            <p className="text-slate-700 leading-relaxed mt-3">
              To exercise these rights, visit your Profile settings or contact us at privacy@anatomiq.com.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Cookies and Tracking</h2>
            <p className="text-slate-700 leading-relaxed">
              We use cookies and similar technologies to maintain user sessions, remember preferences, and analyze site
              traffic. Essential cookies are required for the Service to function. You can disable non-essential cookies
              in your browser settings, though this may limit functionality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">9. Third-Party Links</h2>
            <p className="text-slate-700 leading-relaxed">
              AnatomiQ may contain links to external websites. We are not responsible for the privacy practices or content
              of third-party sites. We encourage you to review their privacy policies before providing any information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">10. Children's Privacy</h2>
            <p className="text-slate-700 leading-relaxed">
              AnatomiQ is intended for users 18 years and older. We do not knowingly collect information from children
              under 18 without parental consent. If we discover we have collected such information, we will delete it
              immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">11. Changes to This Policy</h2>
            <p className="text-slate-700 leading-relaxed">
              We may update this Privacy Policy periodically. We will notify you of significant changes via email or
              in-app notification. Your continued use of AnatomiQ after changes are posted constitutes acceptance of
              the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">12. Contact Us</h2>
            <p className="text-slate-700 leading-relaxed">
              For questions about this Privacy Policy or to exercise your rights, contact us at privacy@anatomiq.com
              or through our Contact page.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
