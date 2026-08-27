"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("passengerDashboard.bookings");
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
        <CardTitle className="font-normal text-xl">{t("title")}</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden px-0">
        <Tabs
          value={filter}
          onValueChange={(v) => onFilterChange(v as BookingFilter)}
        >
          <TabsList className="w-full border-b px-4" variant="line">
            <TabsTrigger className="text-xs" value="upcoming">
              {t("upcoming")}
              {upcomingCount !== undefined ? ` (${upcomingCount})` : ""}
            </TabsTrigger>
            <TabsTrigger className="text-xs" value="pending">
              {t("pending")}
              {pendingCount !== undefined && pendingCount > 0
                ? ` (${pendingCount})`
                : ""}
            </TabsTrigger>
            <TabsTrigger className="text-xs" value="past">
              {t("past")}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="px-4">
          <InputGroup className="h-8">
            <InputGroupInput
              className="h-8"
              aria-label={t("searchAria")}
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>
        </div>

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
                  ? t("emptySearch")
                  : filter === "upcoming"
                    ? t("emptyUpcoming")
                    : filter === "pending"
                      ? t("emptyPending")
                      : t("emptyPast")}
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

        {!isLoading && filtered.length > 0 && (
          <div className="px-4 pb-2 text-muted-foreground text-xs">
            {t(total !== 1 ? "showingCountPlural" : "showingCountSingular", {
              count: filtered.length,
              total,
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
