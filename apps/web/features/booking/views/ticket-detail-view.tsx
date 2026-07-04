"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Share2 } from "lucide-react";
import { cn } from "@moja/ui/lib/utils";
import { buttonVariants } from "@moja/ui/components/ui/button";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { useTRPC } from "@/trpc/client";
import { DigitalTicketCard } from "@/features/booking/components/digital-ticket-card";

export function TicketDetailView({
  bookingReference,
}: {
  bookingReference: string;
}) {
  const trpc = useTRPC();
  const { data: ticket, isLoading, isError } = useQuery(
    trpc.booking.getTicket.queryOptions({ bookingReference }),
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="size-8 text-[#ee237c]" />
      </div>
    );
  }

  if (isError || !ticket) {
    return (
      <div className="max-w-lg mx-auto text-center space-y-4 py-12">
        <p className="text-slate-700 font-semibold">Ticket not found</p>
        <p className="text-sm text-slate-500">
          This booking may belong to another account, or the reference is invalid.
        </p>
        <Link
          href="/dashboard/tickets"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Back to tickets
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto w-full pb-8">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/dashboard/tickets"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          <ArrowLeft className="size-4 mr-1" />
          All tickets
        </Link>
        <Link
          href={`/tickets/${encodeURIComponent(ticket.ticketToken)}`}
          target="_blank"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
        >
          <Share2 className="size-3.5" />
          Share link
        </Link>
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        Show this QR code to staff when boarding. Keep your screen brightness up.
      </div>

      <DigitalTicketCard ticket={ticket} />

      <p className="text-xs text-center text-slate-500">
        Reference {ticket.bookingReference} · Seat {ticket.seatLabel}
      </p>
    </div>
  );
}
