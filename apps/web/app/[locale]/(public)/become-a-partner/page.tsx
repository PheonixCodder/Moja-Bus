import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  ArrowRight,
  TrendingUp,
  Building2,
  Banknote,
  Users2,
  CheckCircle2,
  FileText,
  ShieldCheck,
  HelpCircle,
  Clock,
  Check,
  Zap,
} from "lucide-react";
import { PublicPageShell } from "@/features/home/components/public-page-shell";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "becomeAPartner" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
    },
  };
}

export default async function BecomeAPartnerPage() {
  const t = await getTranslations("becomeAPartner");

  const pillars = [
    {
      icon: TrendingUp,
      titleKey: "pillar1Title",
      descKey: "pillar1Desc",
      color: "bg-primary/10 text-primary border-primary/20",
    },
    {
      icon: Building2,
      titleKey: "pillar2Title",
      descKey: "pillar2Desc",
      color: "bg-info/10 text-info border-info/20",
    },
    {
      icon: Banknote,
      titleKey: "pillar3Title",
      descKey: "pillar3Desc",
      color: "bg-success/10 text-success border-success/20",
    },
    {
      icon: Users2,
      titleKey: "pillar4Title",
      descKey: "pillar4Desc",
      color: "bg-primary/10 text-primary border-primary/20",
    },
  ] as const;

  const steps = [
    {
      num: "01",
      icon: Building2,
      titleKey: "step1Title",
      descKey: "step1Desc",
    },
    { num: "02", icon: FileText, titleKey: "step2Title", descKey: "step2Desc" },
    { num: "03", icon: Banknote, titleKey: "step3Title", descKey: "step3Desc" },
    { num: "04", icon: Users2, titleKey: "step4Title", descKey: "step4Desc" },
    {
      num: "05",
      icon: ShieldCheck,
      titleKey: "step5Title",
      descKey: "step5Desc",
    },
  ] as const;

  const checklistKeys = [
    "check1",
    "check2",
    "check3",
    "check4",
    "check5",
  ] as const;

  const faqs = [
    { qKey: "faq1Q", aKey: "faq1A" },
    { qKey: "faq2Q", aKey: "faq2A" },
    { qKey: "faq3Q", aKey: "faq3A" },
    { qKey: "faq4Q", aKey: "faq4A" },
  ] as const;

  return (
    <PublicPageShell
      title={t("shellTitle")}
      description={t("shellDescription")}
      badge={t("shellBadge")}
    >
      {/* Hero Quick Trust & CTA Bar */}
      <div className="bg-card text-card-foreground border-b border-border py-10 px-6 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 w-full md:w-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground">
                {t("trustStat1")}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center text-info shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground">
                {t("trustStat2")}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center text-success shrink-0">
                <Building2 className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground">
                {t("trustStat3")}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center text-warning shrink-0">
                <Zap className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground">
                {t("trustStat4")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto justify-end">
            <a
              href="#checklist"
              className="px-5 py-3 rounded-xl border border-border text-muted-foreground font-semibold text-sm hover:bg-muted transition-all text-center"
            >
              {t("ctaSecondary")}
            </a>
            <Link
              href="/operator/login"
              className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-lg shadow-primary/20 hover:gap-3"
            >
              <span>{t("ctaPrimary")}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Core Pillars / Benefits Section */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 py-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-3.5 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest mb-4 border border-primary/20">
            {t("pillarsBadge")}
          </span>
          <h2
            className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {t("pillarsTitle")}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {pillars.map(({ icon: Icon, titleKey, descKey, color }) => (
            <div
              key={titleKey}
              className="bg-card rounded-3xl p-8 border border-border shadow-sm hover:shadow-md transition-all group"
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border ${color} group-hover:scale-105 transition-transform`}
              >
                <Icon className="h-7 w-7" />
              </div>
              <h3
                className="font-bold text-card-foreground text-xl mb-3"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {t(titleKey)}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t(descKey)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5-Step Onboarding Roadmap Section */}
      <section className="bg-muted/40 border-y border-border py-24 px-6 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-3.5 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest mb-4 border border-primary/20">
              {t("stepsBadge")}
            </span>
            <h2
              className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-4"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {t("stepsTitle")}
            </h2>
            <p className="text-muted-foreground text-base">{t("stepsDesc")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative">
            {steps.map(({ num, icon: Icon, titleKey, descKey }, idx) => (
              <div
                key={num}
                className="bg-card rounded-2xl p-6 border border-border shadow-sm flex flex-col justify-between relative"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-extrabold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                      {t("stepLabel", { num })}
                    </span>
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <h4
                    className="font-bold text-card-foreground text-base mb-2"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {t(titleKey)}
                  </h4>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {t(descKey)}
                  </p>
                </div>

                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                    <div className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground">
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preparation Checklist Section */}
      <section id="checklist" className="max-w-7xl mx-auto px-6 md:px-8 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5">
            <span className="inline-block px-3.5 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest mb-4 border border-primary/20">
              {t("checklistBadge")}
            </span>
            <h2
              className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-4"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {t("checklistTitle")}
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed mb-8">
              {t("checklistDesc")}
            </p>

            <Link
              href="/operator/login"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-4 rounded-2xl shadow-lg shadow-primary/20 transition-all hover:gap-3"
            >
              <span>{t("ctaPrimary")}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="lg:col-span-7 bg-foreground text-background rounded-3xl p-8 md:p-10 border border-border shadow-xl">
            <div className="space-y-4">
              {checklistKeys.map((key, idx) => (
                <div
                  key={key}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-background/10 border border-background/20"
                >
                  <div className="w-7 h-7 rounded-full bg-success/20 text-success flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs text-background/60 font-bold uppercase tracking-wider block mb-0.5">
                      {t("requirementLabel", { num: idx + 1 })}
                    </span>
                    <p className="text-background font-medium text-sm md:text-base">
                      {t(key)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-muted/40 border-t border-border py-24 px-6 md:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-3.5 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest mb-4 border border-primary/20">
              {t("faqBadge")}
            </span>
            <h2
              className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {t("faqTitle")}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map(({ qKey, aKey }) => (
              <div
                key={qKey}
                className="bg-card rounded-3xl p-8 border border-border shadow-sm"
              >
                <div className="flex items-start gap-3 mb-3">
                  <HelpCircle className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                  <h3
                    className="font-bold text-card-foreground text-lg"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {t(qKey)}
                  </h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed pl-9">
                  {t(aKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* High Impact Closing CTA Banner */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 py-24">
        <div className="relative bg-foreground rounded-3xl p-10 md:p-16 text-background overflow-hidden border border-border shadow-2xl">
          {/* Ambient Primary Glow */}
          <div className="absolute top-1/2 right-10 -translate-y-1/2 w-96 h-96 bg-primary rounded-full blur-[130px] opacity-20 pointer-events-none" />

          <div className="relative z-10 max-w-3xl">
            <span className="inline-block px-3.5 py-1.5 bg-primary/20 text-primary rounded-full text-xs font-bold uppercase tracking-widest mb-4 border border-primary/30">
              Moja Ride Network
            </span>
            <h2
              className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {t("closingTitle")}
            </h2>
            <p className="text-background/80 text-base md:text-lg mb-8 leading-relaxed">
              {t("closingDesc")}
            </p>

            <Link
              href="/operator/login"
              className="inline-flex items-center gap-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-4 rounded-2xl text-base shadow-xl shadow-primary/30 transition-all hover:gap-4"
            >
              <span>{t("closingButton")}</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </PublicPageShell>
  );
}
