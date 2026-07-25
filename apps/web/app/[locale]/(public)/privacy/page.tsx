import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PublicPageShell } from "@/features/home/components/public-page-shell";
import { getPrivacyContent, getPrivacyToc } from "@/features/home/data/privacy";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });
  return {
    title: t("pageTitle"),
    description: t("pageDesc"),
  };
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });
  const data = getPrivacyContent(locale);
  const toc = getPrivacyToc(locale);

  return (
    <PublicPageShell
      title={t("pageTitle")}
      description={t("pageDesc")}
      badge={t("badge")}
    >
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-16">
        <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-16 relative">

          {/* Sticky sidebar TOC */}
          <aside className="hidden lg:block">
            <div className="sticky top-8">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
                {t("tocTitle")}
              </p>
              <nav className="space-y-1">
                {toc.map((s) => (
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
                <p className="text-xs font-semibold text-slate-600 mb-1">{t("dataProtection")}</p>
                <a
                  href={`mailto:${t("dpEmail")}`}
                  className="text-xs text-[#ee237c] font-semibold hover:underline"
                >
                  {t("dpEmail")}
                </a>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <div className="space-y-14 text-slate-600 leading-relaxed text-sm min-w-0">

            {/* Preamble */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
              <p className="font-semibold text-slate-800 mb-2">{data.preamble.heading}</p>
              {data.preamble.paragraphs.map((p, i) => (
                <p key={i} className={i > 0 ? "mt-3" : ""}>{p}</p>
              ))}
            </div>

            {/* Section 1 heading */}
            <section id="general" className="scroll-mt-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-50 text-[#ee237c] flex items-center justify-center text-xs font-extrabold">1</span>
                {toc.find((s) => s.id === "general")?.title ?? ""}
              </h2>
            </section>

            {/* Dynamic sections */}
            {data.items.map((item) => (
              <section key={item.id} id={item.id} className="scroll-mt-8">
                {/* Legal list (definitions / legal basis) */}
                {item.legalList && (
                  <>
                    {item.sections.map((sec, si) => (
                      <div key={si}>
                        {sec.heading && (
                          <h3 className="text-base font-bold text-slate-800 mb-3">{sec.heading}</h3>
                        )}
                        {sec.body.map((p, pi) => (
                          <p key={pi} className={pi > 0 ? "mt-3" : "mb-3"}>{p}</p>
                        ))}
                      </div>
                    ))}
                    <ul className="space-y-3 list-none pl-0">
                      {item.legalList.map(({ term, def }) => (
                        <li key={term} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                          <p className="font-semibold text-slate-800 mb-1">{term}</p>
                          <p dangerouslySetInnerHTML={{ __html: def }} />
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {/* Address box (controller / dpo) */}
                {item.addressBox && (
                  <>
                    {item.sections.map((sec, si) => (
                      <div key={si}>
                        {sec.heading && (
                          <h3 className="text-base font-bold text-slate-800 mb-3">{sec.heading}</h3>
                        )}
                        {sec.body.map((p, pi) => (
                          <p key={pi} className={pi > 0 ? "mt-3" : "mb-3"}>{p}</p>
                        ))}
                      </div>
                    ))}
                    {item.addressBox.name && (
                      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 mt-3">
                        <p className="font-semibold text-slate-800">{item.addressBox.name}</p>
                        <p className="text-slate-500 mt-1">{item.addressBox.address}</p>
                        <a href={`mailto:${item.addressBox.email}`} className="mt-2 inline-block text-[#ee237c] font-semibold hover:underline">{item.addressBox.email}</a>
                      </div>
                    )}
                    {!item.addressBox.name && (
                      <div className="mt-3 bg-slate-50 rounded-2xl p-5 border border-slate-100">
                        <a href={`mailto:${item.addressBox.email}`} className="text-[#ee237c] font-semibold hover:underline">{item.addressBox.email}</a>
                      </div>
                    )}
                  </>
                )}

                {/* Legal basis list */}
                {!item.legalList && !item.addressBox && !item.rightsList && !item.processorBox && (
                  <>
                    {item.sections.map((sec, si) => (
                      <div key={si}>
                        {sec.heading && (
                          <h3 className="text-base font-bold text-slate-800 mb-3">{sec.heading}</h3>
                        )}
                        {sec.body.map((p, pi) => (
                          <p key={pi} className={pi > 0 ? "mt-3" : "mb-3"}>{p}</p>
                        ))}
                        {sec.list && (
                          <ul className="list-disc pl-5 space-y-1">
                            {sec.list.map((li, liIdx) => (
                              <li key={liIdx}>{li}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </>
                )}

                {/* Rights list */}
                {item.rightsList && (
                  <>
                    {item.sections.map((sec, si) => (
                      <div key={si}>
                        {sec.heading && (
                          <h3 className="text-base font-bold text-slate-800 mb-4">{sec.heading}</h3>
                        )}
                        {sec.body.map((p, pi) => (
                          <p key={pi} className={pi > 0 ? "mt-3" : "mb-4"}>{p}</p>
                        ))}
                      </div>
                    ))}
                    <div className="space-y-3">
                      {item.rightsList.map(({ right, desc }) => (
                        <div key={right} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                          <p className="font-semibold text-slate-800 mb-1">{right}</p>
                          <p>{desc}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Special section with subsections */}
                {!item.legalList && !item.addressBox && !item.rightsList && item.sections.length > 0 && item.id === "special" && (
                  <>
                    <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-50 text-[#ee237c] flex items-center justify-center text-xs font-extrabold">2</span>
                      {toc.find((s) => s.id === "special")?.title ?? ""}
                    </h2>
                    <div className="space-y-8">
                      <div>
                        {item.sections.map((sec, si) => (
                          <div key={si}>
                            {sec.heading && (
                              ["2.1.1", "2.1.2", "2.1.3"].some((h) => sec.heading.startsWith(h))
                                ? <h4 key={si} className="font-semibold text-slate-700 mt-5 mb-2">{sec.heading}</h4>
                                : sec.heading.startsWith("2.1")
                                  ? <h3 className="text-base font-bold text-slate-800 mb-3">{sec.heading}</h3>
                                  : si > 0 && sec.heading
                                    ? <h4 className="font-semibold text-slate-700 mt-5 mb-2">{sec.heading}</h4>
                                    : null
                            )}
                            {sec.body.map((p, pi) => (
                              <p key={pi} className={pi > 0 ? "mt-3" : si > 0 ? "mt-3" : "mb-2"}>{p}</p>
                            ))}
                            {sec.list && (
                              <ul className="list-disc pl-5 space-y-1 mb-3">
                                {sec.list.map((li, liIdx) => (
                                  <li key={liIdx}>{li}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                        {item.processorBox && (
                          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 mt-4">
                            <p className="font-semibold text-slate-800 mb-2">{item.processorBox.title}</p>
                            <p className="mb-2">{item.processorBox.body}</p>
                            <ul className="space-y-2">
                              {item.processorBox.processors.map((proc) => (
                                <li key={proc.name}>
                                  <strong className="text-slate-700">{proc.name}</strong><br />
                                  <span className="text-slate-500 text-xs">{proc.address}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </section>
            ))}
          </div>
        </div>
      </div>
    </PublicPageShell>
  );
}
