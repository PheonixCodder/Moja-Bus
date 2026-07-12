"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Share2, AlertTriangle } from "lucide-react";
import { cn } from "@moja/ui/lib/utils";
import { Button, buttonVariants } from "@moja/ui/components/ui/button";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@moja/ui/components/ui/dialog";
import { useTRPC } from "@/trpc/client";
import { DigitalTicketCard } from "@/features/booking/components/digital-ticket-card";
import { formatPriceXOF } from "@/features/search/lib/format";
import { toast } from "sonner";

export function TicketDetailView({
  bookingReference,
}: {
  bookingReference: string;
}) {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [refundChannel, setRefundChannel] = useState<"WALLET" | "VOUCHER">("WALLET");
  const [cancelReason, setCancelReason] = useState("");

  const { data: ticket, isLoading, isError } = useQuery(
    trpc.booking.getTicket.queryOptions({ bookingReference }),
  );

  const cancelMutation = useMutation(
    trpc.payments.cancelBooking.mutationOptions({
      onSuccess: () => {
        toast.success("Booking cancelled and refund initiated.");
        setIsCancelModalOpen(false);
        queryClient.invalidateQueries(trpc.booking.listMyBookings.pathFilter());
        router.push("/dashboard/bookings");
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to cancel booking");
      },
    })
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

  const isCancellable = new Date(ticket.departureTime) > new Date();

  const handleCancelBooking = (e: React.FormEvent) => {
    e.preventDefault();
    cancelMutation.mutate({
      bookingReference: ticket.bookingReference,
      channel: refundChannel,
      reason: cancelReason.trim() || undefined,
    });
  };

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

      {isCancellable && (
        <div className="pt-2">
          <Button
            variant="destructive"
            className="w-full h-10 font-bold bg-red-600 hover:bg-red-700 text-white"
            onClick={() => setIsCancelModalOpen(true)}
          >
            Cancel Booking & Refund
          </Button>
        </div>
      )}

      {/* Cancellation Modal */}
      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <DialogContent className="max-w-md border border-border bg-white rounded-lg p-6">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="size-5 text-red-600" />
              Cancel Booking & Request Refund
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Are you sure you want to cancel your seat? This action permanently deactivates your ticket.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCancelBooking} className="space-y-4 py-2">
            <div className="rounded-md border border-slate-100 bg-slate-50 p-3.5 space-y-1">
              <div className="text-xs text-slate-500">Refund Summary:</div>
              <div className="text-sm font-bold text-slate-900 flex justify-between">
                <span>Refund Amount (Base Fare):</span>
                <span>{formatPriceXOF(ticket.farePaidXOF)}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Note: Passenger convenience fees are non-refundable.
              </p>
            </div>

            {/* Refund Method */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Refund Method
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRefundChannel("WALLET")}
                  className={cn(
                    "p-3 rounded-md border text-center text-xs font-semibold transition-all",
                    refundChannel === "WALLET"
                      ? "border-red-600 bg-red-50 text-red-700"
                      : "border-slate-200 hover:border-slate-300 text-slate-700"
                  )}
                >
                  Wallet Refund
                  <span className="block text-[9px] text-slate-400 font-normal mt-0.5">
                    Moja Ride Wallet (Instant)
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setRefundChannel("VOUCHER")}
                  className={cn(
                    "p-3 rounded-md border text-center text-xs font-semibold transition-all",
                    refundChannel === "VOUCHER"
                      ? "border-red-600 bg-red-50 text-red-700"
                      : "border-slate-200 hover:border-slate-300 text-slate-700"
                  )}
                >
                  Voucher Refund
                  <span className="block text-[9px] text-slate-400 font-normal mt-0.5">
                    Moja Ride Voucher
                  </span>
                </button>
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <Label htmlFor="cancel-reason" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Cancellation Reason (Optional)
              </Label>
              <Input
                id="cancel-reason"
                type="text"
                placeholder="e.g., plans changed"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-4 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                className="h-9"
                onClick={() => setIsCancelModalOpen(false)}
              >
                Keep booking
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
