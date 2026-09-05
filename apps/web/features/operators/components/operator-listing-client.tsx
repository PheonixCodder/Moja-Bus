"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Bus, Route, MapPin, Star, ArrowRight } from "lucide-react";

export function OperatorListingClient() {
  const t = useTranslations("operators");
  const trpc = useTRPC();
  const { data: operators, isLoading } = useQuery(
    trpc.public.listOperators.queryOptions(),
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-muted rounded-3xl h-64 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!operators || operators.length === 0) {
    return (
      <div className="text-center py-24">
        <Bus className="h-16 w-16 text-muted-foreground/40 mx-auto mb-6" />
        <h3 className="text-xl font-bold text-foreground mb-2">
          {t("emptyTitle")}
        </h3>
        <p className="text-muted-foreground mb-8">{t("emptyDesc")}</p>
        <Link
          href="/become-a-partner"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-xs"
        >
          {t("emptyButton")} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {operators.map((op) => {
        const abbr = op.name
          .split(" ")
          .map((w) => w[0])
          .join("")
          .slice(0, 3)
          .toUpperCase();

        return (
          <Link
            key={op.id}
            href={`/operators/${op.slug}`}
            className="group bg-card border border-border rounded-3xl p-8 flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-primary/20"
          >
            {/* Logo */}
            <div className="w-16 h-16 bg-muted/40 rounded-2xl flex items-center justify-center mb-5 border border-border overflow-hidden">
              {op.logoUrl ? (
                <Image
                  src={op.logoUrl}
                  alt={op.name}
                  width={64}
                  height={64}
                  className="object-cover"
                />
              ) : (
                <span className="text-xl font-black text-muted-foreground/50">
                  {abbr}
                </span>
              )}
            </div>

            {/* Info */}
            <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
              {op.name}
            </h3>
            {op.description && (
              <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-2">
                {op.description}
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
              <span className="flex items-center gap-1.5">
                <Route className="h-3.5 w-3.5 text-primary/60" />
                {t("routes", { count: op._count.routes })}
              </span>
              <span className="flex items-center gap-1.5">
                <Bus className="h-3.5 w-3.5 text-primary/60" />
                {t("buses", { count: op._count.fleet })}
              </span>
            </div>

            {/* Cities */}
            {op.cityNames.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-5">
                {op.cityNames.slice(0, 4).map((city) => (
                  <span
                    key={city}
                    className="flex items-center gap-1 px-2.5 py-0.5 bg-muted text-muted-foreground rounded-full text-xs"
                  >
                    <MapPin className="h-2.5 w-2.5" />
                    {city}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-auto flex items-center gap-2 text-primary font-bold text-sm group-hover:gap-4 transition-all">
              <span>{t("viewOperator")}</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
