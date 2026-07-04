"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryState, parseAsInteger } from "nuqs";
import { ArrowLeft } from "lucide-react";
import { cn } from "@moja/ui/lib/utils";
import { buttonVariants } from "@moja/ui/components/ui/button";
import { Button } from "@moja/ui/components/ui/button";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { PassengerSeatMap } from "../components/passenger-seat-map";
import { BookingCheckoutForm } from "../components/booking-checkout-form";
import { TripSummaryCard } from "../components/trip-summary-card";
import { clampPassengerCount } from "../lib/params";

interface BookingOfferViewProps {
  offerId: string;
}

export function BookingOfferView({ offerId }: BookingOfferViewProps) {
  const trpc = useTRPC();
  const router = useRouter();
  const [step, setStep] = useState<"seats" | "checkout">("seats");
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [passengersParam] = useQueryState(
    "passengers",
    parseAsInteger.withDefault(1),
  );
  const passengerCount = clampPassengerCount(passengersParam);

  const { data: tripDetails } = useSuspenseQuery(
    trpc.booking.getTripDetails.queryOptions({ offerId }),
  );
  const { data: seatAvailability } = useSuspenseQuery(
    trpc.booking.getSeatAvailability.queryOptions({ offerId }),
  );

  const selectedLabels = useMemo(
    () =>
      selectedSeatIds.map(
        (id) =>
          seatAvailability.seats.find((s) => s.seatId === id)?.label ?? id,
      ),
    [selectedSeatIds, seatAvailability.seats],
  );

  const isSoldOut = tripDetails.availability.status === "SOLD_OUT";

  function toggleSeat(seatId: string) {
    setSelectedSeatIds((prev) => {
      if (prev.includes(seatId)) {
        return prev.filter((id) => id !== seatId);
      }
      if (prev.length >= passengerCount) {
        return prev;
      }
      return [...prev, seatId];
    });
  }

  function handleContinue() {
    if (selectedSeatIds.length !== passengerCount) {
      return;
    }
    setStep("checkout");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            <ArrowLeft className="size-4 mr-1" />
            Back to search
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Book your trip</h1>
            <p className="text-xs text-slate-500">
              {passengerCount} passenger{passengerCount > 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <TripSummaryCard
            trip={tripDetails}
            seatCount={selectedSeatIds.length || passengerCount}
            showStops
          />
        </section>

        {isSoldOut ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-slate-700 font-semibold">This segment is sold out.</p>
            <Link href="/" className={cn(buttonVariants(), "mt-4")}>
              Search other trips
            </Link>
          </section>
        ) : step === "seats" ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                Select {passengerCount} seat{passengerCount > 1 ? "s" : ""}
              </h3>
              <span className="text-xs text-slate-500">
                {selectedSeatIds.length} / {passengerCount} selected
              </span>
            </div>

            <PassengerSeatMap
              rows={seatAvailability.rows}
              columns={seatAvailability.columns}
              seats={seatAvailability.seats}
              selectedSeatIds={selectedSeatIds}
              onToggleSeat={toggleSeat}
              maxSelection={passengerCount}
            />

            <div className="flex justify-end">
              <Button
                onClick={handleContinue}
                disabled={selectedSeatIds.length !== passengerCount}
                className="bg-[#ee237c] hover:bg-[#d01867] text-white font-bold"
              >
                Continue to checkout
              </Button>
            </div>
          </section>
        ) : (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <BookingCheckoutForm
              offerId={offerId}
              tripDetails={tripDetails}
              selectedSeatIds={selectedSeatIds}
              selectedLabels={selectedLabels}
              onBack={() => setStep("seats")}
              onConfirmed={(result) => {
                const params = new URLSearchParams({
                  refs: result.bookingReferences.join(","),
                  tokens: result.ticketTokens.join(","),
                  total: String(result.totalAmountXOF),
                  passengers: String(passengerCount),
                });
                router.push(
                  `/book/${encodeURIComponent(offerId)}/success?${params}`,
                );
              }}
            />
          </section>
        )}
      </main>
    </div>
  );
}
