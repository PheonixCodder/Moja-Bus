"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { PhoneInput } from "@moja/ui/components/ui/phone-input";
import { Label } from "@moja/ui/components/ui/label";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { CreditCard, Wallet } from "lucide-react";
import { formatPriceXOF } from "@/features/search/lib/format";
import { formatLocationLabel } from "@/lib/format-location-label";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RouterOutputs } from "@/trpc/client";
import { useSession } from "@/lib/auth-client";
import { usePaystackCheckout } from "@/features/payments/hooks/use-paystack-checkout";
import { resolveCheckoutPayable } from "@/features/payments/lib/checkout-payable";

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
  /** P2-24: called when hold fails with CONFLICT so UI can refresh seats. */
  onSeatConflict?: () => void | Promise<void>;
  onConfirmed: (result: {
    holdId: string;
    bookingReferences: string[];
    ticketTokens: string[];
    totalAmountXOF: number;
    successUrl?: string;
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
  onSeatConflict,
  onConfirmed,
}: BookingCheckoutFormProps) {
  const t = useTranslations("discounts");
  const tBooking = useTranslations("booking");
  const locale = useLocale();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const isLoggedIn = Boolean(session?.user);

  const [assignments, setAssignments] = useState<SeatAssignment[]>(() =>
    buildInitialAssignments(selectedSeatIds, selectedLabels),
  );

  const [paymentMethod, setPaymentMethod] = useState<"PAYSTACK" | "WALLET">("PAYSTACK");
  const [promoCode, setPromoCode] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | undefined>(undefined);
  const [selectedVoucherId, setSelectedVoucherId] = useState<string | undefined>(
    undefined,
  );

  const pricingQuery = useQuery({
    ...trpc.payments.getCheckoutPricing.queryOptions({
      offerId,
      seatCount: selectedSeatIds.length,
      paymentMethod,
      code: appliedCode,
      monetaryVoucherId: selectedVoucherId,
      autoApply: true,
      useCredits: true,
    }),
    staleTime: 10 * 1000,
  });

  const vouchersQuery = useQuery({
    ...trpc.discounts.listMyVouchers.queryOptions({ includeExpired: false }),
    enabled: isLoggedIn,
    staleTime: 30 * 1000,
  });

  const savedQuery = useQuery({
    ...trpc.passenger.listSaved.queryOptions(),
    enabled: isLoggedIn,
    staleTime: 5 * 60 * 1000,
  });

  const walletQuery = useQuery({
    ...trpc.passenger.getWalletBalance.queryOptions(),
    enabled: isLoggedIn,
    staleTime: 30 * 1000,
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
  const releaseHoldMutation = useMutation(trpc.booking.releaseHold.mutationOptions());
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
        payableXOF?: number;
        displayFeeXOF?: number;
        quoteId?: string;
        ticketDiscountXOF?: number;
        feeDiscountXOF?: number;
        creditAppliedXOF?: number;
        voucherAppliedXOF?: number;
        preDiscountSubtotalXOF?: number;
        autoAppliedCampaignId?: string | null;
        discountOk?: boolean;
        discountRejection?: { code: string; messageKey: string } | null;
        voucherRejection?: { code: string; messageKey: string } | null;
      }
    | undefined;
  const preDiscountSubtotalXOF =
    pricing?.preDiscountSubtotalXOF ??
    tripDetails.priceXOF * selectedSeatIds.length;
  const subtotalBaseXOF =
    pricing?.subtotalBaseXOF ?? tripDetails.priceXOF * selectedSeatIds.length;
  const ticketDiscountXOF = pricing?.ticketDiscountXOF ?? 0;
  const creditAppliedXOF = pricing?.creditAppliedXOF ?? 0;

  const payableResolved = {
    payableXOF:
      pricing?.payableXOF ??
      resolveCheckoutPayable({
        postDiscountSubtotalXOF: subtotalBaseXOF,
        convenienceFeeXOF: pricing?.convenienceFeeXOF ?? 0,
        ticketDiscountXOF,
        feeDiscountXOF: pricing?.feeDiscountXOF ?? 0,
        creditAppliedXOF,
        chargeAmountXOF:
          pricing?.chargeAmountXOF ??
          tripDetails.priceXOF * selectedSeatIds.length,
        paymentMethod,
      }).payableXOF,
    displayFeeXOF:
      pricing?.displayFeeXOF ??
      resolveCheckoutPayable({
        postDiscountSubtotalXOF: subtotalBaseXOF,
        convenienceFeeXOF: pricing?.convenienceFeeXOF ?? 0,
        ticketDiscountXOF,
        feeDiscountXOF: pricing?.feeDiscountXOF ?? 0,
        creditAppliedXOF,
        chargeAmountXOF:
          pricing?.chargeAmountXOF ??
          tripDetails.priceXOF * selectedSeatIds.length,
        paymentMethod,
      }).displayFeeXOF,
  };
  const convenienceFeeXOF = payableResolved.displayFeeXOF;
  const totalAmount = payableResolved.payableXOF;
  const isZeroCash = totalAmount === 0;
  const walletAvailable = walletBalance?.availableBalance ?? 0;
  const canPayWithWallet = isLoggedIn && (isZeroCash || walletAvailable >= totalAmount);

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
      if (!isZeroCash && walletAvailable < totalAmount) {
        toast.error("Insufficient wallet balance");
        return;
      }
    }

    try {
      if (!pricing?.quoteId) {
        toast.error("Pricing is still loading. Please wait a moment.");
        return;
      }
      const { getDeviceHash } = await import(
        "@/features/discounts/lib/device-hash"
      );
      const deviceHash = await getDeviceHash();
      const hold = await createHoldMutation.mutateAsync({
        offerId,
        quoteId: pricing.quoteId,
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
        discount: {
          code: appliedCode,
          monetaryVoucherId: selectedVoucherId,
          autoApply: true,
          useCredits: true,
        },
        ...(deviceHash ? { deviceHash } : {}),
      });

      try {
        if (paymentMethod === "PAYSTACK" && totalAmount > 0) {
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
            ...(confirmed.successUrl
              ? { successUrl: confirmed.successUrl }
              : {}),
          });
        } else {
          // WALLET or zero-cash (credits/voucher covered)
          const confirmed = await walletCheckoutMutation.mutateAsync({
            holdId: hold.holdId,
            locale: locale === "fr" ? "fr" : "en",
          });

          void queryClient.invalidateQueries(
            trpc.passenger.getWalletBalance.queryFilter(),
          );

          onConfirmed({
            holdId: confirmed.holdId,
            bookingReferences: confirmed.bookingReferences,
            ticketTokens: confirmed.ticketTokens,
            totalAmountXOF: confirmed.totalAmountXOF,
            ...(confirmed.successUrl
              ? { successUrl: confirmed.successUrl }
              : {}),
          });
        }
      } catch (payErr: unknown) {
        // P1-18: keep hold on Paystack popup cancel (user may return via pending-pay);
        // release on hard confirm failures so seats + incentives are not stranded.
        if (!(payErr instanceof PaystackPaymentCancelledError)) {
          try {
            await releaseHoldMutation.mutateAsync({ holdId: hold.holdId });
          } catch (releaseErr) {
            console.error("Failed to release hold after confirm error:", releaseErr);
          }
        }
        throw payErr;
      }
    } catch (err: unknown) {
      if (err instanceof PaystackPaymentCancelledError) {
        toast.error(tBooking("checkout.paymentCancelled"));
        return;
      }
      const trpcErr = err as {
        data?: { code?: string };
        message?: string;
      };
      if (trpcErr?.data?.code === "CONFLICT") {
        toast.error(tBooking("checkout.seatConflict"));
        await onSeatConflict?.();
        return;
      }
      const message =
        err instanceof Error
          ? err.message
          : tBooking("checkout.bookingFailed");
      toast.error(message);
    }
  }

  return (
    <form onSubmit={handlePay} className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2">
        <h3 className="text-sm font-bold text-slate-800">Booking summary</h3>
        <p className="text-xs text-slate-600">
          {tripDetails.companyName} · {formatLocationLabel({ cityName: tripDetails.originCityName, municipalityName: tripDetails.originMunicipalityName, quarterName: tripDetails.originQuarterName, isUrban: tripDetails.serviceType === "URBAN" })} →{" "}
          {formatLocationLabel({ cityName: tripDetails.destinationCityName, municipalityName: tripDetails.destinationMunicipalityName, quarterName: tripDetails.destinationQuarterName, isUrban: tripDetails.serviceType === "URBAN" })}
        </p>
        <p className="text-xs text-slate-600">
          Seats: {selectedLabels.join(", ")} ({selectedSeatIds.length})
        </p>
        <div className="space-y-1 pt-1 text-sm text-slate-700">
          <div className="flex justify-between">
            <span>Fare</span>
            <span>{formatPriceXOF(preDiscountSubtotalXOF)}</span>
          </div>
          {ticketDiscountXOF > 0 ? (
            <div className="flex justify-between text-emerald-700">
              <span>
                {pricing?.autoAppliedCampaignId && !appliedCode
                  ? t("discountAuto")
                  : appliedCode
                    ? `${t("discount")} (${appliedCode})`
                    : t("discount")}
              </span>
              <span>-{formatPriceXOF(ticketDiscountXOF)}</span>
            </div>
          ) : null}
          {convenienceFeeXOF > 0 ? (
            <div className="flex justify-between">
              <span>Service fee</span>
              <span>{formatPriceXOF(convenienceFeeXOF)}</span>
            </div>
          ) : null}
          {creditAppliedXOF > 0 ? (
            <div className="flex justify-between text-emerald-700">
              <span>{t("credits")}</span>
              <span>-{formatPriceXOF(creditAppliedXOF)}</span>
            </div>
          ) : null}
          <div className="flex justify-between text-base font-black text-[#ee237c]">
            <span>Total</span>
            <span>{formatPriceXOF(totalAmount)}</span>
          </div>
        </div>
        <div className="space-y-2 border-t border-slate-200 pt-3">
          <Label htmlFor="promo-code" className="text-xs font-semibold text-slate-700">
            {t("promoCode")}
          </Label>
          <div className="flex gap-2">
            <Input
              id="promo-code"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder={t("promoPlaceholder")}
              className="h-9 bg-white uppercase"
              disabled={Boolean(appliedCode) || isSubmitting}
            />
            {appliedCode ? (
              <Button
                type="button"
                variant="outline"
                className="h-9"
                disabled={isSubmitting}
                onClick={() => {
                  setAppliedCode(undefined);
                  setPromoCode("");
                }}
              >
                {t("remove")}
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="h-9"
                disabled={!promoCode.trim() || isSubmitting || pricingQuery.isFetching}
                onClick={() => setAppliedCode(promoCode.trim().toUpperCase())}
              >
                {t("apply")}
              </Button>
            )}
          </div>
          {pricing?.discountOk === false && appliedCode ? (
            <p className="text-xs text-destructive">
              {(() => {
                const key = pricing.discountRejection?.messageKey?.replace(
                  /^discounts\./,
                  "",
                );
                if (
                  key === "errors.invalidCode" ||
                  key === "errors.codeExpired" ||
                  key === "errors.codePersonal" ||
                  key === "errors.codeExhausted" ||
                  key === "errors.campaignMissing" ||
                  key === "errors.zeroDiscount" ||
                  key === "errors.inactive" ||
                  key === "errors.wrongOperator" ||
                  key === "errors.noOptIn" ||
                  key === "errors.routeScope" ||
                  key === "errors.scheduleScope" ||
                  key === "errors.tripScope" ||
                  key === "errors.budget"
                ) {
                  return t(key);
                }
                return t("codeRejected");
              })()}
            </p>
          ) : null}
          {isLoggedIn && (vouchersQuery.data?.length ?? 0) > 0 ? (
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">
                {t("voucher")}
              </Label>
              <select
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm"
                value={selectedVoucherId ?? ""}
                onChange={(e) =>
                  setSelectedVoucherId(e.target.value || undefined)
                }
                disabled={isSubmitting}
              >
                <option value="">{t("noVoucher")}</option>
                {vouchersQuery.data
                  ?.filter(
                    (v) =>
                      !v.scheduleId ||
                      v.scheduleId === tripDetails.scheduleId,
                  )
                  .map((v) => (
                  <option key={v.id} value={v.id}>
                    {formatPriceXOF(v.remainingAmountXOF)}
                    {v.scheduleId
                      ? ` · ${v.schedule?.route?.name ?? "schedule"}`
                      : ` · ${v.source}`}
                  </option>
                ))}
              </select>
              {pricing?.voucherRejection && selectedVoucherId ? (
                <p className="text-xs text-destructive">
                  {(() => {
                    const key = pricing.voucherRejection.messageKey?.replace(
                      /^discounts\./,
                      "",
                    );
                    if (
                      key === "errors.voucherInactive" ||
                      key === "errors.voucherExpired" ||
                      key === "errors.voucherEmpty" ||
                      key === "errors.voucherScheduleMismatch"
                    ) {
                      return t(key);
                    }
                    return t("errors.voucherInactive");
                  })()}
                </p>
              ) : null}
            </div>
          ) : null}
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
                      className="h-10 w-full border-slate-200 bg-white text-sm focus-visible:ring-primary"
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
            disabled={!canPayWithWallet}
            onClick={() => setPaymentMethod("WALLET")}
            className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all relative ${
              paymentMethod === "WALLET"
                ? "border-primary bg-primary/5 text-primary shadow-xs"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50/50"
            } ${!canPayWithWallet ? "opacity-50 cursor-not-allowed bg-slate-50/50" : ""}`}
          >
            <Wallet className="size-5 shrink-0" />
            <div>
              <p className="text-xs font-bold font-sans">Moja Wallet Balance</p>
              <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                {isLoggedIn
                  ? isZeroCash
                    ? "Covered by promo — no wallet debit"
                    : `Available: ${formatPriceXOF(walletAvailable)} · Due: ${formatPriceXOF(totalAmount)}`
                  : "Sign in to pay with wallet"}
              </p>
            </div>
          </button>
        </div>

        {/* Info alerts */}
        {paymentMethod === "WALLET" && isZeroCash ? (
          <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3 text-xs text-emerald-800 leading-relaxed">
            <strong>Covered by promo</strong>: This booking is fully covered by
            credits and/or vouchers. Confirming will not debit your cash wallet.
          </div>
        ) : null}

        {paymentMethod === "WALLET" && !isZeroCash ? (
          <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3 text-xs text-emerald-800 leading-relaxed">
            <strong>Moja Wallet Checkout Benefit</strong>: Service convenience fees are fully waived (0 XOF) when paying with your internal wallet balance.
          </div>
        ) : null}

        {isLoggedIn && paymentMethod === "PAYSTACK" && canPayWithWallet && !isZeroCash ? (
          <p className="text-[10px] text-slate-500 italic">
            Tip: Switch to Wallet Balance to waive the convenience fee!
          </p>
        ) : null}

        {isLoggedIn && !canPayWithWallet && !isZeroCash ? (
          <div className="rounded-lg bg-amber-50 border border-amber-100 p-3 text-xs text-amber-800 flex items-center justify-between gap-2">
            <span>
              Your wallet balance is insufficient for this booking (need{" "}
              {formatPriceXOF(totalAmount)}).
            </span>
            <Link
              href="/dashboard/wallet"
              className="text-[#ee237c] font-bold hover:underline shrink-0"
              target="_blank"
            >
              Top-Up Wallet →
            </Link>
          </div>
        ) : null}
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
            paymentMethod === "WALLET"
              ? isZeroCash
                ? "Confirm (promo covers fare)"
                : "Complete with Wallet"
              : "Complete payment"
          )}
        </Button>
      </div>
    </form>
  );
}
