"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { CheckCircle2, Radio, Ticket } from "lucide-react";
import { Button, buttonVariants } from "@moja/ui/components/ui/button";
import { Card, CardContent } from "@moja/ui/components/ui/card";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { cn } from "@moja/ui/lib/utils";
import { formatDateWithWeekday } from "@/lib/format-date";
import { formatDepartureTime } from "@/features/search/lib/format";
import type { OperatorBookingListItem } from "@moja/types";
import { CheckInBadge } from "./check-in-badge";

export function BookingRow({
  booking,
  onCheckIn,
  onViewDetail,
  checkingIn,
}: {
  booking: OperatorBookingListItem;
  onCheckIn?: ((id: string) => void) | undefined;
  onViewDetail: (booking: OperatorBookingListItem) => void;
  checkingIn: boolean;
}) {
  const t = useTranslations("operatorDashboard.bookings");

  return (
    <Card className="border-border bg-bg-surface">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
              {booking.bookingReference}
            </p>
            <h3 className="text-base font-bold text-text-primary truncate">
              {booking.passengerName}
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              {booking.originCityName} → {booking.destinationCityName} · {t("card.seat", { seat: booking.seatLabel })}
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              {formatDateWithWeekday(booking.departureTime)} · {formatDepartureTime(booking.departureTime)} · {booking.passengerPhone}
            </p>
          </div>
          <CheckInBadge booking={booking} />
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5"
            onClick={() => onViewDetail(booking)}
          >
            <Ticket className="size-3.5" />
            {t("card.details")}
          </Button>
          <Link
            href={`/dashboard/operator/trips?manifest=${encodeURIComponent(booking.tripId)}`}
            className={cn(
              buttonVariants({ size: "sm", variant: "outline" }),
              "gap-1.5"
            )}
          >
            <Radio className="size-3.5" />
            {t("card.manifest")}
          </Link>
          {onCheckIn &&
          booking.status === "CONFIRMED" &&
          !booking.checkedInAt ? (
            <Button
              size="sm"
              className="gap-1.5 ml-auto"
              disabled={checkingIn}
              onClick={() => onCheckIn(booking.id)}
            >
              {checkingIn ? (
                <Spinner className="size-3.5" />
              ) : (
                <CheckCircle2 className="size-3.5" />
              )}
              {t("card.checkIn")}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
