import type { Metadata } from "next";
import { PublicPageShell } from "@/features/home/components/public-page-shell";

export const metadata: Metadata = {
  title: "Privacy Policy — Moja Ride",
  description:
    "Learn how Moja Ride collects, uses, and protects your personal data in accordance with applicable privacy laws.",
};

export default function PrivacyPage() {
  return (
    <PublicPageShell
      title="Privacy Policy"
      description="Last updated: July 2026 • Learn how Moja Ride collects, uses, and protects your personal data in accordance with applicable privacy laws."
      badge="Legal"
    >

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 md:px-8 py-16">
        <div className="space-y-10 text-slate-600 leading-relaxed text-sm">

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">1. Who We Are</h2>
            <p>
              Moja Ride Inc. (&ldquo;Moja Ride&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) operates an online intercity
              bus booking platform for Côte d&apos;Ivoire. This Privacy Policy explains how we
              collect, use, disclose, and protect your personal information when you use our
              website (mojaride.com) and related services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">2. Information We Collect</h2>
            <p className="font-semibold text-slate-700 mb-2">Information you provide directly:</p>
            <ul className="list-disc pl-5 space-y-1 mb-4">
              <li>Full name, email address, phone number (for account creation)</li>
              <li>Passenger names and phone numbers (for booking)</li>
              <li>
                Payment information — processed and stored by Paystack; Moja Ride does not
                store card or Mobile Money credentials
              </li>
              <li>Business information (for Operators: company registration, tax ID)</li>
            </ul>
            <p className="font-semibold text-slate-700 mb-2">Information collected automatically:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>IP address, browser type, and device information</li>
              <li>Pages visited and time spent on the Platform</li>
              <li>Search queries (cities, dates, passenger counts)</li>
              <li>Cookies and similar tracking technologies (see Section 8)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">3. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-3">
              <li>Create and manage your account</li>
              <li>Process bookings and payments</li>
              <li>Send booking confirmations, e-tickets, and receipts</li>
              <li>Provide customer support</li>
              <li>Improve our search algorithms and platform features</li>
              <li>Detect and prevent fraud and abuse</li>
              <li>Comply with legal obligations</li>
              <li>
                Send service communications (account updates, security alerts) — you cannot
                opt out of these
              </li>
              <li>
                Send marketing communications about new features or promotions — you can opt
                out at any time
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">4. Sharing Your Information</h2>
            <p>We share your information only in the following circumstances:</p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>
                <strong className="text-slate-700">With Operators:</strong> When you make a
                booking, your name and phone number are shared with the bus operator to enable
                check-in and boarding.
              </li>
              <li>
                <strong className="text-slate-700">Paystack:</strong> Payment data is processed
                by Paystack, our PCI-DSS Level 1 certified payment partner. See{" "}
                <a
                  href="https://paystack.com/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#ee237c] hover:underline"
                >
                  Paystack's Terms
                </a>
                .
              </li>
              <li>
                <strong className="text-slate-700">Resend:</strong> Email delivery is handled
                by Resend. Your email address is shared with them solely for the purpose of
                sending transactional emails.
              </li>
              <li>
                <strong className="text-slate-700">Legal requirements:</strong> We may disclose
                your information if required by law, court order, or other governmental
                authority.
              </li>
              <li>
                <strong className="text-slate-700">Business transfers:</strong> In the event of
                a merger, acquisition, or sale of assets, your information may be transferred
                as part of that transaction.
              </li>
            </ul>
            <p className="mt-4">
              We do <strong>not</strong> sell your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">5. Data Retention</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong className="text-slate-700">Account data:</strong> Retained while your
                account is active. You may request deletion at any time (see Section 6).
              </li>
              <li>
                <strong className="text-slate-700">Booking records:</strong> Retained for 7
                years for accounting and legal compliance purposes.
              </li>
              <li>
                <strong className="text-slate-700">Logs:</strong> System logs are retained for
                90 days.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-3">
              <li>
                <strong className="text-slate-700">Access:</strong> Request a copy of the
                personal data we hold about you.
              </li>
              <li>
                <strong className="text-slate-700">Correction:</strong> Update inaccurate
                information via your account settings or by contacting us.
              </li>
              <li>
                <strong className="text-slate-700">Deletion:</strong> Request deletion of your
                account and personal data, subject to legal retention requirements.
              </li>
              <li>
                <strong className="text-slate-700">Portability:</strong> Request your data in
                a machine-readable format.
              </li>
              <li>
                <strong className="text-slate-700">Opt-out of marketing:</strong> Unsubscribe
                from marketing emails at any time using the link in any email.
              </li>
            </ul>
            <p className="mt-4">
              To exercise any of these rights, contact us at{" "}
              <a
                href="mailto:privacy@mojaride.com"
                className="text-[#ee237c] font-semibold hover:underline"
              >
                privacy@mojaride.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">7. Data Security</h2>
            <p>
              We implement industry-standard security measures including:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-3">
              <li>HTTPS / TLS 1.3 encryption for all data in transit</li>
              <li>AES-256-GCM encryption for sensitive operator bank account data at rest</li>
              <li>HttpOnly, Secure, SameSite session cookies</li>
              <li>Access controls limiting who can view sensitive data internally</li>
              <li>Regular security reviews and dependency updates</li>
            </ul>
            <p className="mt-3">
              No system is perfectly secure. In the unlikely event of a data breach, we will
              notify affected users as required by applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">8. Cookies</h2>
            <p>
              We use cookies and similar technologies to operate the Platform. This includes:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-3">
              <li>
                <strong className="text-slate-700">Session cookies:</strong> Required for
                authentication and security. These are deleted when you close your browser.
              </li>
              <li>
                <strong className="text-slate-700">Preference cookies:</strong> Remember your
                settings and preferences (e.g., language, search history).
              </li>
              <li>
                <strong className="text-slate-700">Analytics cookies:</strong> Help us
                understand how the Platform is used so we can improve it.
              </li>
            </ul>
            <p className="mt-3">
              You can control cookies through your browser settings. Disabling certain cookies
              may affect Platform functionality.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">9. Children&apos;s Privacy</h2>
            <p>
              The Platform is not directed at children under 13 years of age. We do not
              knowingly collect personal information from children under 13. If you believe a
              child has provided us with personal data, contact us immediately at{" "}
              <a
                href="mailto:privacy@mojaride.com"
                className="text-[#ee237c] font-semibold hover:underline"
              >
                privacy@mojaride.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. We will notify you of material
              changes by email or by posting a notice on the Platform. Your continued use of
              the Platform after the effective date constitutes acceptance of the updated Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">11. Contact Us</h2>
            <p>
              For privacy-related questions or requests, contact our Data Protection team at:
            </p>
            <div className="mt-3 bg-slate-50 rounded-2xl p-5">
              <p className="font-semibold text-slate-800">Moja Ride Inc.</p>
              <p className="text-slate-500 mt-1">Plateau, Abidjan, Côte d&apos;Ivoire</p>
              <a
                href="mailto:privacy@mojaride.com"
                className="text-[#ee237c] font-semibold hover:underline"
              >
                privacy@mojaride.com
              </a>
            </div>
          </section>

        </div>
      </div>
    </PublicPageShell>
  );
}
