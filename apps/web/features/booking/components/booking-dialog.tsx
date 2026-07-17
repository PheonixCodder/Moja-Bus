"use client";

import { Suspense } from "react";
import { useQueryState } from "nuqs";
import { Dialog, DialogContent } from "@moja/ui/components/ui/dialog";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { BookingDialogFlow } from "./booking-dialog-flow";

export function BookingDialog() {
  const [offerId, setOfferId] = useQueryState("bookingOfferId", { history: "push" });

  return (
    <Dialog open={!!offerId} onOpenChange={(open) => !open && setOfferId(null)}>
      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-slate-50 border-slate-200 max-h-[85vh] flex flex-col">
        {offerId && (
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[400px]">
                <Spinner className="size-8 text-[#ee237c]" />
              </div>
            }
          >
            <BookingDialogFlow offerId={offerId} onClose={() => setOfferId(null)} />
          </Suspense>
        )}
      </DialogContent>
    </Dialog>
  );
}
