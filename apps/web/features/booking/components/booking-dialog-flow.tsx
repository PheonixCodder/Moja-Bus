"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryState, parseAsInteger, parseAsFloat } from "nuqs";
import { AlertTriangle } from "lucide-react";
import { cn } from "@moja/ui/lib/utils";
import { formatPriceXOF } from "@/features/search/lib/format";
import { buttonVariants } from "@moja/ui/components/ui/button";
import { Button } from "@moja/ui/components/ui/button";
import { DialogHeader, DialogTitle, DialogDescription } from "@moja/ui/components/ui/dialog";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { PassengerSeatMap } from "./passenger-seat-map";
import { BookingCheckoutForm } from "./booking-checkout-form";
import { TripSummaryCard } from "./trip-summary-card";
import { clampPassengerCount } from "../lib/params";

export function BookingDialogFlow({ offerId, onClose }: { offerId: string; onClose: () => void }) {
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

  // M28: detect when the live fare differs from the price the passenger saw
  // at search time (e.g. the operator raised fares during the login
  // redirect). We surface a warning and block checkout until they accept.
  const [expectedPrice] = useQueryState("expectedPrice", parseAsFloat);
  const priceChanged = expectedPrice != null && expectedPrice !== tripDetails.priceXOF;
  const [priceAccepted, setPriceAccepted] = useState(false);

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
    // M28: require explicit acknowledgement of a price change before allowing
    // the passenger to reach the payment step.
    if (priceChanged && !priceAccepted) {
      return;
    }
    setStep("checkout");
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-slate-50 overflow-y-auto">
      <DialogHeader className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10">
        <DialogTitle className="text-lg font-bold text-slate-900">Book your trip</DialogTitle>
        <DialogDescription className="text-xs text-slate-500">
          {passengerCount} passenger{passengerCount > 1 ? "s" : ""}
        </DialogDescription>
      </DialogHeader>

      <main className="flex-1 p-4 sm:p-6 space-y-6">
        {priceChanged && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">Price updated since you searched</p>
              <p className="text-xs text-amber-800">
                The fare for this trip changed from{" "}
                {formatPriceXOF(expectedPrice as number)} to{" "}
                {formatPriceXOF(tripDetails.priceXOF)}. Please review the new
                price before continuing.
              </p>
              {!priceAccepted && (
                <button
                  type="button"
                  onClick={() => setPriceAccepted(true)}
                  className="mt-2 inline-flex items-center rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700"
                >
                  I understand, continue
                </button>
              )}
            </div>
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <TripSummaryCard
            trip={tripDetails}
            seatCount={selectedSeatIds.length || passengerCount}
            showStops
          />
        </section>

        {isSoldOut ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-slate-700 font-semibold">This segment is sold out.</p>
            <Button onClick={onClose} className={cn(buttonVariants(), "mt-4")}>
              Search other trips
            </Button>
          </section>
        ) : step === "seats" ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
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

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleContinue}
                disabled={
                  selectedSeatIds.length !== passengerCount ||
                  (priceChanged && !priceAccepted)
                }
                className="bg-[#ee237c] hover:bg-[#d01867] text-white font-bold"
              >
                Continue to checkout
              </Button>
            </div>
          </section>
        ) : (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
            <BookingCheckoutForm
              offerId={offerId}
              tripDetails={tripDetails}
              selectedSeatIds={selectedSeatIds}
              selectedLabels={selectedLabels}
              onBack={() => setStep("seats")}
              onConfirmed={(result) => {
                onClose();
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
