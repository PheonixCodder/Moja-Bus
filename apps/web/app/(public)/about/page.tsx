import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Shield, Heart, Zap } from "lucide-react";
import { PublicPageShell } from "@/features/home/components/public-page-shell";

export const metadata: Metadata = {
  title: "About Us — Moja Ride",
  description:
    "Learn about Moja Ride — the premium intercity bus marketplace connecting passengers and operators across Côte d'Ivoire.",
};

const stats = [
  { value: "35+", label: "Cities served" },
  { value: "50k+", label: "Passengers" },
  { value: "100+", label: "Buses in network" },
  { value: "500+", label: "Daily departures" },
];

const values = [
  {
    icon: Shield,
    title: "Safety First",
    description:
      "Every operator on Moja Ride is verified and must meet strict safety and insurance standards before serving passengers.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Heart,
    title: "Comfort & Dignity",
    description:
      "We believe every traveler deserves a comfortable, stress-free journey — from booking to arrival.",
    color: "bg-pink-50 text-[#ee237c]",
  },
  {
    icon: Zap,
    title: "Transparent Pricing",
    description:
      "No hidden fees. The price you see is the price you pay. Our commission model ensures fair deals for passengers and operators.",
    color: "bg-amber-50 text-amber-600",
  },
];

export default function AboutPage() {
  return (
    <PublicPageShell
      title="Connecting Côte d'Ivoire, One Journey at a Time"
      description="Moja Ride was born from a simple belief: traveling between cities in Côte d'Ivoire should be easy, safe, and dignified. We built the platform to give passengers real choice and to help bus operators reach more customers."
      badge="Our Story"
    >

      {/* Stats */}
      <div className="bg-[#ee237c] px-6 md:px-8 py-14">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center text-white">
              <p
                className="font-bold mb-1"
                style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontFamily: "Montserrat, sans-serif" }}
              >
                {value}
              </p>
              <p className="text-white/70 text-sm font-medium">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mission */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h2
              className="text-slate-900 mb-6"
              style={{
                fontFamily: "Montserrat, sans-serif",
                fontSize: "clamp(1.5rem, 3vw, 2rem)",
                fontWeight: 700,
              }}
            >
              Our Mission
            </h2>
            <p className="text-slate-500 leading-relaxed text-lg mb-6">
              To become the most trusted intercity transport marketplace in West Africa — making
              bus travel as simple and accessible as booking a taxi, while giving operators the
              tools to run better businesses.
            </p>
            <p className="text-slate-500 leading-relaxed">
              We&apos;re starting in Côte d&apos;Ivoire and will expand across the region as we grow.
              Every decision we make is guided by one question:{" "}
              <em>&ldquo;Does this make the journey better?&rdquo;</em>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { n: "2024", label: "Year founded", color: "bg-[#ee237c]/10" },
              { n: "Abidjan", label: "Headquarters", color: "bg-slate-100" },
              { n: "CI", label: "First market", color: "bg-slate-100" },
              { n: "B2B2C", label: "Business model", color: "bg-[#ee237c]/10" },
            ].map(({ n, label, color }) => (
              <div key={label} className={`${color} rounded-3xl p-6`}>
                <p className="text-2xl font-bold text-slate-900 mb-1">{n}</p>
                <p className="text-slate-500 text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="bg-slate-50 px-6 md:px-8 py-24">
        <div className="max-w-7xl mx-auto">
          <h2
            className="text-slate-900 text-center mb-16"
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontSize: "clamp(1.5rem, 3vw, 2rem)",
              fontWeight: 700,
            }}
          >
            What we stand for
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map(({ icon: Icon, title, description, color }) => (
              <div key={title} className="bg-white rounded-3xl p-8 border border-slate-100">
                <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center mb-6`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-xl mb-3">{title}</h3>
                <p className="text-slate-500 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#ee237c] rounded-3xl p-10 text-white">
            <h3 className="text-2xl font-bold mb-3">Ready to travel?</h3>
            <p className="text-white/80 mb-8">
              Search hundreds of routes and book your next trip in minutes.
            </p>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 bg-white text-[#ee237c] px-6 py-3 rounded-2xl font-bold hover:bg-slate-50 transition-all"
            >
              Search buses <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="bg-slate-900 rounded-3xl p-10 text-white">
            <h3 className="text-2xl font-bold mb-3">Are you an operator?</h3>
            <p className="text-slate-300 mb-8">
              Join our network and reach thousands of new passengers.
            </p>
            <Link
              href="/dashboard/operator/onboarding"
              className="inline-flex items-center gap-2 bg-[#ee237c] text-white px-6 py-3 rounded-2xl font-bold hover:bg-[#d01867] transition-all"
            >
              Become a partner <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </PublicPageShell>
  );
}
