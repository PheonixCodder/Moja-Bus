"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { formatPriceXOF } from "@/features/search/lib/format";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { RouterOutputs } from "@/trpc/client";
import type { PaymentProvider } from "@moja/schemas/payments";
import { cn } from "@moja/ui/lib/utils";
import { useSession } from "@/lib/auth-client";

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
  const [paymentProvider, setPaymentProvider] =
    useState<PaymentProvider>("MOCK");

  const savedQuery = useQuery({
    ...trpc.passenger.listSaved.queryOptions(),
    enabled: isLoggedIn,
  });

  const savedPassengers = savedQuery.data?.items ?? [];
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

    const method = PAYMENT_METHODS.find((m) => m.id === paymentProvider);
    if (!method?.available) {
      toast.error("This payment method is not available yet");
      return;
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

      await initiatePaymentMutation.mutateAsync({
        holdId: hold.holdId,
        provider: paymentProvider as
          | "MOCK"
          | "WAVE"
          | "ORANGE_MONEY"
          | "MTN_MOMO"
          | "CINETPAY"
          | "CARD",
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
                    <Input
                      id={`phone-${row.seatId}`}
                      type="tel"
                      value={row.passengerPhone}
                      onChange={(e) =>
                        updateAssignment(row.seatId, {
                          passengerPhone: e.target.value,
                        })
                      }
                      placeholder="+225 07 00 00 00 00"
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
