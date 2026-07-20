"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { cn } from "@moja/ui/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@moja/ui/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@moja/ui/components/ui/dialog";
import { Label } from "@moja/ui/components/ui/label";
import { useTRPC } from "@/trpc/client";
import { formatDepartureTime, formatPriceXOF } from "@/features/search/lib/format";
import { useStaffPermissions } from "@/features/operator/hooks/use-staff-permissions";

type RefundChannel = "CASH" | "VOUCHER" | "WALLET";

export function BookingDetailDrawer({
  bookingId,
  open,
  onClose,
}: {
  bookingId: string;
  open: boolean;
  onClose: () => void;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { can } = useStaffPermissions();
  const canCancel = can("bookings:update");
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [refundChannel, setRefundChannel] = useState<RefundChannel>("WALLET");
  const [cancelReason, setCancelReason] = useState("");

  const { data: booking, isLoading } = useQuery({
    ...trpc.operator.getBooking.queryOptions({ bookingId }),
    enabled: open,
  });

  const isGuest = !booking?.userId;

  useEffect(() => {
    if (isGuest && refundChannel === "WALLET") {
      setRefundChannel("CASH");
    }
  }, [isGuest, refundChannel]);

  const cancelMutation = useMutation(
    trpc.operator.cancelBooking.mutationOptions({
      onSuccess: () => {
        toast.success("Booking cancelled and refund initiated.");
        setIsCancelModalOpen(false);
        void queryClient.invalidateQueries(
          trpc.operator.listBookings.pathFilter(),
        );
        onClose();
      },
      onError: (err) => {
        toast.error(err.message || "Failed to cancel booking");
      },
    }),
  );

  const handleConfirmCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;
    if (!cancelReason.trim()) {
      toast.error("Please supply a cancellation reason for auditing purposes.");
      return;
    }
    if (isGuest && refundChannel === "WALLET") {
      toast.error("Wallet refund is not available for guest bookings.");
      return;
    }
    cancelMutation.mutate({
      bookingReference: booking.bookingReference,
      channel: refundChannel,
      reason: cancelReason.trim(),
    });
  };

  return (
    <>
      <Drawer open={open} onOpenChange={(v) => !v && onClose()} direction="right">
        <DrawerContent className="!inset-y-0 !right-0 !left-auto !w-full !max-w-md flex flex-col">
          <DrawerHeader className="border-b border-border px-5 py-4 shrink-0">
            <DrawerTitle className="text-base font-bold">
              Booking details
            </DrawerTitle>
            <DrawerDescription className="text-xs">
              {booking?.bookingReference ?? "Loading…"}
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 text-sm">
            {isLoading || !booking ? (
              <div className="flex justify-center py-12">
                <Spinner className="size-6 text-primary" />
              </div>
            ) : (
              <>
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">
                    Passenger
                  </p>
                  <p className="font-semibold mt-1">{booking.passengerName}</p>
                  <p className="text-muted-foreground">
                    {booking.passengerPhone}
                  </p>
                  {isGuest ? (
                    <p className="text-[11px] text-amber-700 mt-1">
                      Legacy guest booking — cash or voucher refund only.
                    </p>
                  ) : null}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">
                    Route
                  </p>
                  <p className="font-semibold mt-1">
                    {booking.originTerminalName} →{" "}
                    {booking.destinationTerminalName}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {booking.originCityName} → {booking.destinationCityName}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase text-muted-foreground">
                      Seat
                    </p>
                    <p className="font-mono font-bold mt-1">
                      {booking.seatLabel}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-muted-foreground">
                      Fare
                    </p>
                    <p className="font-bold text-neon mt-1">
                      {formatPriceXOF(booking.farePaidXOF)}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">
                    Departure
                  </p>
                  <p className="mt-1">
                    {formatDepartureTime(booking.departureTime)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">
                    Check-in
                  </p>
                  <p className="mt-1">
                    {booking.checkedInAt
                      ? formatDepartureTime(booking.checkedInAt)
                      : "Not checked in"}
                  </p>
                </div>

                {canCancel &&
                booking.status === "CONFIRMED" &&
                new Date(booking.departureTime) > new Date() ? (
                  <div className="pt-4 border-t border-border mt-6">
                    <Button
                      variant="destructive"
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-bold"
                      onClick={() => setIsCancelModalOpen(true)}
                    >
                      Cancel Booking & Refund
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <DialogContent className="max-w-md border border-border bg-white rounded-lg p-6">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="size-5 text-red-600" />
              Cancel Booking & Request Refund
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Are you sure you want to cancel this passenger&apos;s booking?
              This action permanently deactivates their ticket.
            </DialogDescription>
          </DialogHeader>

          {booking ? (
            <form onSubmit={handleConfirmCancel} className="space-y-4 py-2">
              <div className="rounded-md border border-slate-100 bg-slate-50 p-3.5 space-y-1">
                <div className="text-xs text-slate-500">Refund Summary:</div>
                <div className="text-sm font-bold text-slate-900 flex justify-between">
                  <span>Refund Amount (Base Fare):</span>
                  <span>{formatPriceXOF(booking.farePaidXOF)}</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Note: Passenger convenience fees are non-refundable.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Refund Method
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      {
                        id: "WALLET" as const,
                        label: "Wallet",
                        hint: "Moja Wallet",
                        disabled: isGuest,
                      },
                      {
                        id: "VOUCHER" as const,
                        label: "Voucher",
                        hint: "Moja Voucher",
                        disabled: false,
                      },
                      {
                        id: "CASH" as const,
                        label: "Cash",
                        hint: "Manual Cash",
                        disabled: false,
                      },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={opt.disabled}
                      onClick={() => setRefundChannel(opt.id)}
                      className={cn(
                        "p-2.5 rounded-md border text-center text-xs font-semibold transition-all",
                        opt.disabled && "opacity-40 cursor-not-allowed",
                        refundChannel === opt.id
                          ? "border-red-600 bg-red-50 text-red-700"
                          : "border-slate-200 hover:border-slate-300 text-slate-700",
                      )}
                    >
                      {opt.label}
                      <span className="block text-[8px] text-slate-400 font-normal mt-0.5">
                        {opt.disabled ? "Unavailable" : opt.hint}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="operator-cancel-reason"
                  className="text-xs font-bold text-slate-700 uppercase tracking-wider"
                >
                  Cancellation Reason *
                </Label>
                <Input
                  id="operator-cancel-reason"
                  type="text"
                  placeholder="Reason for cancellation..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  required
                />
              </div>

              <DialogFooter className="pt-4 gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9"
                  onClick={() => setIsCancelModalOpen(false)}
                >
                  Keep Booking
                </Button>
                <Button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white h-9"
                  disabled={cancelMutation.isPending}
                >
                  {cancelMutation.isPending ? (
                    <>
                      <Spinner className="mr-2 size-3.5 text-white" />
                      Cancelling...
                    </>
                  ) : (
                    "Confirm Cancel"
                  )}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
