"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { formatPriceXOF } from "@/features/search/lib/format";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import type { RouterOutputs } from "@/trpc/client";
import type { PaymentProvider } from "@moja/schemas/payments";
import { cn } from "@moja/ui/lib/utils";

type TripDetails = RouterOutputs["booking"]["getTripDetails"];

const PAYMENT_METHODS: Array<{
  id: PaymentProvider;
  label: string;
  description: string;
  available: boolean;
}> = [
  {
    id: "MOCK",
    label: "Mock payment (beta)",
    description: "Simulated payment — no real charge",
    available: true,
  },
  {
    id: "MTN_MOMO",
    label: "MTN Mobile Money",
    description: "Coming soon",
    available: false,
  },
  {
    id: "ORANGE_MONEY",
    label: "Orange Money",
    description: "Coming soon",
    available: false,
  },
  {
    id: "WAVE",
    label: "Wave",
    description: "Coming soon",
    available: false,
  },
  {
    id: "CARD",
    label: "Card",
    description: "Coming soon",
    available: false,
  },
];

interface BookingCheckoutFormProps {
  offerId: string;
  tripDetails: TripDetails;
  selectedSeatIds: string[];
  selectedLabels: string[];
  onBack: () => void;
  onConfirmed: (result: {
    holdId: string;
    bookingReferences: string[];
    ticketTokens: string[];
    totalAmountXOF: number;
  }) => void;
}

export function BookingCheckoutForm({
  offerId,
  tripDetails,
  selectedSeatIds,
  selectedLabels,
  onBack,
  onConfirmed,
}: BookingCheckoutFormProps) {
  const trpc = useTRPC();
  const [passengerName, setPassengerName] = useState("");
  const [passengerPhone, setPassengerPhone] = useState("");
  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider>("MOCK");

  const createHoldMutation = useMutation(trpc.booking.createHold.mutationOptions());
  const initiatePaymentMutation = useMutation(
    trpc.booking.initiatePayment.mutationOptions(),
  );
  const confirmMutation = useMutation(
    trpc.booking.confirmBooking.mutationOptions(),
  );

  const totalAmount = tripDetails.priceXOF * selectedSeatIds.length;
  const isSubmitting =
    createHoldMutation.isPending ||
    initiatePaymentMutation.isPending ||
    confirmMutation.isPending;

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();

    if (!passengerName.trim() || !passengerPhone.trim()) {
      toast.error("Please enter passenger name and phone number");
      return;
    }

    const method = PAYMENT_METHODS.find((m) => m.id === paymentProvider);
    if (!method?.available) {
      toast.error("This payment method is not available yet");
      return;
    }

    try {
      const hold = await createHoldMutation.mutateAsync({
        offerId,
        seatIds: selectedSeatIds,
        passenger: {
          passengerName: passengerName.trim(),
          passengerPhone: passengerPhone.trim(),
        },
      });

      await initiatePaymentMutation.mutateAsync({
        holdId: hold.holdId,
        provider: paymentProvider as "MOCK" | "WAVE" | "ORANGE_MONEY" | "MTN_MOMO" | "CINETPAY" | "CARD",
      });

      const confirmed = await confirmMutation.mutateAsync({
        holdId: hold.holdId,
      });

      onConfirmed({
        holdId: confirmed.holdId,
        bookingReferences: confirmed.bookingReferences,
        ticketTokens: confirmed.ticketTokens,
        totalAmountXOF: confirmed.totalAmountXOF,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Booking failed. Please try again.";
      toast.error(message);
    }
  }

  return (
    <form onSubmit={handlePay} className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2">
        <h3 className="text-sm font-bold text-slate-800">Booking summary</h3>
        <p className="text-xs text-slate-600">
          {tripDetails.companyName} · {tripDetails.originCityName} →{" "}
          {tripDetails.destinationCityName}
        </p>
        <p className="text-xs text-slate-600">
          Seats: {selectedLabels.join(", ")} ({selectedSeatIds.length})
        </p>
        <p className="text-lg font-black text-[#ee237c]">
          {formatPriceXOF(totalAmount)}
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="passenger-name">Passenger full name</Label>
          <Input
            id="passenger-name"
            value={passengerName}
            onChange={(e) => setPassengerName(e.target.value)}
            placeholder="Full name as on ID"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="passenger-phone">Phone number</Label>
          <Input
            id="passenger-phone"
            type="tel"
            value={passengerPhone}
            onChange={(e) => setPassengerPhone(e.target.value)}
            placeholder="+225 07 00 00 00 00"
            required
          />
          <p className="text-[11px] text-muted-foreground">
            Same contact details apply to all seats in this booking.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Payment method</Label>
        <div className="grid gap-2">
          {PAYMENT_METHODS.map((method) => (
            <button
              key={method.id}
              type="button"
              disabled={!method.available}
              onClick={() => setPaymentProvider(method.id)}
              className={cn(
                "rounded-xl border p-3 text-left transition-colors",
                paymentProvider === method.id
                  ? "border-[#ee237c] bg-pink-50/50"
                  : "border-slate-200 hover:border-slate-300",
                !method.available && "opacity-50 cursor-not-allowed",
              )}
            >
              <p className="text-sm font-semibold text-slate-800">{method.label}</p>
              <p className="text-xs text-slate-500">{method.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
          Back to seats
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-[#ee237c] hover:bg-[#d01867] text-white font-bold"
        >
          {isSubmitting ? (
            <>
              <Spinner className="mr-2 size-4" />
              Processing...
            </>
          ) : (
            "Complete payment"
          )}
        </Button>
      </div>
    </form>
  );
}
