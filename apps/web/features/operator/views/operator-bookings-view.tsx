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
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@moja/ui/components/ui/badge";
import { Button, buttonVariants } from "@moja/ui/components/ui/button";
import { Card, CardContent } from "@moja/ui/components/ui/card";
import { Input } from "@moja/ui/components/ui/input";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { cn } from "@moja/ui/lib/utils"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@moja/ui/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@moja/ui/components/ui/dialog";
import { Label } from "@moja/ui/components/ui/label";
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

import { BookingsList } from "@/features/operator/components/bookings/bookings-list";
import { BookingDetailDrawer } from "@/features/operator/components/bookings/booking-detail-drawer";

export function OperatorBookingsView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<OperatorBookingFilter>("today");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  const checkInMutation = useMutation(
    trpc.operator.checkInBooking.mutationOptions({
      onSuccess: (result) => {
        void queryClient.invalidateQueries(trpc.operator.listBookings.pathFilter());
        if (result.alreadyCheckedIn) {
          toast.info(`${result.passengerName} was already checked in`);
        } else {
          toast.success(`Checked in ${result.passengerName}`);
        }
      },
      onError: (err) => {
        toast.error(err.message || "Check-in failed");
      },
    })
  );

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
