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
  { icon: Shield, key: 1, color: "bg-info/10 text-info" },
  { icon: Heart, key: 2, color: "bg-primary/10 text-primary" },
  { icon: Zap, key: 3, color: "bg-warning/10 text-warning" },
] as const;

const facts = [
  { n: "2024", key: "Year", color: "bg-primary/10" },
  { n: "Abidjan", key: "Hq", color: "bg-muted" },
  { n: "CI", key: "Market", color: "bg-muted" },
  { n: "B2B2C", key: "Model", color: "bg-primary/10" },
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
      <div className="bg-primary px-6 md:px-8 py-14">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {statKeys.map((key, i) => (
            <div key={key} className="text-center text-white">
              <p
                className="font-bold mb-1"
                style={{
                  fontSize: "clamp(2rem, 4vw, 3rem)",
                  fontFamily: "Montserrat, sans-serif",
                }}
              >
                {["35+", "50k+", "100+", "500+"][i]}
              </p>
              <p className="text-white/70 text-sm font-medium">
                {t(`stat${key}`)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Mission */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h2
              className="text-foreground mb-6"
              style={{
                fontFamily: "Montserrat, sans-serif",
                fontSize: "clamp(1.5rem, 3vw, 2rem)",
                fontWeight: 700,
              }}
            >
              {t("missionTitle")}
            </h2>
            <p className="text-muted-foreground leading-relaxed text-lg mb-6">
              {t("missionBody1")}
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {t.rich("missionBody2", { em: (chunks) => <em>{chunks}</em> })}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {facts.map(({ n, key, color }) => (
              <div key={key} className={`${color} rounded-3xl p-6`}>
                <p className="text-2xl font-bold text-foreground mb-1">{n}</p>
                <p className="text-muted-foreground text-sm">{t(`fact${key}`)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="bg-muted/40 px-6 md:px-8 py-24">
        <div className="max-w-7xl mx-auto">
          <h2
            className="text-foreground text-center mb-16"
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
              <div
                key={key}
                className="bg-card rounded-3xl p-8 border border-border"
              >
                <div
                  className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center mb-6`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-card-foreground text-xl mb-3">
                  {t(`value${key}Title`)}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t(`value${key}Desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-primary rounded-3xl p-10 text-primary-foreground">
            <h3 className="text-2xl font-bold mb-3">{t("cta1Title")}</h3>
            <p className="text-primary-foreground/80 mb-8">{t("cta1Desc")}</p>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 bg-background text-primary px-6 py-3 rounded-2xl font-bold hover:bg-muted transition-all shadow-sm"
            >
              {t("cta1Button")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="bg-foreground rounded-3xl p-10 text-background">
            <h3 className="text-2xl font-bold mb-3">{t("cta2Title")}</h3>
            <p className="text-background/80 mb-8">{t("cta2Desc")}</p>
            <Link
              href="/become-a-partner"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-sm"
            >
              {t("cta2Button")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </PublicPageShell>
  );
}
