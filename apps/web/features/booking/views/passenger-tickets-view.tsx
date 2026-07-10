"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Ticket, Search, QrCode, ArrowRight, ShieldCheck, MapPin, Calendar, Clock, Armchair } from "lucide-react";
import { cn } from "@moja/ui/lib/utils";
import { buttonVariants } from "@moja/ui/components/ui/button";
import { Button } from "@moja/ui/components/ui/button";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { useTRPC } from "@/trpc/client";
import { DigitalTicketCard } from "@/features/booking/components/digital-ticket-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@moja/ui/components/ui/dialog";
import type { PassengerBookingSummary } from "@moja/types";
import { formatDepartureTime } from "@/features/search/lib/format";

function TicketDialog({
  bookingReference,
  ticketToken,
  isOpen,
  onClose,
}: {
  bookingReference: string;
  ticketToken: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const trpc = useTRPC();
  const { data: ticket, isLoading, isError } = useQuery(
    trpc.booking.getTicket.queryOptions({ bookingReference }),
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-border bg-bg-surface max-w-lg rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-text-primary">Digital Boarding Pass</DialogTitle>
          <DialogDescription className="text-xs">
            Present this QR code to the driver or terminal agent during check-in.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner className="size-8 text-primary" />
          </div>
        ) : isError || !ticket ? (
          <div className="py-12 text-center space-y-4">
            <p className="text-sm text-error font-medium">Could not load ticket details</p>
            <Link
              href={`/tickets/${encodeURIComponent(ticketToken)}`}
              target="_blank"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Open public ticket link
            </Link>
          </div>
        ) : (
          <div className="py-4 space-y-6">
            <DigitalTicketCard ticket={ticket} />
            <div className="flex justify-center gap-3">
              <Button
                variant="ghost"
                onClick={onClose}
                className="h-10 text-xs font-semibold text-text-secondary hover:bg-bg-elevated"
              >
                Close
              </Button>
              <Link
                href={`/tickets/${encodeURIComponent(ticketToken)}`}
                target="_blank"
                className={cn(buttonVariants({ variant: "outline" }), "h-10 px-6 text-xs font-semibold border-border text-text-primary hover:bg-bg-elevated")}
              >
                Full screen view
              </Link>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function PassengerTicketsView() {
  const trpc = useTRPC();
  
  // Selected seat ticket for showing QR Code Dialog
  const [activeTicket, setActiveTicket] = useState<{
    bookingReference: string;
    ticketToken: string;
  } | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery(
    trpc.booking.listMyBookings.queryOptions({ filter: "upcoming" }),
  );

  const confirmed = data?.items.filter((b) => b.status === "CONFIRMED") ?? [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-error/20 bg-error/5 p-6 text-center max-w-lg">
        <p className="text-error font-medium">Could not load tickets</p>
        <p className="text-sm text-text-muted mt-1">
          {error instanceof Error ? error.message : "Something went wrong"}
        </p>
        <Button variant="outline" className="mt-4 border-border text-text-primary" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  if (confirmed.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-bg-surface p-12 text-center max-w-lg flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 bg-bg-elevated text-text-muted rounded-full flex items-center justify-center">
          <Ticket className="size-6 text-text-muted" />
        </div>
        <div className="space-y-1">
          <p className="font-bold text-text-primary text-sm">No Active Tickets</p>
          <p className="text-xs text-text-secondary">Complete a booking to get your digital QR tickets here.</p>
        </div>
        <Link
          href="/"
          className={cn(
            buttonVariants(),
            "mt-2 bg-primary hover:bg-primary/95 text-white font-bold h-10 px-6 rounded-lg",
          )}
        >
          Book a Ticket
        </Link>
      </div>
    );
  }

  const activeTicketsCount = confirmed.reduce((n, b) => n + b.seats.length, 0);

  return (
    <div className="space-y-6 max-w-3xl">
      <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest px-1">
        {activeTicketsCount} Active Ticket{activeTicketsCount === 1 ? "" : "s"} Available
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {confirmed.flatMap((booking) =>
          booking.seats.map((seat) => {
            const routeName = `${booking.originCityName} → ${booking.destinationCityName}`;
            return (
              <div
                key={seat.bookingReference}
                className="group relative flex flex-col justify-between p-5 rounded-2xl border border-border/80 bg-bg-surface hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {booking.companyName}
                    </span>
                    <span className="text-[10px] font-bold text-text-muted font-mono tracking-tight uppercase">
                      {seat.bookingReference}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-extrabold text-text-primary tracking-tight truncate">
                      {routeName}
                    </h4>
                    <p className="text-[10px] text-text-secondary mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-text-muted" />
                      {booking.originTerminalName}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-border/50 pt-3">
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-bold text-text-muted uppercase">Departure</p>
                      <p className="font-semibold text-text-primary">
                        {formatDepartureTime(booking.departureTime)}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-bold text-text-muted uppercase">Seat Assigned</p>
                      <p className="font-semibold text-text-primary flex items-center gap-1">
                        <Armchair className="w-3.5 h-3.5 text-text-muted" />
                        {seat.seatLabel}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-text-secondary truncate max-w-[100px]">
                    {seat.passengerName}
                  </span>
                  
                  <Button
                    size="sm"
                    onClick={() => setActiveTicket({
                      bookingReference: seat.bookingReference,
                      ticketToken: seat.ticketToken,
                    })}
                    className="bg-primary text-white hover:bg-primary/95 text-xs font-semibold h-8 rounded-lg gap-1.5 px-3"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    Show Boarding Pass
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Ticket QR Dialog */}
      {activeTicket && (
        <TicketDialog
          bookingReference={activeTicket.bookingReference}
          ticketToken={activeTicket.ticketToken}
          isOpen={activeTicket !== null}
          onClose={() => setActiveTicket(null)}
        />
      )}
    </div>
  );
}
