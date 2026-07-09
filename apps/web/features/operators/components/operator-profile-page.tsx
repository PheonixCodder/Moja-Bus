"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
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
  const trpc = useTRPC();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const { data: operator, isLoading, error } = useQuery(
    trpc.public.getOperator.queryOptions({ slug })
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#ee237c] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading operator profile...</p>
        </div>
      </div>
    );
  }

  if (error || !operator) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <Bus className="h-16 w-16 text-slate-300 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Operator not found</h1>
          <p className="text-slate-500 mb-8">
            This operator may not be verified yet or doesn&apos;t exist on Moja Ride.
          </p>
          <Link
            href="/operators"
            className="inline-flex items-center gap-2 bg-[#ee237c] text-white px-6 py-3 rounded-2xl font-bold hover:bg-[#d01867] transition-all"
          >
            View all operators <ArrowRight className="h-4 w-4" />
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
    { id: "overview", label: "Overview" },
    { id: "routes", label: "Routes", count: operator.routes.length },
    { id: "terminals", label: "Terminals", count: operator.locations.length },
    { id: "reviews", label: "Reviews" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero band */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 px-6 md:px-8 pt-12 pb-0">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-slate-400 text-sm mb-8">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/operators" className="hover:text-white transition-colors">Operators</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-white font-medium">{operator.name}</span>
          </nav>

          <div className="flex flex-col md:flex-row items-start gap-8 pb-12">
            {/* Logo */}
            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center border-4 border-white/20 shadow-2xl overflow-hidden shrink-0">
              {operator.logoUrl ? (
                <Image
                  src={operator.logoUrl}
                  alt={operator.name}
                  width={96}
                  height={96}
                  className="object-cover"
                />
              ) : (
                <span className="text-3xl font-black text-slate-400">{abbr}</span>
              )}
            </div>

            <div className="flex-1">
              <h1
                className="text-white mb-2"
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
                <p className="text-slate-300 text-base max-w-2xl mb-6">{operator.description}</p>
              )}

              {/* Stats strip */}
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2 text-slate-300 text-sm">
                  <Route className="h-4 w-4 text-[#ee237c]" />
                  <span className="font-semibold text-white">{operator._count.routes}</span>
                  <span>active routes</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300 text-sm">
                  <Bus className="h-4 w-4 text-[#ee237c]" />
                  <span className="font-semibold text-white">{operator._count.fleet}</span>
                  <span>buses in fleet</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300 text-sm">
                  <MapPin className="h-4 w-4 text-[#ee237c]" />
                  <span className="font-semibold text-white">{operator.locations.length}</span>
                  <span>terminals</span>
                </div>
                {operator.yearEstablished && (
                  <div className="flex items-center gap-2 text-slate-300 text-sm">
                    <Calendar className="h-4 w-4 text-[#ee237c]" />
                    <span>Est. {operator.yearEstablished}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick action */}
            <Link
              href={`/search`}
              className="shrink-0 flex items-center gap-2 bg-[#ee237c] text-white px-6 py-3.5 rounded-2xl font-bold text-sm hover:bg-[#d01867] transition-all shadow-xl shadow-pink-900/30"
            >
              <span>Book a trip</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 border-b border-slate-700">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3 text-sm font-semibold rounded-t-lg transition-all ${
                  activeTab === tab.id
                    ? "bg-white text-slate-900"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      activeTab === tab.id
                        ? "bg-[#ee237c]/10 text-[#ee237c]"
                        : "bg-slate-600 text-slate-300"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
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
                  <h2 className="text-xl font-bold text-slate-900 mb-4">About</h2>
                  <p className="text-slate-600 leading-relaxed">{operator.description}</p>
                </div>
              )}

              {/* Quick routes preview */}
              {operator.routes.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-900">Routes</h2>
                    <button
                      onClick={() => setActiveTab("routes")}
                      className="text-sm text-[#ee237c] font-bold flex items-center gap-1 hover:gap-2 transition-all"
                    >
                      View all <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {operator.routes.slice(0, 3).map((route) => (
                      <div
                        key={route.id}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100"
                      >
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">
                            {route.originTerminal.cityRelation?.name ?? route.originTerminal.city} →{" "}
                            {route.destTerminal.cityRelation?.name ?? route.destTerminal.city}
                          </p>
                          <p className="text-slate-400 text-xs mt-0.5">{route.name}</p>
                        </div>
                        <div className="text-right">
                          {route.estimatedMinutes && (
                            <p className="text-sm font-medium text-slate-600">
                              {formatMinutes(route.estimatedMinutes)}
                            </p>
                          )}
                          {route.schedules[0]?.fares[0] && (
                            <p className="text-xs text-[#ee237c] font-bold">
                              from {route.schedules[0].fares[0].priceXOF.toLocaleString()}{" "}
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
              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 sticky top-24">
                <h3 className="font-bold text-slate-900 mb-5">Contact</h3>
                <div className="space-y-4">
                  {operator.phone && (
                    <a
                      href={`tel:${operator.phone}`}
                      className="flex items-center gap-3 text-sm text-slate-600 hover:text-[#ee237c] transition-colors"
                    >
                      <Phone className="h-4 w-4 text-[#ee237c]/60" />
                      {operator.phone}
                    </a>
                  )}
                  {operator.email && (
                    <a
                      href={`mailto:${operator.email}`}
                      className="flex items-center gap-3 text-sm text-slate-600 hover:text-[#ee237c] transition-colors"
                    >
                      <Mail className="h-4 w-4 text-[#ee237c]/60" />
                      {operator.email}
                    </a>
                  )}
                  {operator.website && (
                    <a
                      href={operator.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm text-slate-600 hover:text-[#ee237c] transition-colors"
                    >
                      <Globe className="h-4 w-4 text-[#ee237c]/60" />
                      {operator.website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                </div>

                <div className="mt-8">
                  <Link
                    href="/search"
                    className="w-full flex items-center justify-center gap-2 bg-[#ee237c] text-white py-4 rounded-2xl font-bold text-sm hover:bg-[#d01867] transition-all"
                  >
                    Search their trips
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
            <h2 className="text-xl font-bold text-slate-900 mb-8">
              {operator.routes.length} Active Routes
            </h2>
            {operator.routes.length === 0 ? (
              <div className="text-center py-16">
                <Route className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No active routes published yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {operator.routes.map((route) => {
                  const originCity =
                    route.originTerminal.cityRelation?.name ?? route.originTerminal.city;
                  const destCity =
                    route.destTerminal.cityRelation?.name ?? route.destTerminal.city;
                  const minFare = route.schedules
                    .flatMap((s) => s.fares)
                    .sort((a, b) => a.priceXOF - b.priceXOF)[0];

                  return (
                    <div
                      key={route.id}
                      className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-lg transition-all hover:border-[#ee237c]/20 group"
                    >
                      {/* Route name */}
                      <h3 className="text-lg font-bold text-slate-900 mb-1">
                        {originCity} → {destCity}
                      </h3>
                      <p className="text-slate-400 text-sm mb-5">{route.name}</p>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        {route.distanceKm && (
                          <div className="bg-slate-50 rounded-xl p-3">
                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Distance</p>
                            <p className="font-semibold text-slate-800 text-sm">
                              {route.distanceKm} km
                            </p>
                          </div>
                        )}
                        {route.estimatedMinutes && (
                          <div className="bg-slate-50 rounded-xl p-3">
                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Duration</p>
                            <p className="font-semibold text-slate-800 text-sm">
                              {formatMinutes(route.estimatedMinutes)}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Schedules */}
                      {route.schedules.length > 0 && (
                        <div className="mb-5">
                          <p className="text-xs font-bold text-slate-400 uppercase mb-2">
                            Departure times
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {route.schedules.map((s) => (
                              <span
                                key={s.id}
                                className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs font-medium text-slate-600"
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
                          <p className="text-sm text-slate-500">
                            From{" "}
                            <span className="text-[#ee237c] font-bold text-base">
                              {minFare.priceXOF.toLocaleString()} FCFA
                            </span>
                          </p>
                        ) : (
                          <span />
                        )}
                        <Link
                          href={`/search?date=${today()}`}
                          className="flex items-center gap-1.5 text-sm font-bold text-[#ee237c] group-hover:gap-3 transition-all"
                        >
                          Book <ArrowRight className="h-3.5 w-3.5" />
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
            <h2 className="text-xl font-bold text-slate-900 mb-8">
              {operator.locations.length} Terminal{operator.locations.length !== 1 ? "s" : ""}
            </h2>
            {operator.locations.length === 0 ? (
              <div className="text-center py-16">
                <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No terminals listed yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {operator.locations.map((loc) => (
                  <div
                    key={loc.id}
                    className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-[#ee237c]/10 rounded-xl flex items-center justify-center shrink-0">
                        <MapPin className="h-5 w-5 text-[#ee237c]" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 mb-1">{loc.name}</h3>
                        <p className="text-slate-500 text-sm mb-1">
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
                            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#ee237c] transition-colors mt-2"
                          >
                            <Phone className="h-3.5 w-3.5" />
                            {loc.phone}
                          </a>
                        )}
                        {loc.managerName && (
                          <p className="text-xs text-slate-400 mt-1">
                            Manager: {loc.managerName}
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
            <Star className="h-16 w-16 text-slate-200 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-slate-700 mb-3">Reviews coming soon</h3>
            <p className="text-slate-400 max-w-sm mx-auto">
              Passenger reviews will be available once the review system launches. Be the first
              to travel and share your experience!
            </p>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 mt-8 bg-[#ee237c] text-white px-6 py-3 rounded-2xl font-bold hover:bg-[#d01867] transition-all text-sm"
            >
              Book a trip now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
