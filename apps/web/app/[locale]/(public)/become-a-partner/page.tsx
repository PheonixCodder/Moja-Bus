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
      color: "bg-pink-50 text-[#ee237c] border-pink-100",
    },
    {
      icon: Building2,
      titleKey: "pillar2Title",
      descKey: "pillar2Desc",
      color: "bg-blue-50 text-blue-600 border-blue-100",
    },
    {
      icon: Banknote,
      titleKey: "pillar3Title",
      descKey: "pillar3Desc",
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
    },
    {
      icon: Users2,
      titleKey: "pillar4Title",
      descKey: "pillar4Desc",
      color: "bg-purple-50 text-purple-600 border-purple-100",
    },
  ] as const;

  const steps = [
    { num: "01", icon: Building2, titleKey: "step1Title", descKey: "step1Desc" },
    { num: "02", icon: FileText, titleKey: "step2Title", descKey: "step2Desc" },
    { num: "03", icon: Banknote, titleKey: "step3Title", descKey: "step3Desc" },
    { num: "04", icon: Users2, titleKey: "step4Title", descKey: "step4Desc" },
    { num: "05", icon: ShieldCheck, titleKey: "step5Title", descKey: "step5Desc" },
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
      <div className="bg-slate-900 text-white border-b border-slate-800 py-10 px-6 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 w-full md:w-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#ee237c]/20 flex items-center justify-center text-[#ee237c] shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-slate-300">
                {t("trustStat1")}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-slate-300">
                {t("trustStat2")}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Building2 className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-slate-300">
                {t("trustStat3")}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Zap className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-slate-300">
                {t("trustStat4")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto justify-end">
            <a
              href="#checklist"
              className="px-5 py-3 rounded-xl border border-slate-700 text-slate-300 font-semibold text-sm hover:bg-slate-800 transition-all text-center"
            >
              {t("ctaSecondary")}
            </a>
            <Link
              href="/operator/login"
              className="flex items-center justify-center gap-2 bg-[#ee237c] hover:bg-[#d01867] text-white font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-lg shadow-[#ee237c]/20 hover:gap-3"
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
          <span className="inline-block px-3.5 py-1.5 bg-[#ee237c]/10 text-[#ee237c] rounded-full text-xs font-bold uppercase tracking-widest mb-4 border border-[#ee237c]/20">
            {t("pillarsBadge")}
          </span>
          <h2
            className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            {t("pillarsTitle")}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {pillars.map(({ icon: Icon, titleKey, descKey, color }) => (
            <div
              key={titleKey}
              className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition-all group"
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border ${color} group-hover:scale-105 transition-transform`}
              >
                <Icon className="h-7 w-7" />
              </div>
              <h3
                className="font-bold text-slate-900 text-xl mb-3"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                {t(titleKey)}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                {t(descKey)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5-Step Onboarding Roadmap Section */}
      <section className="bg-slate-50 border-y border-slate-100 py-24 px-6 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-3.5 py-1.5 bg-[#ee237c]/10 text-[#ee237c] rounded-full text-xs font-bold uppercase tracking-widest mb-4 border border-[#ee237c]/20">
              {t("stepsBadge")}
            </span>
            <h2
              className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              {t("stepsTitle")}
            </h2>
            <p className="text-slate-500 text-base">{t("stepsDesc")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative">
            {steps.map(({ num, icon: Icon, titleKey, descKey }, idx) => (
              <div
                key={num}
                className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between relative"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-extrabold text-[#ee237c] bg-pink-50 px-2.5 py-1 rounded-lg">
                      {t("stepLabel", { num })}
                    </span>
                    <Icon className="h-5 w-5 text-slate-400" />
                  </div>
                  <h4
                    className="font-bold text-slate-900 text-base mb-2"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                  >
                    {t(titleKey)}
                  </h4>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    {t(descKey)}
                  </p>
                </div>

                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                    <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
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
            <span className="inline-block px-3.5 py-1.5 bg-[#ee237c]/10 text-[#ee237c] rounded-full text-xs font-bold uppercase tracking-widest mb-4 border border-[#ee237c]/20">
              {t("checklistBadge")}
            </span>
            <h2
              className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              {t("checklistTitle")}
            </h2>
            <p className="text-slate-500 text-base leading-relaxed mb-8">
              {t("checklistDesc")}
            </p>

            <Link
              href="/operator/login"
              className="inline-flex items-center gap-2 bg-[#ee237c] hover:bg-[#d01867] text-white font-bold px-8 py-4 rounded-2xl shadow-lg shadow-[#ee237c]/20 transition-all hover:gap-3"
            >
              <span>{t("ctaPrimary")}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="lg:col-span-7 bg-slate-900 text-white rounded-3xl p-8 md:p-10 border border-slate-800 shadow-xl">
            <div className="space-y-4">
              {checklistKeys.map((key, idx) => (
                <div
                  key={key}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50"
                >
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-0.5">
                      {t("requirementLabel", { num: idx + 1 })}
                    </span>
                    <p className="text-slate-200 font-medium text-sm md:text-base">
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
      <section className="bg-slate-50 border-t border-slate-100 py-24 px-6 md:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-3.5 py-1.5 bg-[#ee237c]/10 text-[#ee237c] rounded-full text-xs font-bold uppercase tracking-widest mb-4 border border-[#ee237c]/20">
              {t("faqBadge")}
            </span>
            <h2
              className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              {t("faqTitle")}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map(({ qKey, aKey }) => (
              <div
                key={qKey}
                className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm"
              >
                <div className="flex items-start gap-3 mb-3">
                  <HelpCircle className="h-6 w-6 text-[#ee237c] shrink-0 mt-0.5" />
                  <h3
                    className="font-bold text-slate-900 text-lg"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                  >
                    {t(qKey)}
                  </h3>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed pl-9">
                  {t(aKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* High Impact Closing CTA Banner */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 py-24">
        <div className="relative bg-slate-950 rounded-3xl p-10 md:p-16 text-white overflow-hidden border border-slate-800 shadow-2xl">
          {/* Ambient Pink Glow */}
          <div className="absolute top-1/2 right-10 -translate-y-1/2 w-96 h-96 bg-[#ee237c] rounded-full blur-[130px] opacity-20 pointer-events-none" />

          <div className="relative z-10 max-w-3xl">
            <span className="inline-block px-3.5 py-1.5 bg-[#ee237c]/20 text-[#ee237c] rounded-full text-xs font-bold uppercase tracking-widest mb-4 border border-[#ee237c]/30">
              Moja Ride Network
            </span>
            <h2
              className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              {t("closingTitle")}
            </h2>
            <p className="text-slate-400 text-base md:text-lg mb-8 leading-relaxed">
              {t("closingDesc")}
            </p>

            <Link
              href="/operator/login"
              className="inline-flex items-center gap-3 bg-[#ee237c] hover:bg-[#d01867] text-white font-bold px-8 py-4 rounded-2xl text-base shadow-xl shadow-[#ee237c]/30 transition-all hover:gap-4"
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
