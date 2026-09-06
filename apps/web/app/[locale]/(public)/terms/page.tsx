import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PublicPageShell } from "@/features/home/components/public-page-shell";
import { getTermsContent, getTermsToc } from "@/features/home/data/terms";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "terms" });
  return {
    title: t("pageTitle"),
    description: t("pageDesc"),
  };
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "terms" });
  const data = getTermsContent(locale);
  const toc = getTermsToc(locale);

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
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
                {t("tocTitle")}
              </p>
              <nav className="space-y-1">
                {toc.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="block text-sm text-muted-foreground hover:text-primary py-1.5 px-3 rounded-lg hover:bg-primary/10 transition-all leading-snug"
                  >
                    {s.title}
                  </a>
                ))}
              </nav>
              <div className="mt-8 p-4 bg-muted/40 rounded-2xl border border-border">
                <p className="text-xs font-semibold text-foreground mb-1">
                  {t("questions")}
                </p>
                <a
                  href={`mailto:${t("legalEmail")}`}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  {t("legalEmail")}
                </a>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <div className="space-y-14 text-foreground/80 leading-relaxed text-sm min-w-0">
            {data.items.map((item) => (
              <section key={item.id} id={item.id} className="scroll-mt-8">
                {/* Heading with optional number badge */}
                {item.id !== "cancellation-policy" && item.id !== "contact" && (
                  <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-3">
                    {item.number && (
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-extrabold">
                        {item.number}
                      </span>
                    )}
                    {item.title}
                  </h2>
                )}

                {/* Simple paragraphs */}
                {item.paragraphs && !item.subsections && !item.noteBox && (
                  <div className="space-y-3">
                    {item.paragraphs.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                )}

                {/* Subsections with body and lists */}
                {item.subsections && (
                  <div
                    className={
                      item.id === "payment" ? "space-y-6" : "space-y-4"
                    }
                  >
                    {item.subsections.map((sub, si) => (
                      <div key={si}>
                        {sub.heading && (
                          <p className="font-semibold text-foreground mb-2">
                            {sub.heading}
                          </p>
                        )}
                        {sub.body?.map((p, pi) => (
                          <p
                            key={pi}
                            className={
                              pi > 0 && si > 0
                                ? "mt-3"
                                : item.id === "cancellation-modification" &&
                                    pi > 0
                                  ? "mt-3"
                                  : "mb-2"
                            }
                          >
                            {p}
                          </p>
                        ))}
                        {sub.lists?.map((list, liIdx) => (
                          <ul key={liIdx} className="list-disc pl-5 space-y-1">
                            {list.items.map((li, ii) => (
                              <li key={ii}>{li}</li>
                            ))}
                          </ul>
                        ))}
                      </div>
                    ))}
                    {item.id === "cancellation-modification" &&
                      item.paragraphs && (
                        <div className="space-y-3">
                          {item.paragraphs.map((p, i) => (
                            <p key={i}>{p}</p>
                          ))}
                        </div>
                      )}
                  </div>
                )}

                {/* Note box (service-fees, cancellation-policy) */}
                {item.noteBox && (
                  <div
                    className={
                      item.id === "cancellation-policy"
                        ? "bg-muted/40 border border-border rounded-2xl p-5 mb-6 text-foreground/80 text-sm space-y-3"
                        : "bg-primary/10 border border-primary/20 rounded-2xl p-5 mb-4"
                    }
                  >
                    {item.noteBox.paragraphs.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                )}

                {/* Additional paragraphs after note box */}
                {item.id === "service-fees" && item.paragraphs && (
                  <>
                    {item.paragraphs.map((p, i) => (
                      <p key={i} className={i > 0 ? "mt-2" : ""}>
                        {p}
                      </p>
                    ))}
                  </>
                )}

                {/* Subsection for cancellation-policy */}
                {item.id === "cancellation-policy" && item.subsections && (
                  <>
                    {item.subsections.map((sub, si) => (
                      <div key={si}>
                        {sub.body?.map((p, pi) => (
                          <p key={pi} className="text-xs text-muted-foreground mb-6">
                            {p}
                          </p>
                        ))}
                      </div>
                    ))}
                  </>
                )}

                {/* Refund table */}
                {item.table && (
                  <>
                    <div className="rounded-2xl overflow-hidden border border-border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-foreground text-background">
                            <th className="text-left px-5 py-3 font-semibold">
                              {item.table.headers[0]}
                            </th>
                            <th className="text-right px-5 py-3 font-semibold">
                              {item.table.headers[1]}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {item.table.rows.map((row, i) => (
                            <tr
                              key={row[0]}
                              className={
                                i % 2 === 0 ? "bg-card" : "bg-muted/40"
                              }
                            >
                              <td className="px-5 py-3 text-foreground">
                                {row[0]}
                              </td>
                              <td
                                className={`px-5 py-3 text-right font-bold ${item.table?.refundColor ?? "text-muted-foreground"}`}
                              >
                                {row[1]}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Extras */}
                    {item.extras && (
                      <div className="mt-4 space-y-1 text-xs text-muted-foreground">
                        {item.extras.map((e, i) => (
                          <p key={i}>{e}</p>
                        ))}
                      </div>
                    )}

                    {/* Older policy */}
                    {item.olderPolicy && (
                      <div className="mt-10">
                        <p className="text-sm font-semibold text-foreground mb-2">
                          {item.olderPolicy.label}
                        </p>
                        <div className="rounded-2xl overflow-hidden border border-border">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-foreground/90 text-background">
                                <th className="text-left px-5 py-3 font-semibold">
                                  {item.olderPolicy.table.headers[0]}
                                </th>
                                <th className="text-right px-5 py-3 font-semibold">
                                  {item.olderPolicy.table.headers[1]}
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {item.olderPolicy.table.rows.map((row, i) => (
                                <tr
                                  key={row[0]}
                                  className={
                                    i % 2 === 0 ? "bg-card" : "bg-muted/40"
                                  }
                                >
                                  <td className="px-5 py-3 text-foreground">
                                    {row[0]}
                                  </td>
                                  <td className="px-5 py-3 text-right font-bold text-muted-foreground">
                                    {row[1]}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <p className="mt-3 text-xs text-muted-foreground">
                          {item.olderPolicy.extras}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Contact box */}
                {item.contactBox && (
                  <div className="bg-muted/40 rounded-2xl p-6 border border-border">
                    <p className="font-semibold text-foreground">
                      {item.contactBox.name}
                    </p>
                    <p className="text-muted-foreground mt-1">
                      {item.contactBox.address}
                    </p>
                    <a
                      href={`mailto:${item.contactBox.email}`}
                      className="mt-2 inline-block text-primary font-semibold hover:underline"
                    >
                      {item.contactBox.email}
                    </a>
                  </div>
                )}
              </section>
            ))}
          </div>
        </div>
      </div>
    </PublicPageShell>
  );
}
