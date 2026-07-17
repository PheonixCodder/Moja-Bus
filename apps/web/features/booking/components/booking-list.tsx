"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Button } from "@moja/ui/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@moja/ui/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@moja/ui/components/ui/input-group";
import { ScrollArea } from "@moja/ui/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@moja/ui/components/ui/tabs";
import type { PassengerBookingSummary } from "@moja/types";
import { BookingCard } from "./booking-card";

type BookingFilter = "upcoming" | "pending" | "past";

type BookingListProps = {
  bookings: PassengerBookingSummary[];
  total: number;
  isLoading: boolean;
  filter: BookingFilter;
  selectedGroupId: string | null;
  onFilterChange: (filter: BookingFilter) => void;
  onSelectBooking: (groupId: string) => void;
  upcomingCount?: number | undefined;
  pendingCount?: number | undefined;
};

export function BookingList({
  bookings,
  total,
  isLoading,
  filter,
  selectedGroupId,
  onFilterChange,
  onSelectBooking,
  upcomingCount,
  pendingCount,
}: BookingListProps) {
  const [search, setSearch] = React.useState("");

  const filtered = React.useMemo(() => {
    if (!search.trim()) return bookings;
    const q = search.toLowerCase();
    return bookings.filter(
      (b) =>
        b.originCityName.toLowerCase().includes(q) ||
        b.destinationCityName.toLowerCase().includes(q) ||
        b.originTerminalName.toLowerCase().includes(q) ||
        b.destinationTerminalName.toLowerCase().includes(q) ||
        b.companyName.toLowerCase().includes(q) ||
        b.seats.some((s) => s.bookingReference.toLowerCase().includes(q)),
    );
  }, [bookings, search]);

  return (
    <Card className="h-full rounded-none ring-0">
      <CardHeader>
        <CardTitle className="font-normal text-xl">My Bookings</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden px-0">

        {/* Filter tabs */}
        <Tabs
          value={filter}
          onValueChange={(v) => onFilterChange(v as BookingFilter)}
        >
          <TabsList className="w-full border-b px-4" variant="line">
            <TabsTrigger className="text-xs" value="upcoming">
              Upcoming{upcomingCount !== undefined ? ` (${upcomingCount})` : ""}
            </TabsTrigger>
            <TabsTrigger className="text-xs" value="pending">
              Pending{pendingCount !== undefined && pendingCount > 0 ? ` (${pendingCount})` : ""}
            </TabsTrigger>
            <TabsTrigger className="text-xs" value="past">
              Past
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search */}
        <div className="px-4">
          <InputGroup className="h-8">
            <InputGroupInput
              className="h-8"
              aria-label="Search bookings"
              placeholder="Search by city or ref..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>
        </div>

        {/* List */}
        <ScrollArea className="h-0 flex-1">
          <div className="flex flex-col gap-3 px-4 pb-4">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-32 animate-pulse rounded-xl border bg-muted/40"
                />
              ))
            ) : filtered.length === 0 ? (
              <div className="grid min-h-48 place-items-center rounded-xl border border-dashed text-muted-foreground text-sm">
                {search
                  ? "No bookings match your search."
                  : filter === "upcoming"
                    ? "No upcoming trips."
                    : filter === "pending"
                      ? "No pending payments."
                      : "No past bookings."}
              </div>
            ) : (
              filtered.map((booking) => (
                <BookingCard
                  key={booking.groupId}
                  booking={booking}
                  active={booking.groupId === selectedGroupId}
                  onSelect={onSelectBooking}
                />
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer count */}
        {!isLoading && filtered.length > 0 && (
          <div className="px-4 pb-2 text-muted-foreground text-xs">
            Showing {filtered.length} of {total} booking
            {total !== 1 ? "s" : ""}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
