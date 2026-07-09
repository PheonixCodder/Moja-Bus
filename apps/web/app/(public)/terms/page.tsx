import type { Metadata } from "next";
import { PublicPageShell } from "@/features/home/components/public-page-shell";

export const metadata: Metadata = {
  title: "Terms & Conditions — Moja Ride",
  description:
    "Read the Moja Ride Terms and Conditions governing the use of our intercity bus booking platform.",
};

export default function TermsPage() {
  return (
    <PublicPageShell
      title="Terms & Conditions"
      description="Last updated: July 2026 • Read the terms and conditions governing the use of our intercity bus booking platform."
      badge="Legal"
    >

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 md:px-8 py-16">
        <div
          className="prose prose-slate max-w-none"
          style={{
            "--tw-prose-headings": "#0f172a",
            "--tw-prose-body": "#475569",
            "--tw-prose-links": "#ee237c",
          } as React.CSSProperties}
        >
          <div className="space-y-10 text-slate-600 leading-relaxed text-sm">

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing or using the Moja Ride platform (the &ldquo;Platform&rdquo;), including our
                website at mojaride.com and any associated mobile applications, you agree to be
                bound by these Terms and Conditions (&ldquo;Terms&rdquo;). If you do not agree to these
                Terms, please do not use the Platform.
              </p>
              <p className="mt-3">
                These Terms apply to all users, including passengers, bus operators
                (&ldquo;Operators&rdquo;), and any other persons who access the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">2. Description of Services</h2>
              <p>
                Moja Ride operates an online marketplace that connects passengers with intercity
                bus operators in Côte d&apos;Ivoire. We facilitate the discovery, booking, and
                payment of intercity bus trips. Moja Ride is a technology platform and not a
                transport provider. The actual transportation services are provided exclusively
                by the Operators.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">3. Booking & Payment</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  All bookings are subject to seat availability at the time of confirmation.
                </li>
                <li>
                  Prices are displayed in West African CFA Franc (XOF) and include a 2.5%
                  platform service fee.
                </li>
                <li>
                  Seats are held for 10 minutes during checkout. Uncompleted bookings
                  automatically release the held seats.
                </li>
                <li>
                  Payment must be completed in full at the time of booking. Partial payments
                  are not accepted.
                </li>
                <li>
                  Your booking is confirmed only upon successful payment and receipt of a
                  digital ticket.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">4. Cancellations & Refunds</h2>
              <p>
                Cancellation policies are set by each Operator and displayed on the trip
                detail page before booking. Moja Ride acts as an intermediary in processing
                refunds but is not liable for refund decisions made by Operators.
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-3">
                <li>
                  The 2.5% platform service fee is non-refundable in all cases.
                </li>
                <li>
                  Refunds approved by Operators are processed within 3–7 business days.
                </li>
                <li>
                  No-shows (failing to board at departure) are not eligible for refunds unless
                  the Operator has a specific policy.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">5. Operator Obligations</h2>
              <p>Operators using the Moja Ride platform agree to:</p>
              <ul className="list-disc pl-5 space-y-2 mt-3">
                <li>
                  Maintain all required operating licenses, insurance, and permits under
                  Ivorian law.
                </li>
                <li>
                  Honor all confirmed bookings made through the Platform.
                </li>
                <li>
                  Maintain published schedules and notify Moja Ride of delays or cancellations
                  as soon as possible.
                </li>
                <li>
                  Pay the agreed 5% platform commission on each confirmed booking.
                </li>
                <li>
                  Not solicit passengers to book outside the Platform for trips discovered
                  through Moja Ride.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">6. Limitation of Liability</h2>
              <p>
                Moja Ride is a marketplace platform and is not liable for the actions,
                omissions, or negligence of Operators. In particular, Moja Ride is not
                responsible for:
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-3">
                <li>Delays, cancellations, or route changes by Operators.</li>
                <li>Loss or damage to passenger luggage or property.</li>
                <li>Accidents, injuries, or incidents occurring during travel.</li>
                <li>Force majeure events (weather, roadblocks, civil unrest, etc.).</li>
              </ul>
              <p className="mt-3">
                Our total liability to you shall not exceed the amount paid for the booking
                in question.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">7. User Conduct</h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-5 space-y-2 mt-3">
                <li>Use the Platform for any fraudulent or unlawful purpose.</li>
                <li>Create fake bookings or abuse the hold mechanism.</li>
                <li>Resell tickets at inflated prices (&ldquo;ticket scalping&rdquo;).</li>
                <li>Share account credentials with third parties.</li>
                <li>
                  Attempt to reverse-engineer, scrape, or otherwise interfere with the
                  Platform.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">8. Intellectual Property</h2>
              <p>
                All content on the Moja Ride Platform, including the name, logo, design,
                software, and text, is the property of Moja Ride Inc. and is protected by
                copyright, trademark, and other applicable laws. You may not reproduce,
                distribute, or use any of our content without our written permission.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">9. Governing Law</h2>
              <p>
                These Terms are governed by and construed in accordance with the laws of
                Côte d&apos;Ivoire. Any disputes arising from these Terms or use of the Platform
                shall be subject to the exclusive jurisdiction of the courts of Abidjan,
                Côte d&apos;Ivoire.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">10. Changes to These Terms</h2>
              <p>
                We reserve the right to update these Terms at any time. We will notify users
                of material changes via email or a prominent notice on the Platform. Continued
                use of the Platform after changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">11. Contact</h2>
              <p>
                For questions about these Terms, please contact us at{" "}
                <a
                  href="mailto:legal@mojaride.com"
                  className="text-[#ee237c] font-semibold hover:underline"
                >
                  legal@mojaride.com
                </a>
                .
              </p>
            </section>

          </div>
        </div>
      </div>
    </PublicPageShell>
  );
}
