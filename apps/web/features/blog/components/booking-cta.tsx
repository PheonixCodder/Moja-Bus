"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

interface BookingCTAProps {
  origin?: string;
  destination?: string;
}

export function BookingCTA({ origin, destination }: BookingCTAProps) {
  const t = useTranslations("blog");
  return (
    <div className="my-8 p-6 bg-primary/10 border border-primary/20 rounded-xl text-center space-y-4">
      <h3 className="text-base font-extrabold text-foreground mb-1">
        {t("bookCtaTitle", {
          origin: origin || "Abidjan",
          destination: destination || "Yamoussoukro",
        })}
      </h3>
      <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
        {t("bookCtaDesc")}
      </p>
      <Link
        href="/search"
        className="inline-flex items-center justify-center bg-primary text-primary-foreground font-bold px-5 py-2.5 rounded-lg hover:bg-primary/90 transition-colors text-xs"
      >
        {t("bookCtaButton")}
      </Link>
    </div>
  );
}
