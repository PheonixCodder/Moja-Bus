"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { Button } from "@moja/ui/components/ui/button";
import { useTRPC } from "@/trpc/client";
import type { OperatorBookingListItem } from "@moja/types";
import { BookingRow } from "./booking-row";

type ListInput = {
  filter: "today" | "upcoming" | "past";
  search?: string | undefined;
  status?:
    | "PENDING_PAYMENT"
    | "CONFIRMED"
    | "CANCELLED"
    | "EXPIRED"
    | "COMPLETED"
    | undefined;
  tripId?: string | undefined;
  limit: number;
  offset: number;
};

export function BookingsList({
  listInput,
  page,
  pageSize,
  onPageChange,
  onCheckIn,
  onViewDetail,
  checkingInId,
}: {
  listInput: ListInput;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onCheckIn?: ((id: string) => void) | undefined;
  onViewDetail: (booking: OperatorBookingListItem) => void;
  checkingInId: string | null;
}) {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.operator.listBookings.queryOptions(listInput),
  );

  const pageCount = Math.max(1, Math.ceil(data.total / pageSize));

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
      <p className="text-xs text-text-muted">
        {data.total} booking(s)
        {pageCount > 1 ? ` · page ${page} of ${pageCount}` : ""}
      </p>
      {data.items.map((booking) => (
        <BookingRow
          key={booking.id}
          booking={booking}
          onCheckIn={onCheckIn}
          onViewDetail={onViewDetail}
          checkingIn={checkingInId === booking.id}
        />
      ))}
      {pageCount > 1 ? (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pageCount}
            onClick={() => onPageChange(Math.min(pageCount, page + 1))}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
