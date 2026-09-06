"use client";

import Link from "next/link";
import { Bus, ChevronRight } from "lucide-react";
import { cn } from "@moja/ui/lib/utils";
import { Badge } from "@moja/ui/components/ui/badge";
import { buttonVariants } from "@moja/ui/components/ui/button";
import {
  formatDepartureTime,
  formatPriceXOF,
  formatTripDuration,
} from "@/features/search/lib/format";
import type { PassengerBookingSummary } from "@moja/types";
import { useTranslations } from "next-intl";
import { useHoldCountdown } from "@/features/booking/lib/hold-countdown";
import { formatDateWithWeekday } from "@/lib/format-date";
import { formatLocationLabel } from "@/lib/format-location-label";

function StatusBadge({ booking }: { booking: PassengerBookingSummary }) {
  const t = useTranslations("booking");
  const countdown = useHoldCountdown(
    booking.status === "PENDING_PAYMENT" ? booking.holdExpiresAt : null,
  );

  if (booking.status === "PENDING_PAYMENT") {
    const label =
      countdown?.label ??
      (booking.holdExpiresAt
        ? `Pay by ${formatDepartureTime(booking.holdExpiresAt)}`
        : "Awaiting payment");

    return (
      <Badge
        variant="outline"
        className={cn(
          "text-xs font-semibold px-2.5 py-0.5",
          countdown?.expired === false
            ? "bg-destructive/10 text-destructive border-destructive/20 animate-pulse"
            : "bg-warning/10 text-warning border-warning/30",
        )}
      >
        {label}
      </Badge>
    );
  }
  if (booking.status === "CONFIRMED") {
    return (
      <Badge className="bg-success/10 text-success border-success/30 hover:bg-success/20">
        {t("confirmed")}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-muted-foreground">
      {booking.status.replace(/_/g, " ")}
    </Badge>
  );
}

export interface PassengerTripCardProps {
  booking: PassengerBookingSummary;
  action?: {
    label: string;
    href: string;
  };
  footer?: React.ReactNode;
  className?: string;
}

export function PassengerTripCard({
  booking,
  action,
  footer,
  className,
}: PassengerTripCardProps) {
  const t = useTranslations("booking");
  const seatLabels = booking.seats.map((s) => s.seatLabel).join(", ");
  const durationMinutes = Math.max(
    0,
    Math.round(
      (booking.arrivalTime.getTime() - booking.departureTime.getTime()) / 60000,
    ),
  );

  return (
    <article
      className={cn(
        "rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow overflow-hidden",
        className,
      )}
    >
      <div className="p-5 sm:p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 shrink-0 rounded-full bg-primary/10 border border-primary/20 text-primary font-black flex items-center justify-center text-sm">
              {booking.companyName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-foreground truncate">
                {booking.companyName}
              </p>
              <p className="text-xs text-muted-foreground font-mono truncate">
                {booking.seats.map((s) => s.bookingReference).join(" · ")}
              </p>
            </div>
          </div>
          <StatusBadge booking={booking} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-7 items-center gap-3">
          <div className="sm:col-span-2">
            <p className="text-xl font-bold font-heading text-foreground">
              {formatDepartureTime(booking.departureTime)}
            </p>
            <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
              {formatDateWithWeekday(booking.departureTime)}
            </p>
            <p className="text-xs font-semibold text-foreground/80 mt-0.5 truncate">
              {booking.originTerminalName}
            </p>
            <p className="text-[10px] text-muted-foreground/70">
              {formatLocationLabel({
                cityName: booking.originCityName,
                municipalityName: booking.originMunicipalityName,
                quarterName: booking.originQuarterName,
                isUrban: booking.serviceType === "URBAN",
              })}
            </p>
          </div>

          <div className="sm:col-span-3 flex flex-col items-center px-2">
            <span className="text-[10px] font-semibold text-muted-foreground/70 mb-1">
              {durationMinutes > 0
                ? formatTripDuration(durationMinutes)
                : "Direct"}
            </span>
            <div className="w-full h-[2px] bg-muted relative flex items-center justify-center">
              <div className="absolute h-2 w-2 rounded-full bg-muted-foreground/40 left-0" />
              <Bus className="h-4 w-4 text-muted-foreground bg-card z-10" />
              <div className="absolute h-2 w-2 rounded-full bg-primary right-0" />
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground mt-1">
              {t("seats")} {seatLabels}
            </span>
          </div>

          <div className="sm:col-span-2 sm:text-right">
            <p className="text-xl font-bold font-heading text-foreground">
              {formatDepartureTime(booking.arrivalTime)}
            </p>
            <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
              {formatDateWithWeekday(booking.arrivalTime)}
            </p>
            <p className="text-xs font-semibold text-foreground/80 mt-0.5 truncate">
              {booking.destinationTerminalName}
            </p>
            <p className="text-[10px] text-muted-foreground/70">
              {formatLocationLabel({
                cityName: booking.destinationCityName,
                municipalityName: booking.destinationMunicipalityName,
                quarterName: booking.destinationQuarterName,
                isUrban: booking.serviceType === "URBAN",
              })}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70 font-semibold">
              {booking.seats.length > 1 ? "Passengers" : "Passenger"}
            </p>
            {booking.seats.length > 1 ? (
              <ul className="text-sm text-foreground space-y-0.5 mt-1">
                {booking.seats.map((seat) => (
                  <li key={seat.bookingId}>
                    <span className="font-semibold">{seat.seatLabel}:</span>{" "}
                    {seat.passengerName}
                  </li>
                ))}
              </ul>
            ) : (
              <>
                <p className="text-sm font-semibold text-foreground">
                  {booking.passengerName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {booking.passengerPhone}
                </p>
              </>
            )}
          </div>
          <p className="text-xl font-black text-primary">
            {formatPriceXOF(booking.totalAmountXOF)}
          </p>
        </div>
      </div>

      {(action || footer) && (
        <div className="px-5 sm:px-6 py-4 bg-muted/40 border-t border-border flex flex-wrap items-center justify-between gap-3">
          {footer}
          {action ? (
            <Link
              href={action.href}
              className={cn(
                buttonVariants({ size: "sm" }),
                "bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-1.5 ml-auto shadow-sm",
              )}
            >
              {action.label}
              <ChevronRight className="size-4" />
            </Link>
          ) : null}
        </div>
      )}
    </article>
  );
}
