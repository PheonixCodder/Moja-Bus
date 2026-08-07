"use client";

import { useQuery } from "@tanstack/react-query";
import { Banknote, Clock, TrendingUp, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTRPC } from "@/trpc/client";

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  highlight?: "warning" | "success" | "neutral";
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm flex items-start gap-4">
      <div
        className={
          highlight === "warning"
            ? "flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-50"
            : highlight === "success"
              ? "flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-50"
              : "flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-100"
        }
      >
        <Icon
          className={
            highlight === "warning"
              ? "size-5 text-amber-600"
              : highlight === "success"
                ? "size-5 text-emerald-600"
                : "size-5 text-slate-600"
          }
        />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 text-2xl font-bold text-foreground">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

export function TripAuditKpiCards({ tripId }: { tripId: string }) {
  const t = useTranslations("adminDashboard.tripAuditKpiCards");
  const trpc = useTRPC();
  const { data: trip } = useQuery(
    trpc.admin.getTripAudit.queryOptions({ id: tripId }),
  );

  if (!trip) return null;

  const confirmedBookings = trip.bookings.filter(
    (b) => b.status === "CONFIRMED",
  );
  const boardedCount = confirmedBookings.filter((b) => b.boardedAt).length;
  const grossFare = confirmedBookings.reduce((sum, b) => sum + b.farePaid, 0);
  const occupancyPct =
    trip.totalSeats > 0
      ? Math.round((confirmedBookings.length / trip.totalSeats) * 100)
      : 0;
  const boardingRate =
    confirmedBookings.length > 0
      ? Math.round((boardedCount / confirmedBookings.length) * 100)
      : 0;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <KpiCard
        label={t("occupancy")}
        value={`${occupancyPct}%`}
        sub={t("occupancySub", {
          booked: confirmedBookings.length,
          total: trip.totalSeats,
        })}
        icon={TrendingUp}
        highlight={
          occupancyPct >= 90
            ? "warning"
            : occupancyPct >= 60
              ? "success"
              : "neutral"
        }
      />
      <KpiCard
        label={t("grossFares")}
        value={`${(grossFare / 1000).toFixed(1)}K XOF`}
        sub={t("confirmedTickets", { count: confirmedBookings.length })}
        icon={Banknote}
        highlight="success"
      />
      <KpiCard
        label={t("boardingRate")}
        value={`${boardingRate}%`}
        sub={t("boardedSub", { count: boardedCount })}
        icon={Users}
        highlight={boardingRate < 50 ? "warning" : "success"}
      />
      <KpiCard
        label={t("delay")}
        value={
          trip.delayMinutes && trip.delayMinutes > 0
            ? t("delayValue", { minutes: trip.delayMinutes })
            : t("onTime")
        }
        sub={
          trip.delayMinutes && trip.delayMinutes > 0
            ? t("behindSchedule")
            : t("noDelays")
        }
        icon={Clock}
        highlight={
          trip.delayMinutes && trip.delayMinutes > 0 ? "warning" : "success"
        }
      />
    </div>
  );
}
