"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { DigitalTicketCard } from "@/features/booking/components/digital-ticket-card";

interface PublicTicketViewProps {
  ticketToken: string;
}

export function PublicTicketView({ ticketToken }: PublicTicketViewProps) {
  const trpc = useTRPC();
  const { data: ticket } = useSuspenseQuery(
    trpc.booking.getTicketByToken.queryOptions({ ticketToken }),
  );

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex gap-3 items-start">
        <ShieldCheck className="size-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-sm text-emerald-900">
          <p className="font-semibold">Valid ticket</p>
          <p className="text-emerald-800/90 mt-0.5">
            Show this screen or the QR code below to staff when boarding. Keep
            your phone brightness up for faster scanning.
          </p>
        </div>
      </div>

      <DigitalTicketCard ticket={ticket} />

      <p className="text-center text-xs text-slate-500">
        Reference {ticket.bookingReference} · Seat {ticket.seatLabel}
      </p>
    </div>
  );
}
