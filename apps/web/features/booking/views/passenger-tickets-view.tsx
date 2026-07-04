"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Ticket } from "lucide-react";
import { cn } from "@moja/ui/lib/utils";
import { buttonVariants } from "@moja/ui/components/ui/button";
import { Button } from "@moja/ui/components/ui/button";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { useTRPC } from "@/trpc/client";
import { DigitalTicketCard } from "@/features/booking/components/digital-ticket-card";
import { PassengerTripCard } from "@/features/booking/components/passenger-trip-card";

function TicketBlock({
  bookingReference,
  ticketToken,
}: {
  bookingReference: string;
  ticketToken: string;
}) {
  const trpc = useTRPC();
  const { data: ticket, isLoading, isError } = useQuery(
    trpc.booking.getTicket.queryOptions({ bookingReference }),
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner className="size-6 text-[#ee237c]" />
      </div>
    );
  }

  if (isError || !ticket) {
    return (
      <p className="text-sm text-red-600 text-center py-4">
        Could not load ticket QR.{" "}
        <Link
          href={`/tickets/${encodeURIComponent(ticketToken)}`}
          className="underline font-semibold"
        >
          Open public ticket link
        </Link>
      </p>
    );
  }

  return <DigitalTicketCard ticket={ticket} compact />;
}

export function PassengerTicketsView() {
  const trpc = useTRPC();
  const { data, isLoading, isError, error, refetch } = useQuery(
    trpc.booking.listMyBookings.queryOptions({ filter: "upcoming" }),
  );

  const confirmed = data?.items.filter((b) => b.status === "CONFIRMED") ?? [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="size-8 text-[#ee237c]" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center max-w-lg">
        <p className="text-red-800 font-medium">Could not load tickets</p>
        <p className="text-sm text-red-600 mt-1">
          {error instanceof Error ? error.message : "Something went wrong"}
        </p>
        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  if (confirmed.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center max-w-lg">
        <Ticket className="size-12 mx-auto mb-4 text-slate-300" />
        <p className="text-slate-600 font-medium">
          No active tickets yet. Complete a booking to get your digital QR
          tickets here.
        </p>
        <Link
          href="/"
          className={cn(
            buttonVariants(),
            "mt-6 bg-[#ee237c] hover:bg-[#d01867] text-white font-bold",
          )}
        >
          Search trips
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {confirmed.reduce((n, b) => n + b.seats.length, 0)} active ticket
        {confirmed.reduce((n, b) => n + b.seats.length, 0) === 1 ? "" : "s"}
      </p>

      {confirmed.flatMap((booking) =>
        booking.seats.map((seat) => (
          <section key={seat.bookingReference} className="space-y-4">
            <PassengerTripCard booking={booking} />
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3 text-center">
                Seat {seat.seatLabel} · {seat.bookingReference}
              </p>
              <TicketBlock
                bookingReference={seat.bookingReference}
                ticketToken={seat.ticketToken}
              />
              <div className="mt-4 flex justify-center">
                <Link
                  href={`/dashboard/tickets/${encodeURIComponent(seat.bookingReference)}`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Full screen ticket
                </Link>
              </div>
            </div>
          </section>
        )),
      )}
    </div>
  );
}
