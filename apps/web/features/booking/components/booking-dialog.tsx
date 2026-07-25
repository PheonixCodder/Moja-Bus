"use client";

import { Suspense } from "react";
import { useQueryState } from "nuqs";
import { parseAsInteger } from "nuqs";
import { Dialog, DialogContent } from "@moja/ui/components/ui/dialog";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { BookingDialogFlow } from "./booking-dialog-flow";
import { BookingProvider } from "./booking-context";
import { clampPassengerCount } from "../lib/params";

export function BookingDialog() {
  const [offerId, setOfferId] = useQueryState("bookingOfferId", { history: "push" });
  const [passengersParam] = useQueryState("passengers", parseAsInteger.withDefault(1));
  const passengerCount = clampPassengerCount(passengersParam);

  function handleClose() {
    setOfferId(null);
  }

  return (
    <Dialog open={!!offerId} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-slate-50 border-slate-200 max-h-[85vh] flex flex-col">
        {offerId && (
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[400px]">
                <Spinner className="size-8 text-[#ee237c]" />
              </div>
            }
          >
            <BookingProvider passengerCount={passengerCount}>
              <BookingDialogFlow offerId={offerId} onClose={handleClose} />
            </BookingProvider>
          </Suspense>
        )}
      </DialogContent>
    </Dialog>
  );
}
