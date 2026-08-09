"use client";

import type { PassengerBookingSummary } from "@moja/types";
import { ArrowRight, BusFront, Plus, Ticket } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

interface SessionsPanelProps {
  trips: PassengerBookingSummary[];
}

export function SessionsPanel({ trips }: SessionsPanelProps) {
  const t = useTranslations("passengerDashboard.sessions");
  const locale = useLocale();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">
          {t("title")}
        </h2>
        <Link
          href="/dashboard/bookings?tab=upcoming"
          className="inline-flex items-center rounded-md border border-border bg-transparent px-3 py-1.5 text-sm text-text-secondary transition-colors duration-150 hover:border-border-strong hover:text-text-primary"
        >
          {t("viewAll")}
        </Link>
      </div>

      {trips.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-bg-surface py-16 text-center">
          <BusFront className="mb-3 size-10 text-text-muted" />
          <p className="text-sm font-medium text-text-secondary">
            {t("noTripsYet")}
          </p>
          <p className="mb-4 mt-1 text-xs text-text-muted">
            {t("noTripsDesc")}
          </p>
          <Link
            href="/dashboard/search"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-white shadow-[0_0_12px_rgba(238,35,124,0.25),0_0_2px_rgba(238,35,124,1)] transition-colors duration-150 hover:bg-primary/90"
          >
            <Plus className="size-4" />
            {t("searchTrips")}
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => {
            const firstSeat = trip.seats[0];
            const departureDate = new Date(trip.departureTime);
            return (
              <div
                key={trip.groupId}
                className="flex flex-col justify-between gap-3 rounded-lg border border-border bg-card p-4 shadow-xs"
              >
                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <span className="truncate">{trip.originCityName}</span>
                  <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{trip.destinationCityName}</span>
                </div>

                <div className="space-y-1 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">
                    {departureDate.toLocaleDateString(locale, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span>{trip.companyName}</span>
                    {firstSeat && (
                      <>
                        <span>•</span>
                        <span className="font-semibold text-foreground">
                          {t("seat", { id: firstSeat.seatLabel })}
                        </span>
                      </>
                    )}
                  </p>
                </div>

                {firstSeat ? (
                  <Link
                    href={`/tickets/${firstSeat.ticketToken}`}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors duration-150 hover:border-border-strong hover:text-text-primary"
                  >
                    <Ticket className="size-3.5" />
                    {t("viewTicket")}
                  </Link>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
