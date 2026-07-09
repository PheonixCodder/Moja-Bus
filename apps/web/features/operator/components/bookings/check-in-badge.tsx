"use client";

import { Badge } from "@moja/ui/components/ui/badge";
import type { OperatorBookingListItem } from "@moja/types";

export function CheckInBadge({ booking }: { booking: OperatorBookingListItem }) {
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
        Checked in
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50">
      Awaiting check-in
    </Badge>
  );
}
