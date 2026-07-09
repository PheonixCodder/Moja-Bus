import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, Search, ArrowRight } from "lucide-react";
import { PublicPageShell } from "@/features/home/components/public-page-shell";

export const metadata: Metadata = {
  title: "Help Center — Moja Ride",
  description:
    "Find answers to your questions about booking, payment, tickets, and more on Moja Ride.",
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
        a: "We currently accept card payments (Visa, Mastercard) and Mobile Money (MTN MoMo, Orange Money, Wave) via Paystack. All transactions are secured with industry-standard encryption.",
      },
      {
        q: "Is my payment information secure?",
        a: "Absolutely. Moja Ride never stores your card or Mobile Money credentials. All payments are processed by Paystack, a PCI-DSS Level 1 certified payment processor. We use HTTPS everywhere and your data is always encrypted.",
      },
      {
        q: "What currency are prices shown in?",
        a: "All prices are displayed in West African CFA Franc (FCFA / XOF), the official currency of Côte d'Ivoire.",
      },
      {
        q: "Is there a booking fee?",
        a: "A small service convenience fee (2.5% of the ticket price) is added at checkout. This fee helps us operate the platform and provide 24/7 support. The final price is always shown before you confirm payment.",
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
        a: "Cancellation policies vary by operator. Generally, cancellations made more than 24 hours before departure may be eligible for a partial refund. Check the operator's policy on your booking confirmation. You can initiate a cancellation from your dashboard.",
      },
      {
        q: "How long do refunds take?",
        a: "Refunds are processed within 3–5 business days to your original payment method. Mobile Money refunds are typically faster (1–2 days).",
      },
    ],
  },
  {
    category: "Operators",
    color: "bg-pink-50 text-pink-700",
    items: [
      {
        q: "How do I become a bus operator on Moja Ride?",
        a: "Visit our operator onboarding page and complete the registration form. You'll need to provide your company details, business registration documents, and bank information. Our team reviews all applications and typically responds within 2–5 business days.",
      },
      {
        q: "How does the commission work for operators?",
        a: "Moja Ride charges a 5% platform commission on each completed booking. Operators receive 95% of the ticket price, minus any applicable payment gateway fees. Detailed earnings are available in the operator dashboard.",
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
