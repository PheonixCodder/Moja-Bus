"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@moja/ui/components/ui/badge";
import type { OperatorBookingListItem } from "@moja/types";

export function CheckInBadge({
  booking,
}: {
  booking: OperatorBookingListItem;
}) {
  const t = useTranslations("operatorDashboard.bookings.checkInBadge");

  if (booking.status !== "CONFIRMED") {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        {booking.status}
      </Badge>
    );
  }
  if (booking.checkedInAt) {
    return (
      <Badge
        variant="outline"
        className="text-success border-success/30 bg-success/10"
      >
        {t("checkedIn")}
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="text-warning border-warning/30 bg-warning/10"
    >
      {t("awaiting")}
    </Badge>
  );
}
