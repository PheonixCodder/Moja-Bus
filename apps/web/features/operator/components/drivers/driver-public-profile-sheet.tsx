"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@moja/ui/components/ui/avatar";
import { Badge } from "@moja/ui/components/ui/badge";
import { Button } from "@moja/ui/components/ui/button";
import { Separator } from "@moja/ui/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@moja/ui/components/ui/sheet";
import { Skeleton } from "@moja/ui/components/ui/skeleton";
import { cn } from "@moja/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Award,
  BadgeCheck,
  Briefcase,
  Building2,
  Calendar,
  MapPin,
  Phone,
  Route,
  ShieldCheck,
  Star,
  X,
} from "lucide-react";
import { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { SendOfferDialog } from "./send-offer-dialog";
import { TrustBadges } from "./trust-badges";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const EMPLOYMENT_LABELS: Record<string, { label: string; color: string }> = {
  EXCLUSIVE_INTERCITY: {
    label: "Exclusive Intercity",
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  CONTRACTOR_URBAN: {
    label: "Urban Contractor",
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

function StarRow({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(
            "size-4",
            s <= Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "text-slate-200 fill-slate-200",
          )}
        />
      ))}
      <span className="text-sm font-bold text-slate-800 ml-1">
        {rating.toFixed(1)}
      </span>
      <span className="text-xs text-slate-500">({reviews} reviews)</span>
    </div>
  );
}

function StatPill({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
      <span className="text-lg font-bold text-slate-800 font-mono">
        {value}
      </span>
      <span className="text-[11px] font-semibold text-slate-600 mt-0.5">
        {label}
      </span>
      {sub && <span className="text-[10px] text-slate-400 mt-0.5">{sub}</span>}
    </div>
  );
}

// ─── Sheet Component ──────────────────────────────────────────────────────────

interface DriverPublicProfileSheetProps {
  driverProfileId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DriverPublicProfileSheet({
  driverProfileId,
  open,
  onOpenChange,
}: DriverPublicProfileSheetProps) {
  const trpc = useTRPC();

  const { data, isLoading } = useQuery({
    ...trpc.drivers.getPublicDriverProfile.queryOptions({
      driverProfileId: driverProfileId ?? "",
    }),
    enabled: open && !!driverProfileId,
  });

  const driver = data?.driver;

  const initials = (driver?.user.fullName ?? "DR")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const pref = driver?.servicePreference;
  const employmentMeta = getEmploymentMeta(pref?.preferredType);

  const [offerDialogOpen, setOfferDialogOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-full sm:max-w-lg overflow-y-auto p-0"
        side="right"
      >
        {isLoading ? (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="size-20 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ) : !driver ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-3">
            <ShieldCheck className="size-10 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">
              Driver profile not found.
            </p>
            <p className="text-xs text-slate-400">
              This driver may no longer be available in the marketplace.
            </p>
          </div>
        ) : (
          <>
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-6 pt-6 pb-4">
              <div className="flex items-start gap-4">
                <Avatar className="size-16 border-2 border-slate-100 shadow shrink-0">
                  <AvatarImage src={driver.user.image ?? undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-black text-xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 leading-tight">
                        {driver.user.fullName ?? "—"}
                      </h2>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <BadgeCheck className="size-3.5 text-emerald-500" />
                        <span className="text-xs text-slate-500">
                          Class {driver.licenseCategory} ·{" "}
                          {driver.yearsOfExperience}yr exp
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

                  <div className="mt-2">
                    <StarRow
                      rating={driver.averageRating}
                      reviews={driver.totalReviews}
                    />
                  </div>
                  {(driver as any).trustBadges?.length > 0 && (
                    <div className="mt-1.5">
                      <TrustBadges
                        badges={(driver as any).trustBadges}
                        size="xs"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-5 space-y-6">
              {/* Career Stats */}
              <section>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Career Statistics
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <StatPill
                    label="Trips Completed"
                    value={driver.totalTripsCompleted.toLocaleString()}
                    sub="Lifetime journeys"
                  />
                  <StatPill
                    label="Distance Driven"
                    value={`${Math.round(driver.totalDistanceKm / 1000).toLocaleString()}k km`}
                    sub="Total logged"
                  />
                  <StatPill
                    label="Safety Score"
                    value={`${driver.safetyScore}/100`}
                    sub="Compliance index"
                  />
                  <StatPill
                    label="On Platform Since"
                    value={
                      driver.verifiedAt
                        ? format(new Date(driver.verifiedAt), "MMM yyyy")
                        : "—"
                    }
                    sub="Verification date"
                  />
                </div>
              </section>

              {/* Contact */}
              {driver.user.phoneNumber && (
                <>
                  <Separator />
                  <section>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Contact
                    </h3>
                    <div className="flex items-center gap-2.5 text-sm text-slate-700">
                      <Phone className="size-4 text-slate-400 shrink-0" />
                      <span className="font-mono">
                        {driver.user.phoneNumber}
                      </span>
                    </div>
                  </section>
                </>
              )}

              {/* Geographic & Route Preference */}
              {pref && (pref.cityBase || pref.routeExperience.length > 0) && (
                <>
                  <Separator />
                  <section>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Area & Route Experience
                    </h3>
                    {pref.cityBase && (
                      <div className="flex items-center gap-2 mb-2.5">
                        <MapPin className="size-4 text-slate-400 shrink-0" />
                        <span className="text-sm font-semibold text-slate-700">
                          Base: {pref.cityBase}
                        </span>
                      </div>
                    )}
                    {pref.routeExperience.length > 0 && (
                      <div className="flex items-start gap-2">
                        <Route className="size-4 text-slate-400 shrink-0 mt-0.5" />
                        <div className="flex flex-wrap gap-1.5">
                          {pref.routeExperience.map((r) => (
                            <span
                              key={r}
                              className="text-xs font-medium bg-slate-100 border border-slate-200 text-slate-600 rounded-lg px-2 py-1"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </section>
                </>
              )}

              {/* Affiliation History */}
              {driver.companyAffiliations.length > 0 && (
                <>
                  <Separator />
                  <section>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Affiliation History
                    </h3>
                    <div className="space-y-2.5">
                      {driver.companyAffiliations.map((aff, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3"
                        >
                          <Building2 className="size-4 text-slate-400 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-800 truncate">
                              {aff.company.name}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {getEmploymentMeta(aff.employmentType).label}
                              {" · "}
                              {format(new Date(aff.hiredAt), "MMM yyyy")}
                              {aff.terminatedAt
                                ? ` → ${format(new Date(aff.terminatedAt), "MMM yyyy")}`
                                : " → Present"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              )}
            </div>

            {/* Sticky CTA — Phase 24 (F-OP-06): disabled when the driver is
                already on the caller's roster. Phase 25 (F-OP-10): also closed
                for redacted off-market/suspended profiles (servicePreference
                is null in that branch). */}
            <div className="sticky bottom-0 border-t border-slate-100 bg-white px-6 py-4">
              {data?.driver.isOnMyRoster ? (
                <Button
                  className="w-full gap-2 font-semibold"
                  size="lg"
                  variant="outline"
                  disabled
                >
                  On Your Roster
                </Button>
              ) : data?.driver && !data.driver.servicePreference ? (
                <Button
                  className="w-full gap-2 font-semibold"
                  size="lg"
                  variant="outline"
                  disabled
                >
                  Off Market
                </Button>
              ) : (
                <>
                  <Button
                    className="w-full gap-2 font-semibold"
                    size="lg"
                    onClick={() => setOfferDialogOpen(true)}
                  >
                    <Briefcase className="size-4" />
                    Send Employment Offer
                  </Button>
                  <p className="text-center text-[11px] text-slate-400 mt-2">
                    The driver has 7 days to accept, decline, or counter.
                  </p>
                </>
              )}
            </div>
          </>
        )}
      </SheetContent>

      <SendOfferDialog
        driverProfileId={driverProfileId}
        driverName={driver?.user.fullName ?? "this driver"}
        licenseCategory={driver?.licenseCategory}
        open={offerDialogOpen}
        onOpenChange={setOfferDialogOpen}
      />
    </Sheet>
  );
}
