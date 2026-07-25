import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ChevronDown, ArrowRight } from "lucide-react";
import { PublicPageShell } from "@/features/home/components/public-page-shell";
import { getFaq } from "@/features/home/data/faq";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "help" });
  return {
    title: t("pageTitle"),
    description: t("pageDesc"),
  };
}
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

export default async function HelpPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "help" });
  const faqs = getFaq(locale);
  return (
    <PublicPageShell
      title={t("pageTitle")}
      description={t("pageDesc")}
      badge={t("badge")}
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
          <h2 className="text-2xl font-bold mb-3">{t("ctaTitle")}</h2>
          <p className="text-white/80 mb-8">{t("ctaDesc")}</p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-white text-[#ee237c] px-8 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-all"
          >
            {t("ctaButton")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </PublicPageShell>
  );
}
