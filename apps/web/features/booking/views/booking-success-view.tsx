"use client";

import Link from "next/link";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@moja/ui/lib/utils";
import { buttonVariants } from "@moja/ui/components/ui/button";
import { formatPriceXOF } from "@/features/search/lib/format";
import { useTRPC } from "@/trpc/client";
import { DigitalTicketCard } from "@/features/booking/components/digital-ticket-card";
import { TripSummaryCard } from "@/features/booking/components/trip-summary-card";

interface BookingSuccessViewProps {
  offerId: string;
  references: string[];
  tokens: string[];
  total: number;
}

function TicketFromToken({ token }: { token: string }) {
  const trpc = useTRPC();
  const { data: ticket } = useSuspenseQuery(
    trpc.booking.getTicketByToken.queryOptions({ ticketToken: token }),
  );
  return <DigitalTicketCard ticket={ticket} compact />;
}

export function BookingSuccessView({
  offerId,
  references,
  tokens,
  total,
}: BookingSuccessViewProps) {
  const trpc = useTRPC();
  const { data: tripDetails } = useSuspenseQuery(
    trpc.booking.getTripDetails.queryOptions({ offerId }),
  );

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center space-y-3">
          <CheckCircle2 className="size-12 text-emerald-500 mx-auto" />
          <h1 className="text-2xl font-bold text-slate-900">Booking confirmed</h1>
          <p className="text-sm text-slate-600">
            Your digital tickets are ready. Show the QR code when boarding.
          </p>
          {total > 0 && (
            <p className="text-sm font-bold text-[#ee237c]">
              Total paid: {formatPriceXOF(total)}
            </p>
          )}
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <TripSummaryCard trip={tripDetails} showStops={false} />
        </section>

        {references.length > 0 && (
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-left space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Booking references
            </p>
            <ul className="text-sm font-mono text-slate-800 space-y-1">
              {references.map((ref) => (
                <li key={ref}>{ref}</li>
              ))}
            </ul>
          </div>
        )}

        {tokens.length > 0 && (
          <div className="space-y-4">
            {tokens.map((token) => (
              <TicketFromToken key={token} token={token} />
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Link
            href="/"
            className={cn(
              buttonVariants(),
              "bg-[#ee237c] hover:bg-[#d01867] justify-center",
            )}
          >
            Search more trips
          </Link>
          <Link
            href="/dashboard/bookings"
            className={cn(buttonVariants({ variant: "outline" }), "justify-center")}
          >
            View my bookings
          </Link>
        </div>
      </div>
    </div>
  );
}
