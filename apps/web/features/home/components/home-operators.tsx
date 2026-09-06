import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Bus, Route, Star } from "lucide-react";
import { prefetch, trpc, HydrateClient } from "@/trpc/server";
import { HomeOperatorsClient } from "./home-operators-client";

export async function HomeOperators() {
  const t = await getTranslations("operators");
  await prefetch(trpc.public.listOperators.queryOptions());

  return (
    <HydrateClient>
      <section className="py-32 px-6 md:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-20">
            <span className="text-primary text-xs uppercase font-extrabold tracking-widest block mb-3 bg-primary/10 px-3.5 py-1.5 rounded-full w-max mx-auto border border-primary/20">
              {t("badge")}
            </span>
            <h2
              className="text-foreground font-extrabold tracking-tight mb-4"
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(2rem, 4vw, 2.75rem)",
                lineHeight: 1.15,
              }}
            >
              {t("title")}
            </h2>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
              {t("subtitle")}
            </p>
          </div>

          <HomeOperatorsClient />

          {/* View all link */}
          <div className="text-center mt-12">
            <Link
              href="/operators"
              className="inline-flex items-center gap-2 text-primary font-bold hover:gap-4 transition-all text-sm"
            >
              <span>{t("viewAll")}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </HydrateClient>
  );
}
