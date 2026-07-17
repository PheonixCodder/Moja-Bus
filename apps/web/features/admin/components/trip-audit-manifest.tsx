"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { useQueryState } from "nuqs";
import { tripAuditSearchParams } from "@/features/admin/lib/search-params";
import { Input } from "@moja/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@moja/ui/components/ui/table";
import { Badge } from "@moja/ui/components/ui/badge";
import { Search, ArrowRight, CheckCircle2, Clock, User, XCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@moja/ui/lib/utils";
import type { RouterOutputs } from "@/trpc/client";

type TripAudit = RouterOutputs["admin"]["getTripAudit"];
type Booking = TripAudit["bookings"][number];

function BookingStatusBadge({ booking }: { booking: Booking }) {
  if (booking.boardedAt) {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
        <CheckCircle2 className="size-3 mr-1" />
        Boarded
      </Badge>
    );
  }
  if (booking.checkedInAt) {
    return (
      <Badge className="bg-sky-100 text-sky-700 border-sky-200 hover:bg-sky-100">
        <Clock className="size-3 mr-1" />
        Checked In
      </Badge>
    );
  }
  if (booking.status === "CONFIRMED") {
    return (
      <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
        <User className="size-3 mr-1" />
        Not Boarded
      </Badge>
    );
  }
  if (booking.status === "CANCELLED") {
    return (
      <Badge variant="destructive" className="border-red-200">
        <XCircle className="size-3 mr-1" />
        Cancelled
      </Badge>
    );
  }
  return (
    <Badge variant="outline">
      {booking.status}
    </Badge>
  );
}

export function TripAuditManifest({ tripId }: { tripId: string }) {
  const trpc = useTRPC();
  const { data: trip } = useSuspenseQuery(
    trpc.admin.getTripAudit.queryOptions({ id: tripId })
  );

  const [q, setQ] = useQueryState("q", tripAuditSearchParams.q);
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    tripAuditSearchParams.status
  );

  const filtered = trip.bookings.filter((b) => {
    const matchesQ =
      !q ||
      b.passengerName.toLowerCase().includes(q.toLowerCase()) ||
      b.bookingReference.toLowerCase().includes(q.toLowerCase()) ||
      b.passengerPhone.includes(q);

    const matchesStatus =
      !statusFilter ||
      statusFilter === "ALL" ||
      (statusFilter === "BOARDED" && !!b.boardedAt) ||
      (statusFilter === "CHECKED_IN" && !!b.checkedInAt && !b.boardedAt) ||
      (statusFilter === "NOT_BOARDED" &&
        b.status === "CONFIRMED" &&
        !b.checkedInAt) ||
      (statusFilter === "CANCELLED" && b.status === "CANCELLED");

    return matchesQ && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search name, reference, or phone..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="BOARDED">Boarded</SelectItem>
            <SelectItem value="CHECKED_IN">Checked In</SelectItem>
            <SelectItem value="NOT_BOARDED">Not Boarded</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/70">
              <TableHead className="font-semibold text-xs">Seat</TableHead>
              <TableHead className="font-semibold text-xs">Passenger</TableHead>
              <TableHead className="font-semibold text-xs">Segment</TableHead>
              <TableHead className="font-semibold text-xs">Reference</TableHead>
              <TableHead className="font-semibold text-xs">Fare</TableHead>
              <TableHead className="font-semibold text-xs">Status</TableHead>
              <TableHead className="font-semibold text-xs">Booked At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-sm">
                  No passengers match your filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((booking) => (
                <TableRow key={booking.id} className="hover:bg-slate-50/50">
                  <TableCell>
                    <div className="flex size-8 items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-slate-700">
                      {booking.seat?.label ?? "?"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{booking.passengerName}</p>
                      <p className="text-xs text-muted-foreground">{booking.passengerPhone}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span>
                        {booking.originTripStop?.terminal.cityRelation?.name ?? "?"}
                      </span>
                      <ArrowRight className="size-3 shrink-0" />
                      <span>
                        {booking.destinationTripStop?.terminal.cityRelation?.name ?? "?"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                      {booking.bookingReference}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm font-semibold">
                    {booking.farePaid.toLocaleString()} XOF
                  </TableCell>
                  <TableCell>
                    <BookingStatusBadge booking={booking} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {booking.issuedAt
                      ? format(new Date(booking.issuedAt), "MMM d, h:mm a")
                      : format(new Date(booking.createdAt), "MMM d, h:mm a")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {filtered.length > 0 && (
          <div className="border-t border-border bg-slate-50/50 px-4 py-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Showing {filtered.length} of {trip.bookings.length} passengers
            </span>
            <span className="text-xs font-semibold text-foreground">
              Total Fare: {filtered.reduce((s, b) => s + b.farePaid, 0).toLocaleString()} XOF
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
