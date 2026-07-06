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
import { useHoldCountdown } from "@/features/booking/lib/hold-countdown";

function StatusBadge({ booking }: { booking: PassengerBookingSummary }) {
  const countdown = useHoldCountdown(
    booking.status === "PENDING_PAYMENT" ? booking.holdExpiresAt : null,
  );

  if (booking.status === "PENDING_PAYMENT") {
    const label = countdown?.label
      ?? (booking.holdExpiresAt
        ? `Pay by ${formatDepartureTime(booking.holdExpiresAt)}`
        : "Awaiting payment");

    return (
      <Badge
        className={cn(
          "border hover:bg-amber-50",
          countdown?.expired
            ? "bg-slate-100 text-slate-600 border-slate-200"
            : "bg-amber-50 text-amber-800 border-amber-200",
        )}
      >
        {label}
      </Badge>
    );
  }
  if (booking.status === "CONFIRMED") {
    return (
      <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-50">
        Confirmed
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-slate-600">
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
        "rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden",
        className,
      )}
    >
      <div className="p-5 sm:p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 shrink-0 rounded-full bg-pink-100 border border-pink-200 text-[#ee237c] font-black flex items-center justify-center text-sm">
              {booking.companyName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-900 truncate">
                {booking.companyName}
              </p>
              <p className="text-xs text-slate-500 font-mono truncate">
                {booking.seats.map((s) => s.bookingReference).join(" · ")}
              </p>
            </div>
          </div>
          <StatusBadge booking={booking} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-7 items-center gap-3">
          <div className="sm:col-span-2">
            <p className="text-xl font-bold font-montserrat text-slate-900">
              {formatDepartureTime(booking.departureTime)}
            </p>
            <p className="text-xs font-semibold text-slate-600 mt-0.5 truncate">
              {booking.originTerminalName}
            </p>
            <p className="text-[10px] text-slate-400">{booking.originCityName}</p>
          </div>

          <div className="sm:col-span-3 flex flex-col items-center px-2">
            <span className="text-[10px] font-semibold text-slate-400 mb-1">
              {durationMinutes > 0
                ? formatTripDuration(durationMinutes)
                : "Direct"}
            </span>
            <div className="w-full h-[2px] bg-slate-200 relative flex items-center justify-center">
              <div className="absolute h-2 w-2 rounded-full bg-slate-300 left-0" />
              <Bus className="h-4 w-4 text-slate-300 bg-white z-10" />
              <div className="absolute h-2 w-2 rounded-full bg-[#ee237c] right-0" />
            </div>
            <span className="text-[10px] font-semibold text-slate-500 mt-1">
              Seats {seatLabels}
            </span>
          </div>

          <div className="sm:col-span-2 sm:text-right">
            <p className="text-xl font-bold font-montserrat text-slate-900">
              {formatDepartureTime(booking.arrivalTime)}
            </p>
            <p className="text-xs font-semibold text-slate-600 mt-0.5 truncate">
              {booking.destinationTerminalName}
            </p>
            <p className="text-[10px] text-slate-400">
              {booking.destinationCityName}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
              {booking.seats.length > 1 ? "Passengers" : "Passenger"}
            </p>
            {booking.seats.length > 1 ? (
              <ul className="text-sm text-slate-800 space-y-0.5 mt-1">
                {booking.seats.map((seat) => (
                  <li key={seat.bookingId}>
                    <span className="font-semibold">{seat.seatLabel}:</span>{" "}
                    {seat.passengerName}
                  </li>
                ))}
              </ul>
            ) : (
              <>
                <p className="text-sm font-semibold text-slate-800">
                  {booking.passengerName}
                </p>
                <p className="text-xs text-slate-500">{booking.passengerPhone}</p>
              </>
            )}
          </div>
          <p className="text-xl font-black text-[#ee237c]">
            {formatPriceXOF(booking.totalAmountXOF)}
          </p>
        </div>
      </div>

      {(action || footer) && (
        <div className="px-5 sm:px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          {footer}
          {action ? (
            <Link
              href={action.href}
              className={cn(
                buttonVariants({ size: "sm" }),
                "bg-[#ee237c] hover:bg-[#d01867] text-white font-bold gap-1.5 ml-auto",
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
