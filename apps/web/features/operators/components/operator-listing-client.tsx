"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Bus, Route, MapPin, Star, ArrowRight } from "lucide-react";

export function OperatorListingClient() {
  const trpc = useTRPC();
  const { data: operators, isLoading } = useQuery(
    trpc.public.listOperators.queryOptions()
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-slate-100 rounded-3xl h-64 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!operators || operators.length === 0) {
    return (
      <div className="text-center py-24">
        <Bus className="h-16 w-16 text-slate-300 mx-auto mb-6" />
        <h3 className="text-xl font-bold text-slate-700 mb-2">No operators yet</h3>
        <p className="text-slate-400 mb-8">
          Be the first to join Moja Ride as an operator.
        </p>
        <Link
          href="/dashboard/operator/onboarding"
          className="inline-flex items-center gap-2 bg-[#ee237c] text-white px-6 py-3 rounded-2xl font-bold hover:bg-[#d01867] transition-all"
        >
          Get started <ArrowRight className="h-4 w-4" />
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
            className="group bg-white border border-slate-200 rounded-3xl p-8 flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-[#ee237c]/20"
          >
            {/* Logo */}
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-5 border border-slate-200 overflow-hidden">
              {op.logoUrl ? (
                <Image
                  src={op.logoUrl}
                  alt={op.name}
                  width={64}
                  height={64}
                  className="object-cover"
                />
              ) : (
                <span className="text-xl font-black text-slate-300">{abbr}</span>
              )}
            </div>

            {/* Info */}
            <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-[#ee237c] transition-colors">
              {op.name}
            </h3>
            {op.description && (
              <p className="text-slate-500 text-sm leading-relaxed mb-4 line-clamp-2">
                {op.description}
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
              <span className="flex items-center gap-1.5">
                <Route className="h-3.5 w-3.5 text-[#ee237c]/60" />
                {op._count.routes} routes
              </span>
              <span className="flex items-center gap-1.5">
                <Bus className="h-3.5 w-3.5 text-[#ee237c]/60" />
                {op._count.fleet} buses
              </span>
            </div>

            {/* Cities */}
            {op.cityNames.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-5">
                {op.cityNames.slice(0, 4).map((city) => (
                  <span
                    key={city}
                    className="flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs"
                  >
                    <MapPin className="h-2.5 w-2.5" />
                    {city}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-auto flex items-center gap-2 text-[#ee237c] font-bold text-sm group-hover:gap-4 transition-all">
              <span>View operator</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
