"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import type { OperatorBookingFilter, OperatorBookingListItem } from "@moja/types";
import { BookingRow } from "./booking-row";

export function BookingsList({
  filter,
  search,
  onCheckIn,
  onViewDetail,
  checkingInId,
}: {
  filter: OperatorBookingFilter;
  search: string;
  onCheckIn: (id: string) => void;
  onViewDetail: (booking: OperatorBookingListItem) => void;
  checkingInId: string | null;
}) {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.operator.listBookings.queryOptions({
      filter,
      search: search.trim() || undefined,
    }),
  );

  if (data.items.length === 0) {
    return (
      <div className="text-center py-16 text-text-secondary text-sm">
        <CalendarDays className="size-10 mx-auto mb-3 text-text-muted" />
        <p>No bookings found for this period.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-text-muted">{data.total} booking(s)</p>
      {data.items.map((booking) => (
        <BookingRow
          key={booking.id}
          booking={booking}
          onCheckIn={onCheckIn}
          onViewDetail={onViewDetail}
          checkingIn={checkingInId === booking.id}
        />
      ))}
    </div>
  );
}
