"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@moja/ui/components/ui/badge";
import type { OperatorBookingListItem } from "@moja/types";

export function CheckInBadge({ booking }: { booking: OperatorBookingListItem }) {
  const t = useTranslations("operatorDashboard.bookings.checkInBadge");

  if (booking.status !== "CONFIRMED") {
    return (
      <Badge variant="outline" className="text-text-muted">
        {booking.status}
      </Badge>
    );
  }
  if (booking.checkedInAt) {
    return (
      <Badge
        variant="outline"
        className="text-emerald-700 border-emerald-200 bg-emerald-50"
      >
        {t("checkedIn")}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50">
      {t("awaiting")}
    </Badge>
  );
}
