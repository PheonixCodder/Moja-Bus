import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ArrowRight, Shield, Heart, Zap } from "lucide-react";
import { PublicPageShell } from "@/features/home/components/public-page-shell";

export const metadata: Metadata = {
  title: "About Us — Moja Ride",
  description:
    "Learn about Moja Ride — the premium intercity bus marketplace connecting passengers and operators across Côte d'Ivoire.",
};

const statKeys = ["Cities", "Passengers", "Buses", "Departures"] as const;

const values = [
  { icon: Shield, key: 1, color: "bg-blue-50 text-blue-600" },
  { icon: Heart, key: 2, color: "bg-pink-50 text-[#ee237c]" },
  { icon: Zap, key: 3, color: "bg-amber-50 text-amber-600" },
] as const;

const facts = [
  { n: "2024", key: "Year", color: "bg-[#ee237c]/10" },
  { n: "Abidjan", key: "Hq", color: "bg-slate-100" },
  { n: "CI", key: "Market", color: "bg-slate-100" },
  { n: "B2B2C", key: "Model", color: "bg-[#ee237c]/10" },
] as const;

export default async function AboutPage() {
  const t = await getTranslations("about");

  return (
    <PublicPageShell
      title={t("shellTitle")}
      description={t("shellDescription")}
      badge={t("shellBadge")}
    >

      {/* Stats */}
      <div className="bg-[#ee237c] px-6 md:px-8 py-14">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {statKeys.map((key, i) => (
            <div key={key} className="text-center text-white">
              <p
                className="font-bold mb-1"
                style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontFamily: "Montserrat, sans-serif" }}
              >
                {["35+", "50k+", "100+", "500+"][i]}
              </p>
              <p className="text-white/70 text-sm font-medium">{t(`stat${key}`)}</p>
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
              {t("missionTitle")}
            </h2>
            <p className="text-slate-500 leading-relaxed text-lg mb-6">
              {t("missionBody1")}
            </p>
            <p className="text-slate-500 leading-relaxed">
              {t.rich("missionBody2", { em: (chunks) => <em>{chunks}</em> })}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {facts.map(({ n, key, color }) => (
              <div key={key} className={`${color} rounded-3xl p-6`}>
                <p className="text-2xl font-bold text-slate-900 mb-1">{n}</p>
                <p className="text-slate-500 text-sm">{t(`fact${key}`)}</p>
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
            {t("valuesTitle")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map(({ icon: Icon, key, color }) => (
              <div key={key} className="bg-white rounded-3xl p-8 border border-slate-100">
                <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center mb-6`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-xl mb-3">{t(`value${key}Title`)}</h3>
                <p className="text-slate-500 leading-relaxed">{t(`value${key}Desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#ee237c] rounded-3xl p-10 text-white">
            <h3 className="text-2xl font-bold mb-3">{t("cta1Title")}</h3>
            <p className="text-white/80 mb-8">
              {t("cta1Desc")}
            </p>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 bg-white text-[#ee237c] px-6 py-3 rounded-2xl font-bold hover:bg-slate-50 transition-all"
            >
              {t("cta1Button")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="bg-slate-900 rounded-3xl p-10 text-white">
            <h3 className="text-2xl font-bold mb-3">{t("cta2Title")}</h3>
            <p className="text-slate-300 mb-8">
              {t("cta2Desc")}
            </p>
            <Link
              href="/become-a-partner"
              className="inline-flex items-center gap-2 bg-[#ee237c] text-white px-6 py-3 rounded-2xl font-bold hover:bg-[#d01867] transition-all"
            >
              {t("cta2Button")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </PublicPageShell>
  );
}
