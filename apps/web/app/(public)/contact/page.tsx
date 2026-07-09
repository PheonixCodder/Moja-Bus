import type { Metadata } from "next";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { ContactForm } from "@/features/contact/components/contact-form";
import { PublicPageShell } from "@/features/home/components/public-page-shell";

export const metadata: Metadata = {
  title: "Contact Us — Moja Ride",
  description:
    "Get in touch with the Moja Ride team. We're available 24/7 to answer your questions.",
};

const contactInfo = [
  {
    icon: Phone,
    title: "Phone",
    lines: ["+225 07 00 00 00 00", "Mon – Sun · 24/7"],
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Mail,
    title: "Email",
    lines: ["support@mojaride.com", "We reply within 4 hours"],
    color: "bg-[#ee237c]/10 text-[#ee237c]",
  },
  {
    icon: MapPin,
    title: "Office",
    lines: ["Plateau, Abidjan", "Côte d'Ivoire"],
    color: "bg-green-50 text-green-600",
  },
  {
    icon: Clock,
    title: "Support Hours",
    lines: ["Available 24/7", "Response time < 4 hrs"],
    color: "bg-amber-50 text-amber-600",
  },
];

export default function ContactPage() {
  return (
    <PublicPageShell
      title="We're Here to Help"
      description="Have a question, feedback, or a partnership inquiry? We'd love to hear from you."
      badge="Get in Touch"
    >

      {/* Contact info cards */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {contactInfo.map(({ icon: Icon, title, lines, color }) => (
            <div
              key={title}
              className="bg-white border border-slate-100 rounded-3xl p-6 hover:shadow-md transition-all"
            >
              <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center mb-5`}>
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
              {lines.map((line, i) => (
                <p
                  key={i}
                  className={`text-sm ${i === 0 ? "font-semibold text-slate-700" : "text-slate-400"}`}
                >
                  {line}
                </p>
              ))}
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div>
            <h2
              className="text-slate-900 mb-4"
              style={{
                fontFamily: "Montserrat, sans-serif",
                fontSize: "clamp(1.5rem, 3vw, 2rem)",
                fontWeight: 700,
              }}
            >
              Send us a message
            </h2>
            <p className="text-slate-500 mb-8">
              Fill out the form and our team will get back to you within a few hours.
            </p>
            <ContactForm />
          </div>

          {/* What to expect */}
          <div className="bg-slate-50 rounded-3xl p-8">
            <h3 className="font-bold text-slate-900 text-lg mb-6">What to expect</h3>
            <div className="space-y-5">
              {[
                {
                  step: "1",
                  title: "Submit your message",
                  description: "Fill out the form with your question or feedback.",
                },
                {
                  step: "2",
                  title: "We receive it instantly",
                  description: "Your message goes directly to our support team.",
                },
                {
                  step: "3",
                  title: "We reply within 4 hours",
                  description:
                    "You'll receive a response at your email address. Complex issues may take a bit longer.",
                },
              ].map(({ step, title, description }) => (
                <div key={step} className="flex gap-4">
                  <div className="w-8 h-8 bg-[#ee237c] text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                    {step}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 mb-1">{title}</p>
                    <p className="text-slate-500 text-sm">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PublicPageShell>
  );
}
