"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@moja/ui/lib/utils";
import { buttonVariants } from "@moja/ui/components/ui/button";
import { Button } from "@moja/ui/components/ui/button";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@moja/ui/components/ui/dialog";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouter } from "@/i18n/navigation";
import { PassengerSeatMap } from "./passenger-seat-map";
import { BookingCheckoutForm } from "./booking-checkout-form";
import { TripSummaryCard } from "./trip-summary-card";
import { authClient } from "@/lib/auth-client";
import { buildLoginUrl } from "@/features/auth/lib/safe-callback-url";
import { buildBookingSuccessUrl } from "@/features/payments/lib/booking-success-url";
import { useBooking } from "./booking-context";

export function BookingDialogFlow({
  offerId,
  onClose,
}: {
  offerId: string;
  onClose: () => void;
}) {
  const t = useTranslations("booking");
  const trpc = useTRPC();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { step, setStep, selectedSeatIds, toggleSeat, passengerCount } =
    useBooking();

  const { data: tripDetails } = useSuspenseQuery({
    ...trpc.booking.getTripDetails.queryOptions({ offerId }),
    staleTime: 60 * 1000,
  });
  const { data: seatAvailability, refetch: refetchSeats } = useSuspenseQuery({
    ...trpc.booking.getSeatAvailability.queryOptions({ offerId }),
    staleTime: 15 * 1000,
  });

  const selectedLabels = useMemo(
    () =>
      selectedSeatIds.map(
        (id) =>
          seatAvailability.seats.find((s) => s.seatId === id)?.label ?? id,
      ),
    [selectedSeatIds, seatAvailability.seats],
  );

  const isSoldOut = tripDetails.availability.status === "SOLD_OUT";

  function handleContinue() {
    if (selectedSeatIds.length !== passengerCount) {
      return;
    }
    if (!session?.user) {
      // Require login — persist offer + seats for resume after auth (not guest pay).
      const searchParams = new URLSearchParams(
        typeof window !== "undefined" ? window.location.search : "",
      );
      searchParams.set("bookingOfferId", offerId);
      searchParams.set("seatIds", selectedSeatIds.join(","));
      const returnPath = `/search?${searchParams.toString()}`;
      router.push(buildLoginUrl(returnPath));
      return;
    }

    setStep("checkout");
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-slate-50 overflow-y-auto">
      <DialogHeader className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10">
        <DialogTitle className="text-lg font-bold text-slate-900">
          {t("title")}
        </DialogTitle>
        <DialogDescription className="text-xs text-slate-500">
          {t("dialog.passengerCount", { count: passengerCount })}
        </DialogDescription>
      </DialogHeader>

      <main className="flex-1 p-4 sm:p-6 space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <TripSummaryCard
            trip={tripDetails}
            seatCount={selectedSeatIds.length || passengerCount}
            showStops
          />
        </section>

        {isSoldOut ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-slate-700 font-semibold">{t("dialog.soldOut")}</p>
            <Button onClick={onClose} className={cn(buttonVariants(), "mt-4")}>
              {t("dialog.searchOther")}
            </Button>
          </section>
        ) : step === "seats" ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                {t("dialog.selectSeats", { count: passengerCount })}
              </h3>
              <span className="text-xs text-slate-500">
                {t("dialog.selectedOf", {
                  selected: selectedSeatIds.length,
                  total: passengerCount,
                })}
              </span>
            </div>

            <PassengerSeatMap
              rows={seatAvailability.rows}
              columns={seatAvailability.columns}
              seats={seatAvailability.seats}
              deck={seatAvailability.deck}
              selectedSeatIds={selectedSeatIds}
              onToggleSeat={toggleSeat}
              maxSelection={passengerCount}
            />

            <div className="flex justify-center pt-2">
              <Button
                onClick={handleContinue}
                disabled={selectedSeatIds.length !== passengerCount}
                className="bg-[#ee237c] hover:bg-[#d01867] text-white font-bold"
              >
                {t("dialog.continueCheckout")}
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
              onSeatConflict={async () => {
                setStep("seats");
                await refetchSeats();
              }}
              onConfirmed={(result) => {
                router.push(
                  buildBookingSuccessUrl(
                    offerId,
                    { ...result, status: "CONFIRMED" },
                    passengerCount,
                  ),
                );
              }}
            />
          </section>
        )}
      </main>
    </div>
  );
}
