import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, ArrowRight } from "lucide-react";
import { PublicPageShell } from "@/features/home/components/public-page-shell";

export const metadata: Metadata = {
  title: "Help Center — Moja Ride",
  description:
    "Find answers to your questions about booking, payment, cancellations, vouchers, and more on Moja Ride.",
};

const faqs = [
  {
    category: "Booking",
    color: "bg-blue-50 text-blue-700",
    items: [
      {
        q: "How do I book a bus ticket on Moja Ride?",
        a: "Search for your route on the home page or the search page. Enter your departure city, destination, date, and number of passengers. Choose a trip from the results, select your seat(s), enter passenger details, and complete payment. Your digital ticket will be available instantly.",
      },
      {
        q: "Can I book for multiple passengers?",
        a: "Yes! You can book for up to 6 passengers in a single booking. After selecting your seats, you can enter individual passenger details for each seat — or use your saved passenger list for faster checkout.",
      },
      {
        q: "How long do I have to complete my booking?",
        a: "Seats are held for 10 minutes once you start checkout. If payment isn't completed within that window, the seats are released and you'll need to start again. We recommend having your payment method ready before selecting seats.",
      },
      {
        q: "Can I book tickets in advance?",
        a: "Yes, you can book tickets for any future date that has available trips. We recommend booking as early as possible on popular routes, especially during holidays and weekends.",
      },
    ],
  },
  {
    category: "Payment",
    color: "bg-green-50 text-green-700",
    items: [
      {
        q: "What payment methods are accepted?",
        a: "Online: Mobile money and wallets (Wave, Orange Money, MTN MoMo) and bank cards (Mastercard / Visa / Amex) via Paystack. At points of sale: cash is always accepted, and card payments may also be available depending on location. On board: cash only.",
      },
      {
        q: "Is my payment information secure?",
        a: "Absolutely. Moja Ride never stores your card or Mobile Money credentials. All payments are processed by Paystack, a PCI-DSS Level 1 certified payment processor, or Wave. We use HTTPS everywhere and your data is always encrypted.",
      },
      {
        q: "What currency are prices shown in?",
        a: "All prices are displayed in West African CFA Franc (FCFA / XOF), the official currency of Côte d'Ivoire.",
      },
      {
        q: "Is there a booking fee?",
        a: "A service fee of 500 FCFA is added per order (not per ticket) at checkout. This fee helps us operate the platform, the booking management tools, and provide customer support. The final price is always shown before you confirm payment. Service fees are non-refundable in the event of a cancellation.",
      },
    ],
  },
  {
    category: "Tickets & Travel",
    color: "bg-purple-50 text-purple-700",
    items: [
      {
        q: "How do I access my digital ticket?",
        a: 'After completing your booking, your digital ticket is available in your dashboard under "My Tickets". Each ticket has a QR code that operators scan at boarding. You can also access tickets directly at mojaride.com/tickets/[your-token].',
      },
      {
        q: "What happens at boarding?",
        a: "Show your QR code (on your phone or printed) to the operator at the terminal. They will scan it to check you in. Make sure to arrive at least 15 minutes before departure.",
      },
      {
        q: "Can I access my ticket offline?",
        a: "On the web app, you need an internet connection to access your ticket page. We recommend screenshotting your QR code before traveling to areas with poor connectivity. Offline access is coming to our mobile app.",
      },
    ],
  },
  {
    category: "Cancellations & Refunds",
    color: "bg-orange-50 text-orange-700",
    items: [
      {
        q: "What is the cancellation policy?",
        a: "You can cancel your ticket up to 15 minutes before departure on the website, app, by phone, or at a partner agency. Cancellations cannot be processed with the driver. Upon cancellation, you receive a non-refundable voucher valid for 12 months, calculated as the ticket price minus the applicable cancellation fee.",
      },
      {
        q: "How much will I get back if I cancel?",
        a: "The refund percentage depends on how early you cancel: 30+ days before departure → 100%; 7–29 days → 75%; 2–6 days → 50%; less than 2 days → 25%. Extras like seat reservations and additional luggage are refunded at 100%. The 500 FCFA service fee is non-refundable.",
      },
      {
        q: "How long do refunds take?",
        a: "Cancellation vouchers are issued immediately to your account and can be used for future bookings. If you are entitled to a monetary refund (e.g., due to a Moja Ride fault), processing takes 3–7 business days.",
      },
      {
        q: "Can I modify my ticket instead of cancelling?",
        a: "Yes. You can modify the traveler name, date, or time of your trip up to 15 minutes before departure via the website, app, phone, or partner agency. If the new journey costs more, you pay the difference. If it costs less, you receive a non-refundable 12-month voucher for the difference. A modification fee applies per trip per passenger (except phone number changes, which are free).",
      },
    ],
  },
  {
    category: "Vouchers & Promotions",
    color: "bg-pink-50 text-pink-700",
    items: [
      {
        q: "How do I use a voucher?",
        a: "You can apply a maximum of one voucher per booking, online or at a partner agency. Monetary vouchers can be applied to the entire cart. Discount or free-trip vouchers apply to the ticket price only — service fees and add-ons (luggage, bicycle) are not discounted.",
      },
      {
        q: "Do vouchers expire?",
        a: "Discount codes are valid for 3 months from issue. Cancellation vouchers are valid for 12 months. Vouchers issued free of charge for marketing purposes expire after the first completed booking.",
      },
      {
        q: "Can I use multiple vouchers on one booking?",
        a: "No. Only one voucher or discount code may be used per booking. During promotions, each person is limited to 3 promotional vouchers total.",
      },
      {
        q: "Can I sell or transfer my voucher?",
        a: "No. Commercial resale of vouchers is strictly prohibited and may result in ticket blocking and/or legal action. Personal vouchers are non-transferable. Cash refunds of vouchers are not possible.",
      },
    ],
  },
  {
    category: "Operators",
    color: "bg-teal-50 text-teal-700",
    items: [
      {
        q: "How do I become a bus operator on Moja Ride?",
        a: "Visit our operator onboarding page and complete the registration form. You'll need to provide your company details, business registration documents, and bank information. Our team reviews all applications and typically responds within 2–5 business days.",
      },
      {
        q: "How does the commission work for operators?",
        a: "Moja Ride charges a 5% platform commission on each completed booking. Operators receive 95% of the ticket price, minus any applicable payment gateway fees. Detailed earnings are available in the operator dashboard.",
      },
      {
        q: "Can price comparison platforms list Moja Ride fares?",
        a: "Yes, price comparison services may enter into a separate commercial agreement with Moja Ride authorizing them to receive, process, and publish Moja Ride prices and schedules. Please contact us at legal@mojaride.com for more information.",
      },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group border-b border-slate-100 last:border-0">
      <summary className="flex justify-between items-center py-5 cursor-pointer list-none gap-4">
        <span className="font-semibold text-slate-800 text-base">{q}</span>
        <ChevronDown className="h-5 w-5 text-slate-400 group-open:rotate-180 transition-transform shrink-0" />
      </summary>
      <div className="pb-5 text-slate-500 leading-relaxed text-sm pr-8">{a}</div>
    </details>
  );
}

export default function HelpPage() {
  return (
    <PublicPageShell
      title="Help Center"
      description="Quick answers to the most common questions about Moja Ride."
      badge="FAQ Center"
    >
      {/* Quick links menu */}
      <div className="max-w-3xl mx-auto px-6 md:px-8 pt-12 text-center">
        <div className="flex flex-wrap gap-3 justify-center bg-slate-50 border border-slate-100 p-4 rounded-3xl">
          {faqs.map((cat) => (
            <a
              key={cat.category}
              href={`#${cat.category.toLowerCase().replace(/\s+/g, "-")}`}
              className={`px-4 py-2 rounded-full text-xs font-extrabold tracking-wider uppercase transition-all hover:scale-105 border border-slate-200/40 shadow-sm ${cat.color}`}
            >
              {cat.category}
            </a>
          ))}
        </div>
      </div>

      {/* FAQ Sections */}
      <div className="max-w-3xl mx-auto px-6 md:px-8 py-16 space-y-16">
        {faqs.map((cat) => (
          <section
            key={cat.category}
            id={cat.category.toLowerCase().replace(/\s+/g, "-")}
          >
            <div className="flex items-center gap-3 mb-6">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${cat.color}`}>
                {cat.category}
              </span>
            </div>
            <div className="bg-white border border-slate-100 rounded-3xl px-6 divide-y divide-slate-100">
              {cat.items.map((item) => (
                <FAQItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Still need help CTA */}
      <div className="max-w-3xl mx-auto px-6 md:px-8 pb-24">
        <div className="bg-[#ee237c] rounded-3xl p-10 text-center text-white">
          <h2 className="text-2xl font-bold mb-3">Still have a question?</h2>
          <p className="text-white/80 mb-8">Our support team is available 24/7 to help you.</p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-white text-[#ee237c] px-8 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-all"
          >
            Contact us <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </PublicPageShell>
  );
}
