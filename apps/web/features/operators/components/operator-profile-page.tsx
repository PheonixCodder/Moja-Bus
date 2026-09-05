"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useTRPC } from "@/trpc/client";
import {
  Bus,
  Route,
  MapPin,
  Phone,
  Clock,
  Globe,
  Mail,
  Calendar,
  ArrowRight,
  Star,
  Building2,
  ChevronRight,
} from "lucide-react";

import { Button } from "@moja/ui/components/ui/button";

interface Props {
  slug: string;
}

type Tab = "overview" | "routes" | "terminals" | "reviews";

function formatMinutes(min?: number | null) {
  if (!min) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m > 0 ? `${m}m` : ""}`.trim() : `${m}m`;
}

function today() {
  return new Date().toISOString().split("T")[0]!;
}

export function OperatorProfilePage({ slug }: Props) {
  const t = useTranslations("operatorProfile");
  const trpc = useTRPC();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const {
    data: operator,
    isLoading,
    error,
  } = useQuery(trpc.public.getOperator.queryOptions({ slug }));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (error || !operator) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <Bus className="h-16 w-16 text-muted-foreground/40 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-foreground mb-3">
            {t("notFoundTitle")}
          </h1>
          <p className="text-muted-foreground mb-8">{t("notFoundDesc")}</p>
          <Link
            href="/operators"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-sm"
          >
            {t("viewAllOperators")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  const abbr = operator.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "overview", label: t("tabOverview") },
    { id: "routes", label: t("tabRoutes"), count: operator.routes.length },
    {
      id: "terminals",
      label: t("tabTerminals"),
      count: operator.locations.length,
    },
    { id: "reviews", label: t("tabReviews") },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero band */}
      <div className="bg-foreground text-background px-6 md:px-8 pt-12 pb-0">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-background/60 text-sm mb-8">
            <Link href="/" className="hover:text-background transition-colors">
              {t("breadcrumbHome")}
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link
              href="/operators"
              className="hover:text-background transition-colors"
            >
              {t("breadcrumbOperators")}
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-background font-medium">{operator.name}</span>
          </nav>

          <div className="flex flex-col md:flex-row items-start gap-8 pb-12">
            {/* Logo */}
            <div className="w-24 h-24 bg-card rounded-3xl flex items-center justify-center border-4 border-background/20 shadow-2xl overflow-hidden shrink-0">
              {operator.logoUrl ? (
                <Image
                  src={operator.logoUrl}
                  alt={operator.name}
                  width={96}
                  height={96}
                  className="object-cover"
                />
              ) : (
                <span className="text-3xl font-black text-muted-foreground">
                  {abbr}
                </span>
              )}
            </div>

            <div className="flex-1">
              <h1
                className="text-background mb-2"
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                }}
              >
                {operator.name}
              </h1>
              {operator.description && (
                <p className="text-background/80 text-base max-w-2xl mb-6">
                  {operator.description}
                </p>
              )}

              {/* Stats strip */}
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2 text-background/80 text-sm">
                  <Route className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-background">
                    {operator._count.routes}
                  </span>
                  <span>{t("activeRoutes")}</span>
                </div>
                <div className="flex items-center gap-2 text-background/80 text-sm">
                  <Bus className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-background">
                    {operator._count.fleet}
                  </span>
                  <span>{t("busesInFleet")}</span>
                </div>
                <div className="flex items-center gap-2 text-background/80 text-sm">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-background">
                    {operator.locations.length}
                  </span>
                  <span>{t("terminals")}</span>
                </div>
                {operator.yearEstablished && (
                  <div className="flex items-center gap-2 text-background/80 text-sm">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>{t("est", { year: operator.yearEstablished })}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick action */}
            <Link
              href={`/search`}
              className="shrink-0 flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3.5 rounded-2xl font-bold text-sm hover:bg-primary/90 transition-all shadow-xl shadow-primary/30"
            >
              <span>{t("bookTrip")}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 border-b border-background/20">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant="ghost"
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3 h-auto text-sm font-semibold rounded-b-none rounded-t-lg transition-all ${
                  activeTab === tab.id
                    ? "bg-background text-foreground hover:bg-background hover:text-foreground"
                    : "text-background/60 hover:text-background hover:bg-background/10"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      activeTab === tab.id
                        ? "bg-primary/10 text-primary"
                        : "bg-background/20 text-background"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-12">
        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: description + contact */}
            <div className="lg:col-span-2 space-y-8">
              {operator.description && (
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-4">
                    {t("aboutHeading")}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {operator.description}
                  </p>
                </div>
              )}

              {/* Quick routes preview */}
              {operator.routes.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-foreground">
                      {t("tabRoutes")}
                    </h2>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setActiveTab("routes")}
                      className="text-sm text-primary font-bold flex items-center gap-1 hover:gap-2 transition-all p-0 h-auto hover:bg-transparent hover:text-primary"
                    >
                      {t("viewAllRoutes")}{" "}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {operator.routes.slice(0, 3).map((route) => (
                      <div
                        key={route.id}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-2xl border border-border"
                      >
                        <div>
                          <p className="font-semibold text-foreground text-sm">
                            {route.originTerminal.cityRelation?.name ??
                              route.originTerminal.city}{" "}
                            →{" "}
                            {route.destTerminal.cityRelation?.name ??
                              route.destTerminal.city}
                          </p>
                          <p className="text-muted-foreground text-xs mt-0.5">
                            {route.name}
                          </p>
                        </div>
                        <div className="text-right">
                          {route.schedules[0]?.fares[0] && (
                            <p className="text-xs text-primary font-bold">
                              {t("fromPrice")}{" "}
                              {route.schedules[0].fares[0].priceXOF.toLocaleString()}{" "}
                              FCFA
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: contact card */}
            <div>
              <div className="bg-muted/30 rounded-3xl p-6 border border-border sticky top-24">
                <h3 className="font-bold text-foreground mb-5">
                  {t("contactHeading")}
                </h3>
                <div className="space-y-4">
                  {operator.phone && (
                    <a
                      href={`tel:${operator.phone}`}
                      className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Phone className="h-4 w-4 text-primary/60" />
                      {operator.phone}
                    </a>
                  )}
                  {operator.email && (
                    <a
                      href={`mailto:${operator.email}`}
                      className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Mail className="h-4 w-4 text-primary/60" />
                      {operator.email}
                    </a>
                  )}
                  {operator.website && (
                    <a
                      href={operator.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Globe className="h-4 w-4 text-primary/60" />
                      {operator.website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                </div>

                <div className="mt-8">
                  <Link
                    href="/search"
                    className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 rounded-2xl font-bold text-sm hover:bg-primary/90 transition-all shadow-xs"
                  >
                    {t("searchTrips")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ROUTES */}
        {activeTab === "routes" && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-8">
              {t("activeRoutesCount", { count: operator.routes.length })}
            </h2>
            {operator.routes.length === 0 ? (
              <div className="text-center py-16">
                <Route className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <p className="text-muted-foreground">{t("noRoutes")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {operator.routes.map((route) => {
                  const originCity =
                    route.originTerminal.cityRelation?.name ||
                    route.originTerminal.city;
                  const destCity =
                    route.destTerminal.cityRelation?.name ||
                    route.destTerminal.city;
                  const minFare = route.schedules
                    .flatMap((s) => s.fares)
                    .sort((a, b) => a.priceXOF - b.priceXOF)[0];

                  return (
                    <div
                      key={route.id}
                      className="bg-card border border-border rounded-3xl p-6 hover:shadow-lg transition-all hover:border-primary/20 group"
                    >
                      {/* Route name */}
                      <h3 className="text-lg font-bold text-foreground mb-1">
                        {originCity} → {destCity}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-5">
                        {route.name}
                      </p>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        {route.distanceKm && (
                          <div className="bg-muted/40 rounded-xl p-3">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                              {t("distance")}
                            </p>
                            <p className="font-semibold text-foreground text-sm">
                              {route.distanceKm} km
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Schedules */}
                      {route.schedules.length > 0 && (
                        <div className="mb-5">
                          <p className="text-xs font-bold text-muted-foreground uppercase mb-2">
                            {t("departureTimes")}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {route.schedules.map((s) => (
                              <span
                                key={s.id}
                                className="flex items-center gap-1 px-3 py-1.5 bg-muted/40 border border-border rounded-full text-xs font-medium text-foreground"
                              >
                                <Clock className="h-3 w-3" />
                                {s.departureTime}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Price + Book */}
                      <div className="flex items-center justify-between">
                        {minFare ? (
                          <p className="text-sm text-muted-foreground">
                            {t("fromPrice")}{" "}
                            <span className="text-primary font-bold text-base">
                              {minFare.priceXOF.toLocaleString()} FCFA
                            </span>
                          </p>
                        ) : (
                          <span />
                        )}
                        <Link
                          href={`/search?date=${today()}`}
                          className="flex items-center gap-1.5 text-sm font-bold text-primary group-hover:gap-3 transition-all"
                        >
                          {t("book")} <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TERMINALS */}
        {activeTab === "terminals" && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-8">
              {t("terminalCount", { count: operator.locations.length })}
            </h2>
            {operator.locations.length === 0 ? (
              <div className="text-center py-16">
                <Building2 className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <p className="text-muted-foreground">{t("noTerminals")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {operator.locations.map((loc) => (
                  <div
                    key={loc.id}
                    className="bg-card border border-border rounded-3xl p-6 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-foreground mb-1">
                          {loc.name}
                        </h3>
                        <p className="text-muted-foreground text-sm mb-1">
                          {loc.addressLine1}
                          {loc.cityRelation?.name
                            ? `, ${loc.cityRelation.name}`
                            : loc.city
                              ? `, ${loc.city}`
                              : ""}
                        </p>
                        {loc.phone && (
                          <a
                            href={`tel:${loc.phone}`}
                            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mt-2"
                          >
                            <Phone className="h-3.5 w-3.5" />
                            {loc.phone}
                          </a>
                        )}
                        {loc.managerName && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {t("manager", { name: loc.managerName })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* REVIEWS — placeholder */}
        {activeTab === "reviews" && (
          <div className="text-center py-24">
            <Star className="h-16 w-16 text-muted-foreground/30 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-foreground mb-3">
              {t("reviewsSoon")}
            </h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              {t("reviewsSoonDesc")}
            </p>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 mt-8 bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-bold hover:bg-primary/90 transition-all text-sm shadow-sm"
            >
              {t("bookTripNow")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
