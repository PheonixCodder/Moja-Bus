"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { PhoneInput } from "@moja/ui/components/ui/phone-input";
import { Label } from "@moja/ui/components/ui/label";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { CreditCard, Wallet } from "lucide-react";
import { formatPriceXOF } from "@/features/search/lib/format";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { RouterOutputs } from "@/trpc/client";
import { useSession } from "@/lib/auth-client";
import { usePaystackCheckout } from "@/features/payments/hooks/use-paystack-checkout";

type TripDetails = RouterOutputs["booking"]["getTripDetails"];

type AssignmentMode = "saved" | "manual";

interface SeatAssignment {
  seatId: string;
  seatLabel: string;
  mode: AssignmentMode;
  savedPassengerId: string;
  passengerName: string;
  passengerPhone: string;
}

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

function buildInitialAssignments(
  seatIds: string[],
  labels: string[],
): SeatAssignment[] {
  return seatIds.map((seatId, index) => ({
    seatId,
    seatLabel: labels[index] ?? seatId,
    mode: "manual" as const,
    savedPassengerId: "",
    passengerName: "",
    passengerPhone: "",
  }));
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
  const { data: session } = useSession();
  const isLoggedIn = Boolean(session?.user);

  const [assignments, setAssignments] = useState<SeatAssignment[]>(() =>
    buildInitialAssignments(selectedSeatIds, selectedLabels),
  );

  const [paymentMethod, setPaymentMethod] = useState<"PAYSTACK" | "WALLET">("PAYSTACK");

  const pricingQuery = useQuery({
    ...trpc.payments.getCheckoutPricing.queryOptions({
      offerId,
      seatCount: selectedSeatIds.length,
    }),
  });

  const savedQuery = useQuery({
    ...trpc.passenger.listSaved.queryOptions(),
    enabled: isLoggedIn,
  });

  const walletQuery = useQuery({
    ...trpc.passenger.getWalletBalance.queryOptions(),
    enabled: isLoggedIn,
  });

  const savedPassengers = savedQuery.data?.items ?? [];
  const walletBalance = walletQuery.data;
  
  const defaultSavedId = useMemo(() => {
    const self = savedPassengers.find((p) => p.isSelf);
    return self?.id ?? savedPassengers[0]?.id ?? "";
  }, [savedPassengers]);

  useEffect(() => {
    setAssignments(buildInitialAssignments(selectedSeatIds, selectedLabels));
  }, [selectedSeatIds, selectedLabels]);

  useEffect(() => {
    if (!isLoggedIn || !defaultSavedId || savedPassengers.length === 0) {
      return;
    }

    setAssignments((prev) =>
      prev.map((row) => {
        if (row.passengerName || row.savedPassengerId) {
          return row;
        }
        const saved = savedPassengers.find((p) => p.id === defaultSavedId);
        if (!saved) return row;
        return {
          ...row,
          mode: "saved",
          savedPassengerId: saved.id,
          passengerName: saved.fullName,
          passengerPhone: saved.phone,
        };
      }),
    );
  }, [isLoggedIn, defaultSavedId, savedPassengers]);

  const createHoldMutation = useMutation(trpc.booking.createHold.mutationOptions());
  const walletCheckoutMutation = useMutation(trpc.booking.checkoutWithWallet.mutationOptions());
  const {
    completePayment,
    isPending: isPaymentPending,
    PaystackPaymentCancelledError,
  } = usePaystackCheckout();

  const pricing = pricingQuery.data as
    | {
        subtotalBaseXOF: number;
        convenienceFeeXOF: number;
        chargeAmountXOF: number;
      }
    | undefined;
  const subtotalBaseXOF =
    pricing?.subtotalBaseXOF ?? tripDetails.priceXOF * selectedSeatIds.length;
  
  // Platform policy: waives convenience fee for WALLET checkouts
  const convenienceFeeXOF = paymentMethod === "WALLET" ? 0 : (pricing?.convenienceFeeXOF ?? 0);
  const totalAmount = paymentMethod === "WALLET" ? subtotalBaseXOF : (pricing?.chargeAmountXOF ?? subtotalBaseXOF);

  const isSubmitting = createHoldMutation.isPending || isPaymentPending || walletCheckoutMutation.isPending;

  function updateAssignment(
    seatId: string,
    patch: Partial<SeatAssignment>,
  ) {
    setAssignments((prev) =>
      prev.map((row) => (row.seatId === seatId ? { ...row, ...patch } : row)),
    );
  }

  function applySavedToAll(savedPassengerId: string) {
    const saved = savedPassengers.find((p) => p.id === savedPassengerId);
    if (!saved) return;

    setAssignments((prev) =>
      prev.map((row) => ({
        ...row,
        mode: "saved",
        savedPassengerId: saved.id,
        passengerName: saved.fullName,
        passengerPhone: saved.phone,
      })),
    );
  }

  function handleSavedChange(seatId: string, savedPassengerId: string) {
    if (savedPassengerId === "manual") {
      updateAssignment(seatId, {
        mode: "manual",
        savedPassengerId: "",
        passengerName: "",
        passengerPhone: "",
      });
      return;
    }

    const saved = savedPassengers.find((p) => p.id === savedPassengerId);
    if (!saved) return;

    updateAssignment(seatId, {
      mode: "saved",
      savedPassengerId: saved.id,
      passengerName: saved.fullName,
      passengerPhone: saved.phone,
    });
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();

    for (const row of assignments) {
      if (row.mode === "saved") {
        if (!row.savedPassengerId) {
          toast.error(`Select a passenger for seat ${row.seatLabel}`);
          return;
        }
      } else if (!row.passengerName.trim() || !row.passengerPhone.trim()) {
        toast.error(`Enter name and phone for seat ${row.seatLabel}`);
        return;
      }
    }

    if (paymentMethod === "WALLET") {
      if (!isLoggedIn) {
        toast.error("You must be logged in to pay with wallet balance");
        return;
      }
      if ((walletBalance?.availableBalance ?? 0) < totalAmount) {
        toast.error("Insufficient wallet balance");
        return;
      }
    }

    try {
      const hold = await createHoldMutation.mutateAsync({
        offerId,
        passengers: assignments.map((row) =>
          row.mode === "saved" && row.savedPassengerId
            ? { seatId: row.seatId, savedPassengerId: row.savedPassengerId }
            : {
                seatId: row.seatId,
                passenger: {
                  passengerName: row.passengerName.trim(),
                  passengerPhone: row.passengerPhone.trim(),
                },
              },
        ),
      });

      if (paymentMethod === "PAYSTACK") {
        const confirmed = await completePayment({
          holdId: hold.holdId,
          payerEmail: session?.user?.email ?? null,
        });

        if (!confirmed) {
          return;
        }

        onConfirmed({
          holdId: confirmed.holdId,
          bookingReferences: confirmed.bookingReferences,
          ticketTokens: confirmed.ticketTokens,
          totalAmountXOF: confirmed.totalAmountXOF,
        });
      } else {
        // WALLET Checkout
        const confirmed = await walletCheckoutMutation.mutateAsync({
          holdId: hold.holdId,
        });

        onConfirmed({
          holdId: confirmed.holdId,
          bookingReferences: confirmed.bookingReferences,
          ticketTokens: confirmed.ticketTokens,
          totalAmountXOF: confirmed.totalAmountXOF,
        });
      }
    } catch (err: unknown) {
      if (err instanceof PaystackPaymentCancelledError) {
        toast.error("Payment was cancelled");
        return;
      }
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
        <div className="space-y-1 pt-1 text-sm text-slate-700">
          <div className="flex justify-between">
            <span>Fare</span>
            <span>{formatPriceXOF(subtotalBaseXOF)}</span>
          </div>
          {convenienceFeeXOF > 0 ? (
            <div className="flex justify-between">
              <span>Service fee</span>
              <span>{formatPriceXOF(convenienceFeeXOF)}</span>
            </div>
          ) : null}
          <div className="flex justify-between text-base font-black text-[#ee237c]">
            <span>Total</span>
            <span>{formatPriceXOF(totalAmount)}</span>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {paymentMethod === "WALLET" 
            ? "Service convenience fees waived for paying with internal wallet balance." 
            : "Prices are tax-inclusive. Service fee supports secure card and mobile money checkout."}
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label className="text-base">Passengers per seat</Label>
          {isLoggedIn && savedPassengers.length > 0 ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Apply to all:</span>
              <select
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs"
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) applySavedToAll(e.target.value);
                  e.target.value = "";
                }}
              >
                <option value="" disabled>
                  Choose passenger
                </option>
                {savedPassengers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName}
                    {p.label ? ` (${p.label})` : ""}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        {!isLoggedIn ? (
          <p className="text-xs text-muted-foreground">
            <Link href="/login" className="text-[#ee237c] font-semibold hover:underline">
              Sign in
            </Link>{" "}
            to use saved passengers, or enter details manually below.
          </p>
        ) : null}

        <div className="space-y-3">
          {assignments.map((row) => (
            <div
              key={row.seatId}
              className="rounded-xl border border-slate-200 bg-white p-4 space-y-3"
            >
              <p className="text-sm font-bold text-slate-800">
                Seat {row.seatLabel}
              </p>

              {isLoggedIn && savedPassengers.length > 0 ? (
                <div className="space-y-1.5">
                  <Label htmlFor={`passenger-select-${row.seatId}`}>
                    Passenger
                  </Label>
                  <select
                    id={`passenger-select-${row.seatId}`}
                    className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                    value={
                      row.mode === "manual" ? "manual" : row.savedPassengerId
                    }
                    onChange={(e) =>
                      handleSavedChange(row.seatId, e.target.value)
                    }
                  >
                    {savedPassengers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName}
                        {p.label ? ` — ${p.label}` : ""}
                      </option>
                    ))}
                    <option value="manual">Enter manually</option>
                  </select>
                </div>
              ) : null}

              {row.mode === "manual" || !isLoggedIn || savedPassengers.length === 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor={`name-${row.seatId}`}>Full name</Label>
                    <Input
                      id={`name-${row.seatId}`}
                      value={row.passengerName}
                      onChange={(e) =>
                        updateAssignment(row.seatId, {
                          passengerName: e.target.value,
                        })
                      }
                      placeholder="Full name as on ID"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`phone-${row.seatId}`}>Phone number</Label>
                    <PhoneInput
                      id={`phone-${row.seatId}`}
                      value={row.passengerPhone}
                      onChange={(val) =>
                        updateAssignment(row.seatId, {
                          passengerPhone: val || "",
                        })
                      }
                      required
                    />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  {row.passengerName} · {row.passengerPhone}
                </p>
              )}
            </div>
          ))}
        </div>

        {isLoggedIn ? (
          <p className="text-[11px] text-muted-foreground">
            Manage saved passengers in{" "}
            <Link
              href="/dashboard/passengers"
              className="text-[#ee237c] font-semibold hover:underline"
            >
              your dashboard
            </Link>
            .
          </p>
        ) : null}
      </div>

      {/* Payment Selector Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-800">Payment Options</p>
          <p className="text-xs text-slate-500">
            Choose a checkout method below to complete seat registration.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Card / Mobile Money */}
          <button
            type="button"
            onClick={() => setPaymentMethod("PAYSTACK")}
            className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
              paymentMethod === "PAYSTACK"
                ? "border-primary bg-primary/5 text-primary shadow-xs"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50/50"
            }`}
          >
            <CreditCard className="size-5 shrink-0" />
            <div>
              <p className="text-xs font-bold font-sans">Card / Mobile Money</p>
              <p className="text-[10px] text-slate-500 font-sans mt-0.5">Pay via Paystack checkout</p>
            </div>
          </button>

          {/* Wallet Balance */}
          <button
            type="button"
            disabled={!isLoggedIn || (walletBalance?.availableBalance ?? 0) < subtotalBaseXOF}
            onClick={() => setPaymentMethod("WALLET")}
            className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all relative ${
              paymentMethod === "WALLET"
                ? "border-primary bg-primary/5 text-primary shadow-xs"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50/50"
            } ${(!isLoggedIn || (walletBalance?.availableBalance ?? 0) < subtotalBaseXOF) ? "opacity-50 cursor-not-allowed bg-slate-50/50" : ""}`}
          >
            <Wallet className="size-5 shrink-0" />
            <div>
              <p className="text-xs font-bold font-sans">Moja Wallet Balance</p>
              <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                {isLoggedIn
                  ? `Available: ${formatPriceXOF(walletBalance?.availableBalance ?? 0)}`
                  : "Sign in to pay with wallet"}
              </p>
            </div>
          </button>
        </div>

        {/* Info alerts */}
        {paymentMethod === "WALLET" && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3 text-xs text-emerald-800 leading-relaxed">
            <strong>Moja Wallet Checkout Benefit</strong>: Service convenience fees are fully waived (0 XOF) when paying with your internal wallet balance.
          </div>
        )}

        {isLoggedIn && paymentMethod === "PAYSTACK" && (walletBalance?.availableBalance ?? 0) >= subtotalBaseXOF && (
          <p className="text-[10px] text-slate-500 italic">
            Tip: Switch to Wallet Balance to waive the convenience fee!
          </p>
        )}

        {isLoggedIn && (walletBalance?.availableBalance ?? 0) < subtotalBaseXOF && (
          <div className="rounded-lg bg-amber-50 border border-amber-100 p-3 text-xs text-amber-800 flex items-center justify-between gap-2">
            <span>Your wallet balance is insufficient for this booking.</span>
            <Link
              href="/dashboard/wallet"
              className="text-[#ee237c] font-bold hover:underline shrink-0"
              target="_blank"
            >
              Top-Up Wallet →
            </Link>
          </div>
        )}
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
            paymentMethod === "WALLET" ? "Complete with Wallet" : "Complete payment"
          )}
        </Button>
      </div>
    </form>
  );
}
