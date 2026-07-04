"use client";

import Link from "next/link";
import { useState } from "react";
import {
  useSuspenseQuery,
  useMutation,
  useQueryClient,
  useQuery,
} from "@tanstack/react-query";
import {
  CalendarDays,
  CheckCircle2,
  Radio,
  ScanLine,
  Search,
  Ticket,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@moja/ui/components/ui/badge";
import { Button } from "@moja/ui/components/ui/button";
import { Card, CardContent } from "@moja/ui/components/ui/card";
import { Input } from "@moja/ui/components/ui/input";
import { Spinner } from "@moja/ui/components/ui/spinner";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@moja/ui/components/ui/drawer";
import { useTRPC } from "@/trpc/client";
import { formatDepartureTime, formatPriceXOF } from "@/features/search/lib/format";
import {
  TicketScanner,
  type TicketScanResult,
} from "@/features/operator/components/ticket-scanner";
import type { OperatorBookingFilter, OperatorBookingListItem } from "@moja/types";

const FILTERS: { id: OperatorBookingFilter; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
];

function CheckInBadge({ booking }: { booking: OperatorBookingListItem }) {
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

function BookingRow({
  booking,
  onCheckIn,
  onViewDetail,
  checkingIn,
}: {
  booking: OperatorBookingListItem;
  onCheckIn: (id: string) => void;
  onViewDetail: (booking: OperatorBookingListItem) => void;
  checkingIn: boolean;
}) {
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
              {booking.originCityName} → {booking.destinationCityName} · Seat{" "}
              {booking.seatLabel}
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              {formatDepartureTime(booking.departureTime)} · {booking.passengerPhone}
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
            Details
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            render={
              <Link
                href={`/dashboard/operator/trips?manifest=${encodeURIComponent(booking.tripId)}`}
              />
            }
          >
            <Radio className="size-3.5" />
            Manifest
          </Button>
          {booking.status === "CONFIRMED" && !booking.checkedInAt ? (
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
              Check in
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function BookingsList({
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

function BookingDetailDrawer({
  bookingId,
  open,
  onClose,
}: {
  bookingId: string;
  open: boolean;
  onClose: () => void;
}) {
  const trpc = useTRPC();

  const { data: booking, isLoading } = useQuery({
    ...trpc.operator.getBooking.queryOptions({ bookingId }),
    enabled: open,
  });

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()} direction="right">
      <DrawerContent className="!inset-y-0 !right-0 !left-auto !w-full !max-w-md flex flex-col">
        <DrawerHeader className="border-b border-border px-5 py-4 shrink-0">
          <DrawerTitle className="text-base font-bold">Booking details</DrawerTitle>
          <DrawerDescription className="text-xs">
            {booking?.bookingReference ?? "Loading…"}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 text-sm">
          {isLoading || !booking ? (
            <div className="flex justify-center py-12">
              <Spinner className="size-6 text-primary" />
            </div>
          ) : (
            <>
              <div>
                <p className="text-xs font-bold uppercase text-muted-foreground">Passenger</p>
                <p className="font-semibold mt-1">{booking.passengerName}</p>
                <p className="text-muted-foreground">{booking.passengerPhone}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-muted-foreground">Route</p>
                <p className="font-semibold mt-1">
                  {booking.originTerminalName} → {booking.destinationTerminalName}
                </p>
                <p className="text-muted-foreground text-xs">
                  {booking.originCityName} → {booking.destinationCityName}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">Seat</p>
                  <p className="font-mono font-bold mt-1">{booking.seatLabel}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">Fare</p>
                  <p className="font-bold text-neon mt-1">
                    {formatPriceXOF(booking.farePaidXOF)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-muted-foreground">Departure</p>
                <p className="mt-1">{formatDepartureTime(booking.departureTime)}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-muted-foreground">Check-in</p>
                <p className="mt-1">
                  {booking.checkedInAt
                    ? formatDepartureTime(booking.checkedInAt)
                    : "Not checked in"}
                </p>
              </div>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export function OperatorBookingsView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<OperatorBookingFilter>("today");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  const checkInMutation = useMutation({
    ...trpc.operator.checkInBooking.mutationOptions(),
    onSuccess: (result) => {
      void queryClient.invalidateQueries(trpc.operator.listBookings.pathFilter());
      if (result.alreadyCheckedIn) {
        toast.info(`${result.passengerName} was already checked in`);
      } else {
        toast.success(`Checked in ${result.passengerName}`);
      }
    },
    onError: (err: { message?: string }) =>
      toast.error(err.message || "Check-in failed"),
  });

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setDebouncedSearch(search);
  }

  async function handleCheckIn(bookingId: string) {
    setCheckingInId(bookingId);
    try {
      await checkInMutation.mutateAsync({ bookingId });
    } finally {
      setCheckingInId(null);
    }
  }

  async function handleScan(raw: string): Promise<TicketScanResult> {
    const result = await checkInMutation.mutateAsync({ ticketToken: raw });
    void queryClient.invalidateQueries(trpc.operator.listBookings.pathFilter());
    return result;
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Bookings</h1>
          <p className="text-sm text-text-secondary mt-1">
            View passenger reservations and check in tickets before departure.
          </p>
        </div>
        <Button
          variant="secondary"
          className="gap-2 shrink-0"
          onClick={() => setScannerOpen(true)}
        >
          <ScanLine className="size-4" />
          Scan ticket
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <Button
            key={item.id}
            size="sm"
            variant={filter === item.id ? "default" : "outline"}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by reference, name, or phone…"
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      <BookingsList
        filter={filter}
        search={debouncedSearch}
        onCheckIn={handleCheckIn}
        onViewDetail={(b) => setDetailId(b.id)}
        checkingInId={checkingInId}
      />

      {detailId ? (
        <BookingDetailDrawer
          bookingId={detailId}
          open
          onClose={() => setDetailId(null)}
        />
      ) : null}

      <TicketScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScan={handleScan}
      />
    </div>
  );
}
