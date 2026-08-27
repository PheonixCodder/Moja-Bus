import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { prefetch, trpc, HydrateClient } from "@/trpc/server";
import { OperatorListingClient } from "@/features/operators/components/operator-listing-client";
import { ArrowRight } from "lucide-react";
import { PublicPageShell } from "@/features/home/components/public-page-shell";

export const metadata: Metadata = {
  title: "Bus Operators — Moja Ride",
  description:
    "Browse verified bus operators on Moja Ride. Compare routes, schedules, and book your intercity trip across Côte d'Ivoire.",
};

export default async function OperatorsPage() {
  const t = await getTranslations("operators");
  await prefetch(trpc.public.listOperators.queryOptions());

  return (
    <HydrateClient>
      <PublicPageShell
        title={t("shellTitle")}
        description={t("shellDescription")}
        badge={t("shellBadge")}
      >
        {/* Operator grid */}
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-16">
          <OperatorListingClient />
        </div>

        {/* Become partner CTA */}
        <div className="max-w-7xl mx-auto px-6 md:px-8 pb-24">
          <div className="bg-slate-50 rounded-3xl p-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                {t("ctaTitle")}
              </h2>
              <p className="text-slate-500">{t("ctaDesc")}</p>
            </div>
            <Link
              href="/become-a-partner"
              className="shrink-0 flex items-center gap-2 bg-[#ee237c] text-white px-8 py-4 rounded-2xl font-bold hover:bg-[#d01867] transition-all hover:gap-4"
            >
              <span>{t("ctaButton")}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </PublicPageShell>
    </HydrateClient>
  );
}
