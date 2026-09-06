"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Bus, Route, Star, ArrowRight } from "lucide-react";
import { CarrierAvatar } from "@moja/ui/components/ui/carrier-avatar";

const DEMO_OPERATORS = [
  {
    id: "demo-1",
    slug: "#",
    name: "Union des Transports de Bouaké",
    abbr: "UTB",
    description:
      "Leading intercity transport with high frequency connections across central Côte d'Ivoire.",
    rating: 4.8,
    routes: 14,
    fleet: 32,
    cityNames: ["Bouaké", "Yamoussoukro", "Abidjan"],
    logoUrl: null,
  },
  {
    id: "demo-2",
    slug: "#",
    name: "Abidjan Voyage Services",
    abbr: "AVS",
    description:
      "Premium express passenger transport along the southern coastal and central corridors.",
    rating: 4.7,
    routes: 9,
    fleet: 21,
    cityNames: ["Abidjan", "San-Pédro", "Daloa"],
    logoUrl: null,
  },
  {
    id: "demo-3",
    slug: "#",
    name: "General Transport Company",
    abbr: "GTT",
    description:
      "Reliable and affordable commuter options covering northern and western territories.",
    rating: 4.5,
    routes: 7,
    fleet: 18,
    cityNames: ["Korhogo", "Man", "Abidjan"],
    logoUrl: null,
  },
];

export function HomeOperatorsClient() {
  const t = useTranslations("operators");
  const trpc = useTRPC();
  const { data: operators } = useQuery(
    trpc.public.listOperators.queryOptions(),
  );

  // Use real data if available, fall back to demo cards
  const displayOperators =
    operators && operators.length > 0
      ? operators.slice(0, 3).map((op) => ({
          id: op.id,
          slug: op.slug,
          name: op.name,
          abbr: op.name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 3)
            .toUpperCase(),
          description: op.description ?? t("fallbackDescription"),
          rating: 4.8,
          routes: op._count.routes,
          fleet: op._count.fleet,
          cityNames: op.cityNames,
          logoUrl: op.logoUrl,
        }))
      : DEMO_OPERATORS;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {displayOperators.map((op) => (
        <Link
          key={op.id}
          href={op.slug === "#" ? "#" : `/operators/${op.slug}`}
          className="group bg-card p-6 rounded-[2.2rem] border border-border flex flex-col justify-between shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 hover:border-primary/20"
        >
          <div>
            {/* Header Info: Logo on left, title & rating on right */}
            <div className="flex gap-4 items-center mb-5">
              <CarrierAvatar
                name={op.name}
                logoUrl={op.logoUrl}
                size="xl"
                shape="rounded"
                className="w-16 h-16 rounded-2xl group-hover:scale-105 transition-transform duration-300"
              />

              {/* Name & Rating */}
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-foreground mb-1 group-hover:text-primary transition-colors leading-snug truncate">
                  {op.name}
                </h3>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5 px-2 py-0.5 bg-warning/10 text-warning rounded-lg text-xs font-bold border border-warning/20">
                    <Star className="h-3 w-3 fill-warning text-warning" />
                    <span>{op.rating}</span>
                  </div>
                  <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                    {t("partner")}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              {op.description}
            </p>
          </div>

          <div>
            {/* Hub Cities list */}
            {op.cityNames.length > 0 && (
              <div className="mb-5 pb-5 border-b border-border">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block mb-2">
                  {t("keyHubs")}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {op.cityNames.slice(0, 3).map((city) => (
                    <span
                      key={city}
                      className="px-2.5 py-1 bg-muted/50 text-muted-foreground rounded-xl text-xs font-semibold border border-border"
                    >
                      {city}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Fleet Stats & Action Link */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Route className="h-4 w-4 text-muted-foreground" />
                  {t("routes", { count: op.routes })}
                </span>
                <span className="flex items-center gap-1.5">
                  <Bus className="h-4 w-4 text-muted-foreground" />
                  {t("buses", { count: op.fleet })}
                </span>
              </div>

              <span className="text-xs font-extrabold text-primary flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                {t("schedules")} <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
