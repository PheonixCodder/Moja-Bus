import type { Metadata } from "next";
import { PublicPageShell } from "@/features/home/components/public-page-shell";

export const metadata: Metadata = {
  title: "Terms & Conditions — Moja Ride",
  description:
    "Read the Moja Ride General Terms and Conditions governing the use of our intercity bus booking platform in Côte d'Ivoire.",
};

const sections = [
  { id: "scope", title: "1. Scope of Application" },
  { id: "partner", title: "2. Contractual Partner" },
  { id: "commercial-use", title: "3. Commercial Use of the Portal" },
  { id: "payment", title: "4. Payment & Vouchers" },
  { id: "cancellation-modification", title: "5. Cancellation & Modification" },
  { id: "service-fees", title: "6. Service Fees" },
  { id: "jurisdiction", title: "7. Jurisdiction" },
  { id: "severability", title: "8. Severability" },
  { id: "cancellation-policy", title: "Cancellation Policy" },
  { id: "contact", title: "Contact" },
];

export default function TermsPage() {
  return (
    <PublicPageShell
      title="Terms & Conditions"
      description="Version: 08/26/2024 — General Terms of Sale and Special Booking Conditions governing the use of Moja Ride's platform."
      badge="Legal"
    >
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-16">
        <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-16 relative">

          {/* Sticky sidebar TOC */}
          <aside className="hidden lg:block">
            <div className="sticky top-8">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
                Table of Contents
              </p>
              <nav className="space-y-1">
                {sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="block text-sm text-slate-500 hover:text-[#ee237c] py-1.5 px-3 rounded-lg hover:bg-pink-50 transition-all leading-snug"
                  >
                    {s.title}
                  </a>
                ))}
              </nav>
              <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs font-semibold text-slate-600 mb-1">Questions?</p>
                <a
                  href="mailto:legal@mojaride.com"
                  className="text-xs text-[#ee237c] font-semibold hover:underline"
                >
                  legal@mojaride.com
                </a>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <div className="space-y-14 text-slate-600 leading-relaxed text-sm min-w-0">

            <section id="scope" className="scroll-mt-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-50 text-[#ee237c] flex items-center justify-center text-xs font-extrabold">1</span>
                Scope of Application
              </h2>
              <div className="space-y-3">
                <p>
                  <span className="font-semibold text-slate-700">1.1</span> The General Terms of Sale and the Special Booking Conditions apply to the use of MojaBus internet portals (including the mobile application, designed to allow customers to visit these portals) and to the booking of trips with MojaBus.
                </p>
                <p>
                  MojaBus reserves the right to modify these General Booking Conditions at any time by publishing a new version on the website. The booking conditions applicable are those in force on the date the order is placed.
                </p>
                <p>
                  Checking the box relating to these General Booking Conditions during the order validation process constitutes unreserved acceptance by the customer of all these General Booking Conditions.
                </p>
              </div>
            </section>

            <section id="partner" className="scroll-mt-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-50 text-[#ee237c] flex items-center justify-center text-xs font-extrabold">2</span>
                Contractual Partner
              </h2>
              <p>
                The contractual partner for trip bookings (seller of transport tickets) and for the use of web portals is the company <strong className="text-slate-700">Moja Ride SARL</strong>, hereinafter referred to as &ldquo;Moja Ride&rdquo;.
              </p>
            </section>

            <section id="commercial-use" className="scroll-mt-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-50 text-[#ee237c] flex items-center justify-center text-xs font-extrabold">3</span>
                Commercial Use of the Web Portal
              </h2>
              <div className="space-y-3">
                <p>
                  <span className="font-semibold text-slate-700">3.1</span> Price comparison services may enter into a contract with Moja Ride authorizing the receipt, processing, and publication of Moja Ride prices and bus schedules.
                </p>
                <p>
                  <span className="font-semibold text-slate-700">3.2</span> It is prohibited to use MojaBus web portals for non-private or commercial purposes. The use of automated data extraction systems from this site for commercial purposes (&ldquo;screen scraping&rdquo;) is prohibited. Moja Ride reserves the right to take action in the event of a breach of these provisions.
                </p>
              </div>
            </section>

            <section id="payment" className="scroll-mt-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-50 text-[#ee237c] flex items-center justify-center text-xs font-extrabold">4</span>
                Payment & Vouchers
              </h2>
              <div className="space-y-6">
                <div>
                  <p className="font-semibold text-slate-700 mb-2">4.1 Payment methods</p>
                  <p className="mb-2">Transport tickets may be paid in different ways depending on the booking type:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong className="text-slate-700">Online:</strong> Mobile money and wallets (Wave, Orange Money, etc.) and bank cards (Mastercard / Visa / Amex). We reserve the right to offer specific payment methods per booking.</li>
                    <li><strong className="text-slate-700">On board:</strong> Cash only.</li>
                    <li><strong className="text-slate-700">Points of sale:</strong> Our partner agencies and stations offer various payment options; cash is always accepted.</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-slate-700 mb-2">4.2 Credit card purchases</p>
                  <p>Customer accounts are debited once the booking is complete. In the event of a rejected card payment, customers may be temporarily or permanently prohibited from paying with that card and must use another card or an alternative payment method (see 4.1).</p>
                </div>

                <div>
                  <p className="font-semibold text-slate-700 mb-2">4.3 Offsetting</p>
                  <p>Claims may only be offset where the principle of legal set-off applies, i.e., between two fungible, certain, liquid, and due obligations. Obligations involving sums of money — even in different convertible currencies — or obligations involving a quantity of goods of the same kind are fungible.</p>
                </div>

                <div>
                  <p className="font-semibold text-slate-700 mb-2">4.4 Use of vouchers</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>A maximum of one voucher may be used per booking. Vouchers can only be used online or at our partner agencies.</li>
                    <li>Monetary value vouchers may be applied to the entire cart. Discount or free-trip vouchers apply to the ticket price only — add-ons (service fees, luggage, bicycle) are excluded.</li>
                    <li>During promotional campaigns, voucher use is limited to 3 vouchers per person. Moja Ride may cancel all bookings beyond the first 3 if this limit is exceeded.</li>
                    <li>Vouchers issued free of charge for marketing purposes expire after the first completed booking.</li>
                    <li>Commercial resale of vouchers is prohibited and will result in ticket blocking and/or claims for damages. Customers will be informed and given 15 days to submit observations.</li>
                    <li>Cash refunds of vouchers are excluded.</li>
                    <li>In case of fraud or illegal activity related to vouchers, Moja Ride may close accounts, require alternative payment, and/or block vouchers. No right to activation or refund of affected vouchers may be invoked.</li>
                    <li>Moja Ride may cancel tickets paid for in whole or in part with fraudulently used vouchers.</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-slate-700 mb-2">4.5 Use of discount codes</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Only one discount code may be used per booking. Codes are activated within 48 hours of the booking confirmation email and can only be used online or at partner agencies.</li>
                    <li>Discount codes are valid for 3 months from date of issue.</li>
                    <li>Direct connections only (no connections), except for round trips. The departure and arrival points may not be the same.</li>
                    <li>Personal vouchers are non-transferable.</li>
                    <li>Booking changes can only be made by customer service. Cancellation is not possible.</li>
                    <li>Commercial resale of discount codes is prohibited and subject to sanctions.</li>
                    <li>Cash refunds of discount codes are excluded.</li>
                    <li>Each discount code must be used for a different trip.</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-slate-700 mb-2">4.6 Promotional campaigns</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Reduced-price ticket offers are limited to 3 tickets per person per campaign. Bookings beyond 3 may be cancelled by Moja Ride.</li>
                    <li>Commercial resale of tickets is prohibited and will result in ticket blocking.</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-slate-700 mb-2">4.7 Order cancellation by Moja Ride</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Moja Ride reserves the right to refuse an order for a legitimate reason, in particular when there is an outstanding payment dispute with the customer.</li>
                    <li>In the event of fraud or illegal activity, Moja Ride may cancel any ticket purchased in whole or in part by means of a refund of that ticket.</li>
                    <li>If a ticket purchased during a commercial offer is modified after the offer has expired, the customer must pay the difference between the new applicable price and the price paid during the offer.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section id="cancellation-modification" className="scroll-mt-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-50 text-[#ee237c] flex items-center justify-center text-xs font-extrabold">5</span>
                Cancellation & Modification of Tickets
              </h2>
              <div className="space-y-4">
                <p>
                  <span className="font-semibold text-slate-700">5.1</span> It is not possible to cancel or modify a booking with the driver. Cancellations and modifications may be made on the MojaBus website, by phone, or at one of the MojaBus partner agencies or points of sale, up to <strong className="text-slate-700">15 minutes before the scheduled departure time</strong>. A round trip is considered a single booking. A round trip corresponds to two journeys, but a journey with connections corresponds to only one journey.
                </p>
                <p>
                  <span className="font-semibold text-slate-700">5.2</span> In the event of a ticket modification (traveler name, date, or time), if the cost of the new journey is higher, the customer must pay the difference immediately. If the cost is lower, the customer will receive a non-refundable voucher valid for 12 months, usable for all or part of a future journey.
                </p>
                <p>
                  <span className="font-semibold text-slate-700">5.3</span> For each ticket modification (except a phone number change, which is free), modification fees apply per cancelled journey and per passenger.
                </p>
                <p>
                  <span className="font-semibold text-slate-700">5.4</span> If a cancellation voucher is used for a new booking, the same general cancellation conditions apply to that new journey.
                </p>
                <p>
                  <span className="font-semibold text-slate-700">5.5</span> The customer may cancel their ticket on the website or app and will receive a cancellation voucher for the amount of the original ticket, minus the cancellation fees per passenger per journey (see 5.3). This non-refundable voucher is valid for 12 months.
                </p>
                <p>
                  <span className="font-semibold text-slate-700">5.6</span> All cancellation or modification fees are waived when the refund is requested due to circumstances attributable to Moja Ride or its subsidiaries.
                </p>
                <p>
                  <span className="font-semibold text-slate-700">5.7</span> If a ticket for which a MojaBus subsidiary is the carrier is not used for travel, the ticket price will be refunded upon presentation of the ticket, minus processing fees per journey per passenger (1,000 FCFA or equivalent), unless the passenger can prove lower damages. Requests must be submitted informally within 3 months to Moja Ride&apos;s registered address in Abidjan. Processing fees are reduced to 1,000 FCFA (or equivalent) per passenger per journey, plus wire transfer fees, if the carrier is Moja Ride and the request is made quickly, no later than one week after the ticket expires.
                </p>
                <p>
                  <span className="font-semibold text-slate-700">5.8</span> Different cancellation policies in the Carrier&apos;s General Conditions do not apply.
                </p>
              </div>
            </section>

            <section id="service-fees" className="scroll-mt-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-50 text-[#ee237c] flex items-center justify-center text-xs font-extrabold">6</span>
                Service Fees
              </h2>
              <div className="bg-pink-50 border border-pink-100 rounded-2xl p-5 mb-4">
                <p className="text-slate-700">
                  A service fee of <strong className="text-slate-900">500 FCFA</strong> (or the equivalent in the relevant currency) will be charged per booking. This is a per-order fee (not per ticket) for use of the website, app, and other tools designed to optimize the customer experience — such as the &ldquo;Manage my booking&rdquo; platform, where you can modify a journey or add luggage.
                </p>
              </div>
              <p>In the event of cancellation by the customer, service fees are non-refundable.</p>
              <p className="mt-2">For bookings made by phone (customer service) or at one of our offline agencies or resellers, additional fees may apply.</p>
            </section>

            <section id="jurisdiction" className="scroll-mt-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-50 text-[#ee237c] flex items-center justify-center text-xs font-extrabold">7</span>
                Jurisdiction
              </h2>
              <p>
                The competent territorial jurisdiction is, unless otherwise provided, that of the place of residence of the defendant or the place where the damage occurred. The competent jurisdiction for merchants, legal entities, and individuals without a general jurisdiction in their country, as well as for individuals who have moved their primary domicile or habitual residence abroad following the conclusion of a transport contract — whose primary domicile or habitual place of residence is unknown at the time of the action — is <strong className="text-slate-700">Abidjan, Côte d&apos;Ivoire</strong>.
              </p>
            </section>

            <section id="severability" className="scroll-mt-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-50 text-[#ee237c] flex items-center justify-center text-xs font-extrabold">8</span>
                Severability
              </h2>
              <p>
                If any individual provision of these General Terms of Sale and Special Booking Conditions is or becomes wholly or partially unenforceable or void, this shall not in principle affect the enforceability of the contract as a whole.
              </p>
            </section>

            {/* Cancellation Policy */}
            <section id="cancellation-policy" className="scroll-mt-8">
              <h2 className="text-xl font-bold text-slate-900 mb-2">Cancellation Policy</h2>
              <p className="text-xs text-slate-400 mb-6">Applicable to trips with a scheduled departure date after 12 September 2024.</p>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-6 text-slate-600 text-sm">
                <p>
                  For bookings made before 1 August 2024 for a departure after 12 September 2024, any cancellation request after 12 September must be addressed to our customer service via the chat.
                </p>
                <p className="mt-3">
                  Changed plans? No problem! With Moja Ride you can cancel your ticket up to <strong className="text-slate-700">15 minutes before departure</strong> and receive a full or partial refund in the form of a voucher. The refund percentage depends on how early you cancel, calculated from the exact departure time (hour, minute, second).
                </p>
              </div>

              <div className="rounded-2xl overflow-hidden border border-slate-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-900 text-white">
                      <th className="text-left px-5 py-3 font-semibold">Time before departure</th>
                      <th className="text-right px-5 py-3 font-semibold">Refund (% of ticket price)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { range: "Less than 2 days", refund: "25%" },
                      { range: "Between 2 and 6 days", refund: "50%" },
                      { range: "Between 7 and 29 days", refund: "75%" },
                      { range: "30 days or more", refund: "100%" },
                    ].map((row, i) => (
                      <tr key={row.range} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                        <td className="px-5 py-3 text-slate-700">{row.range}</td>
                        <td className="px-5 py-3 text-right font-bold text-[#ee237c]">{row.refund}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 space-y-1 text-xs text-slate-500">
                <p>• Extras (seat reservations, additional luggage): refunded at <strong>100%</strong>.</p>
                <p>• Booking and service fees are <strong>non-refundable</strong>.</p>
              </div>

              {/* Older policy */}
              <div className="mt-10">
                <p className="text-sm font-semibold text-slate-700 mb-2">
                  Previous policy — Applicable to trips with departure between 18 December 2023 and 12 September 2024
                </p>
                <div className="rounded-2xl overflow-hidden border border-slate-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-800 text-white">
                        <th className="text-left px-5 py-3 font-semibold">Time before departure</th>
                        <th className="text-right px-5 py-3 font-semibold">Refund (% of ticket price)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { range: "Less than 1 day", refund: "25%" },
                        { range: "Between 1 and 6 days", refund: "50%" },
                        { range: "Between 7 and 29 days", refund: "75%" },
                        { range: "30 days or more", refund: "100%" },
                      ].map((row, i) => (
                        <tr key={row.range} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                          <td className="px-5 py-3 text-slate-700">{row.range}</td>
                          <td className="px-5 py-3 text-right font-bold text-slate-600">{row.refund}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-xs text-slate-500">Extras (seat reservations, additional luggage): 100% refund. Booking and service fees are non-refundable.</p>
              </div>
            </section>

            {/* Contact */}
            <section id="contact" className="scroll-mt-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Contact</h2>
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <p className="font-semibold text-slate-800">Moja Ride SARL</p>
                <p className="text-slate-500 mt-1">Abidjan, Cocody, Cité Sir — Côte d&apos;Ivoire</p>
                <a
                  href="mailto:legal@mojaride.com"
                  className="mt-2 inline-block text-[#ee237c] font-semibold hover:underline"
                >
                  legal@mojaride.com
                </a>
              </div>
            </section>

          </div>
        </div>
      </div>
    </PublicPageShell>
  );
}
