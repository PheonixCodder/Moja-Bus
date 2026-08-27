"use client";

import { useState } from "react";
import {
  Star,
  MapPin,
  Route,
  ShieldCheck,
  Award,
  Briefcase,
  BadgeCheck,
  Phone,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@moja/ui/components/ui/avatar";
import { Badge } from "@moja/ui/components/ui/badge";
import { Button } from "@moja/ui/components/ui/button";
import { cn } from "@moja/ui/lib/utils";
import { TrustBadges } from "./trust-badges";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ServicePreference {
  isAvailableForHire: boolean;
  preferredType: "EXCLUSIVE_INTERCITY" | "CONTRACTOR_URBAN" | "HYBRID";
  cityBase: string | null;
  routeExperience: string[];
  isFeatured: boolean;
}

export interface MarketplaceDriver {
  id: string;
  licenseCategory: string;
  yearsOfExperience: number;
  averageRating: number;
  totalReviews: number;
  totalTripsCompleted: number;
  totalDistanceKm: number;
  safetyScore: number;
  verifiedAt: Date | string | null;
  user: {
    fullName: string | null;
    phoneNumber: string | null;
    image: string | null;
  };
  servicePreference: ServicePreference | null;
  /** P3-1 — driver already holds an active affiliation with the viewer's company. */
  isOnMyRoster?: boolean;
  _count?: { companyAffiliations: number };
}

interface MarketplaceDriverCardProps {
  driver: MarketplaceDriver;
  onViewProfile: (driverId: string) => void;
  onSendOffer?: (driver: MarketplaceDriver) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const EMPLOYMENT_LABELS: Record<string, { label: string; color: string }> = {
  EXCLUSIVE_INTERCITY: {
    label: "Intercity",
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  CONTRACTOR_URBAN: {
    label: "Urban",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  HYBRID: {
    label: "Hybrid",
    color: "bg-violet-50 text-violet-700 border-violet-200",
  },
};

const DEFAULT_EMPLOYMENT_META = {
  label: "Intercity",
  color: "bg-blue-50 text-blue-700 border-blue-200",
};

function getEmploymentMeta(type?: string) {
  return (
    (type ? EMPLOYMENT_LABELS[type] : undefined) ?? DEFAULT_EMPLOYMENT_META
  );
}

function SafetyScoreRing({ score }: { score: number }) {
  const pct = score / 100;
  const r = 14;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  const color = score >= 90 ? "#10b981" : score >= 75 ? "#f59e0b" : "#f43f5e";

  return (
    <div className="relative flex items-center justify-center size-10">
      <svg width="40" height="40" className="-rotate-90">
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="3"
        />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[10px] font-bold" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

function StarRating({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <div className="flex items-center gap-1">
      <Star className="size-3.5 fill-amber-400 text-amber-400" />
      <span className="text-sm font-bold text-slate-800">
        {rating.toFixed(1)}
      </span>
      <span className="text-xs text-slate-400">({reviews})</span>
    </div>
  );
}

// ─── Card Component ───────────────────────────────────────────────────────────

export function MarketplaceDriverCard({
  driver,
  onViewProfile,
  onSendOffer,
}: MarketplaceDriverCardProps) {
  const pref = driver.servicePreference;
  const employmentMeta = getEmploymentMeta(pref?.preferredType);
  const isOnMyRoster = driver.isOnMyRoster === true;

  const initials = (driver.user.fullName ?? "DR")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const topRoutes = pref?.routeExperience?.slice(0, 2) ?? [];

  const handleSendOffer = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSendOffer?.(driver);
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-2xl border bg-white shadow-sm transition-all duration-200",
        "hover:shadow-md hover:border-slate-300 cursor-pointer",
        pref?.isFeatured && "ring-2 ring-amber-300 ring-offset-1",
      )}
      onClick={() => onViewProfile(driver.id)}
    >
      {/* Featured badge */}
      {pref?.isFeatured && (
        <div className="absolute -top-2.5 left-4 flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-bold text-amber-900 shadow">
          <Sparkles className="size-2.5" />
          Featured
        </div>
      )}

      {/* Card Header */}
      <div className="flex items-start gap-3 p-4 pb-3">
        <Avatar className="size-14 shrink-0 border-2 border-slate-100 shadow-sm">
          <AvatarImage src={driver.user.image ?? undefined} />
          <AvatarFallback className="bg-primary/10 text-primary font-black text-lg">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 truncate leading-tight">
                {driver.user.fullName ?? "—"}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <BadgeCheck className="size-3.5 text-emerald-500 shrink-0" />
                <span className="text-[11px] text-slate-500">
                  Class {driver.licenseCategory} · {driver.yearsOfExperience}yr
                  exp
                </span>
              </div>
            </div>
            <span
              className={cn(
                "shrink-0 text-[10px] font-semibold border rounded-full px-2 py-0.5",
                employmentMeta.color,
              )}
            >
              {employmentMeta.label}
            </span>
          </div>

          <div className="mt-1.5">
            <StarRating
              rating={driver.averageRating}
              reviews={driver.totalReviews}
            />
          </div>
          {(driver as any).trustBadges?.length > 0 && (
            <div className="mt-1.5">
              <TrustBadges badges={(driver as any).trustBadges} size="xs" />
            </div>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="mx-4 mb-3 grid grid-cols-3 divide-x divide-slate-100 rounded-xl bg-slate-50 border border-slate-100">
        <div className="flex flex-col items-center py-2">
          <SafetyScoreRing score={driver.safetyScore} />
          <span className="text-[10px] text-slate-500 mt-0.5">Safety</span>
        </div>
        <div className="flex flex-col items-center justify-center py-2">
          <span className="text-sm font-bold text-slate-800 font-mono">
            {driver.totalTripsCompleted.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500">Trips</span>
        </div>
        <div className="flex flex-col items-center justify-center py-2">
          <span className="text-sm font-bold text-slate-800 font-mono">
            {Math.round(driver.totalDistanceKm / 1000)}k km
          </span>
          <span className="text-[10px] text-slate-500">Distance</span>
        </div>
      </div>

      {/* Location & Routes */}
      <div className="px-4 pb-3 space-y-1.5">
        {pref?.cityBase && (
          <div className="flex items-center gap-1.5">
            <MapPin className="size-3.5 text-slate-400 shrink-0" />
            <span className="text-xs text-slate-600 font-medium">
              {pref.cityBase}
            </span>
          </div>
        )}
        {topRoutes.length > 0 && (
          <div className="flex items-start gap-1.5">
            <Route className="size-3.5 text-slate-400 shrink-0 mt-0.5" />
            <div className="flex flex-wrap gap-1">
              {topRoutes.map((r) => (
                <span
                  key={r}
                  className="text-[10px] font-medium bg-slate-100 text-slate-600 rounded px-1.5 py-0.5"
                >
                  {r}
                </span>
              ))}
              {(pref?.routeExperience?.length ?? 0) > 2 && (
                <span className="text-[10px] text-slate-400">
                  +{(pref?.routeExperience?.length ?? 0) - 2} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CTA Footer */}
      <div className="mt-auto flex gap-2 border-t border-slate-100 p-3">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5 h-8 text-xs font-semibold"
          onClick={(e) => {
            e.stopPropagation();
            onViewProfile(driver.id);
          }}
        >
          View Profile
          <ChevronRight className="size-3.5" />
        </Button>
        {isOnMyRoster ? (
          // P3-1 — own-roster drivers can't be offered employment again.
          <Button
            size="sm"
            variant="outline"
            disabled
            className="flex-1 h-8 text-xs font-semibold gap-1.5 bg-slate-50"
            onClick={(e) => e.stopPropagation()}
          >
            <BadgeCheck className="size-3.5 text-emerald-600" />
            On Your Roster
          </Button>
        ) : (
          <Button
            size="sm"
            className="flex-1 h-8 text-xs font-semibold gap-1.5"
            onClick={handleSendOffer}
          >
            <Briefcase className="size-3.5" />
            Send Offer
          </Button>
        )}
      </div>
    </div>
  );
}
