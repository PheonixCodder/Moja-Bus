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
import { CreditCard, Sparkles, Wallet } from "lucide-react";
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

  const [paymentMethod, setPaymentMethod] = useState<"PAYSTACK" | "WALLET">(
    "PAYSTACK",
  );
  const [promoCode, setPromoCode] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | undefined>(undefined);

  const pricingQuery = useQuery({
    ...trpc.payments.getCheckoutPricing.queryOptions({
      offerId,
      seatCount: selectedSeatIds.length,
      paymentMethod,
      code: appliedCode,
      autoApply: true,
      useCredits: true,
    }),
    staleTime: 10 * 1000,
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

  const createHoldMutation = useMutation(
    trpc.booking.createHold.mutationOptions(),
  );
  const releaseHoldMutation = useMutation(
    trpc.booking.releaseHold.mutationOptions(),
  );
  const checkoutWithWalletMutation = useMutation(
    trpc.booking.checkoutWithWallet.mutationOptions(),
  );
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
        preDiscountSubtotalXOF?: number;
        autoAppliedCampaignId?: string | null;
        discountOk?: boolean;
        discountRejection?: { code: string; messageKey: string } | null;
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
  const canPayWithWallet =
    isLoggedIn && (isZeroCash || walletAvailable >= totalAmount);
  const isSubmitting =
    createHoldMutation.isPending ||
    checkoutWithWalletMutation.isPending ||
    isPaymentPending;

  function updateAssignment(seatId: string, patch: Partial<SeatAssignment>) {
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

  function handleSavedChange(seatId: string, value: string) {
    if (value === "manual") {
      updateAssignment(seatId, {
        mode: "manual",
        savedPassengerId: "",
        passengerName: "",
        passengerPhone: "",
      });
      return;
    }

    const saved = savedPassengers.find((p) => p.id === value);
    if (!saved) return;

    updateAssignment(seatId, {
      mode: "saved",
      savedPassengerId: saved.id,
      passengerName: saved.fullName,
      passengerPhone: saved.phone,
    });
  }

  function validateAssignments(): boolean {
    for (const a of assignments) {
      if (a.mode === "saved") {
        if (!a.savedPassengerId) {
          toast.error(tBooking("selectSavedPassenger", { seat: a.seatLabel }));
          return false;
        }
      } else {
        if (!a.passengerName.trim()) {
          toast.error(tBooking("enterPassengerName", { seat: a.seatLabel }));
          return false;
        }
        if (!a.passengerPhone.trim()) {
          toast.error(tBooking("enterPassengerPhone", { seat: a.seatLabel }));
          return false;
        }
      }
    }
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateAssignments()) return;

    const passengersPayload = assignments.map((a) => {
      if (a.mode === "saved" && a.savedPassengerId) {
        return { seatId: a.seatId, savedPassengerId: a.savedPassengerId };
      }
      return {
        seatId: a.seatId,
        passenger: {
          passengerName: a.passengerName.trim(),
          passengerPhone: a.passengerPhone.trim(),
        },
      };
    });

    let holdResult: RouterOutputs["booking"]["createHold"];
    try {
      holdResult = await createHoldMutation.mutateAsync({
        offerId,
        quoteId: pricing?.quoteId ?? "",
        passengers: passengersPayload,
        discount: appliedCode ? { code: appliedCode } : undefined,
      });
    } catch (err: any) {
      const code = err?.data?.code ?? err?.shape?.data?.code;
      if (code === "CONFLICT") {
        toast.error(tBooking("seatConflictToast"));
        await onSeatConflict?.();
        return;
      }
      toast.error(err?.message ?? tBooking("bookingFailed"));
      return;
    }

    const firstPassenger = assignments[0];
    const customerEmail =
      session?.user?.email ?? `guest-${Date.now()}@mojaride.com`;

    try {
      let confirmed: {
        holdId: string;
        bookingReferences: string[];
        ticketTokens: string[];
        totalAmountXOF?: number;
        successUrl?: string;
      } | null = null;

      if (paymentMethod === "WALLET" || isZeroCash) {
        confirmed = await checkoutWithWalletMutation.mutateAsync({
          holdId: holdResult.holdId,
          locale: locale === "fr" ? "fr" : "en",
        });
      } else {
        confirmed = await completePayment({
          holdId: holdResult.holdId,
          payerEmail: customerEmail,
        });
      }

      if (!confirmed) {
        return;
      }

      toast.success(tBooking("bookingSuccess"));
      onConfirmed({
        holdId: holdResult.holdId,
        bookingReferences: confirmed.bookingReferences,
        ticketTokens: confirmed.ticketTokens,
        totalAmountXOF: totalAmount,
        ...(confirmed.successUrl ? { successUrl: confirmed.successUrl } : {}),
      });
    } catch (err) {
      if (err instanceof PaystackPaymentCancelledError) {
        toast.info(tBooking("paymentCancelled"));
      } else {
        toast.error(
          err instanceof Error ? err.message : tBooking("paymentFailed"),
        );
      }
      try {
        await releaseHoldMutation.mutateAsync({
          holdId: holdResult.holdId,
        });
      } catch {
        // best effort release
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Route & Trip summary */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {tripDetails.companyName}
        </p>
        <p className="text-base font-bold text-foreground">
          {formatLocationLabel({
            cityName: tripDetails.originCityName,
            municipalityName: tripDetails.originMunicipalityName,
            quarterName: tripDetails.originQuarterName,
            isUrban: tripDetails.serviceType === "URBAN",
          })}{" "}
          →{" "}
          {formatLocationLabel({
            cityName: tripDetails.destinationCityName,
            municipalityName: tripDetails.destinationMunicipalityName,
            quarterName: tripDetails.destinationQuarterName,
            isUrban: tripDetails.serviceType === "URBAN",
          })}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatLocationLabel({
            cityName: tripDetails.originCityName,
            municipalityName: tripDetails.originMunicipalityName,
            quarterName: tripDetails.originQuarterName,
            isUrban: tripDetails.serviceType === "URBAN",
          })}{" "}
          ·{" "}
          {new Date(tripDetails.departureTime).toLocaleDateString(locale, {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
        </p>
        <p className="text-xs font-semibold text-foreground">
          {tBooking("checkout.seatsLabel")} {selectedLabels.join(", ")} (
          {selectedSeatIds.length})
        </p>
        <div className="space-y-1 pt-1 text-sm text-foreground">
          <div className="flex justify-between">
            <span>{tBooking("checkout.fare")}</span>
            <span>{formatPriceXOF(preDiscountSubtotalXOF)}</span>
          </div>
          {ticketDiscountXOF > 0 ? (
            <div className="flex justify-between text-success">
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
              <span>{tBooking("checkout.serviceFee")}</span>
              <span>{formatPriceXOF(convenienceFeeXOF)}</span>
            </div>
          ) : (
            <div className="flex justify-between text-muted-foreground text-xs">
              <span>{tBooking("checkout.serviceFee")}</span>
              <span>{paymentMethod === "WALLET" || isZeroCash ? "0 XOF (Waived)" : "0 XOF"}</span>
            </div>
          )}
          {creditAppliedXOF > 0 ? (
            <div className="flex justify-between text-success">
              <span>{t("credits")}</span>
              <span>-{formatPriceXOF(creditAppliedXOF)}</span>
            </div>
          ) : null}
          <div className="flex justify-between text-base font-black text-primary">
            <span>{tBooking("checkout.total")}</span>
            <span>{formatPriceXOF(totalAmount)}</span>
          </div>
        </div>

        <div className="space-y-2 border-t border-border pt-3">
          <Label
            htmlFor="promo-code"
            className="text-xs font-semibold text-foreground"
          >
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
                disabled={
                  !promoCode.trim() || isSubmitting || pricingQuery.isFetching
                }
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
        </div>
        <p className="text-[11px] text-muted-foreground">
          {paymentMethod === "WALLET"
            ? "Service convenience fees waived for paying with internal wallet balance."
            : "Prices are tax-inclusive. Service fee supports secure card and mobile money checkout."}
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label className="text-base">
            {tBooking("checkout.passengersPerSeat")}
          </Label>
          {isLoggedIn && savedPassengers.length > 0 ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">
                {tBooking("checkout.applyToAll")}
              </span>
              <select
                className="rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground"
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) applySavedToAll(e.target.value);
                  e.target.value = "";
                }}
              >
                <option value="" disabled>
                  {tBooking("checkout.choosePassenger")}
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
            <Link
              href="/login"
              className="text-primary font-semibold hover:underline"
            >
              {tBooking("checkout.signInToUseSaved")}
            </Link>{" "}
            {tBooking("checkout.signInToUseSavedSuffix")}
          </p>
        ) : null}

        <div className="space-y-3">
          {assignments.map((row) => (
            <div
              key={row.seatId}
              className="rounded-xl border border-border bg-card p-4 space-y-3"
            >
              <p className="text-sm font-bold text-foreground">
                {tBooking("checkout.seat")} {row.seatLabel}
              </p>

              {isLoggedIn && savedPassengers.length > 0 ? (
                <div className="space-y-1.5">
                  <Label htmlFor={`passenger-select-${row.seatId}`}>
                    {tBooking("checkout.passenger")}
                  </Label>
                  <select
                    id={`passenger-select-${row.seatId}`}
                    className="flex h-9 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground"
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
                    <option value="manual">
                      {tBooking("checkout.enterManually")}
                    </option>
                  </select>
                </div>
              ) : null}

              {row.mode === "manual" ||
              !isLoggedIn ||
              savedPassengers.length === 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor={`name-${row.seatId}`}>
                      {tBooking("checkout.passengerName")}
                    </Label>
                    <Input
                      id={`name-${row.seatId}`}
                      type="text"
                      placeholder={tBooking("checkout.namePlaceholder")}
                      value={row.passengerName}
                      onChange={(e) =>
                        updateAssignment(row.seatId, {
                          passengerName: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`phone-${row.seatId}`}>
                      {tBooking("checkout.passengerPhone")}
                    </Label>
                    <PhoneInput
                      id={`phone-${row.seatId}`}
                      value={row.passengerPhone}
                      onChange={(val?: string) =>
                        updateAssignment(row.seatId, {
                          passengerPhone: val || "",
                        })
                      }
                      required
                      className="h-10 w-full border-border bg-card text-sm focus-visible:ring-primary"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {row.passengerName} · {row.passengerPhone}
                </p>
              )}
            </div>
          ))}
        </div>

        {isLoggedIn ? (
          <p className="text-[11px] text-muted-foreground">
            {tBooking("checkout.manageSavedPassengersIn")}{" "}
            <Link
              href="/dashboard/passengers"
              className="text-primary font-semibold hover:underline"
            >
              {tBooking("checkout.yourDashboard")}
            </Link>
            .
          </p>
        ) : null}
      </div>

      {/* Payment Selector Section */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        {isZeroCash ? (
          <div className="rounded-xl border border-success/20 bg-success/10 p-4 space-y-2">
            <div className="flex items-center gap-2 text-success font-semibold text-sm">
              <Sparkles className="size-4.5 text-success shrink-0" />
              {tBooking("checkout.promoCoveredTitle")}
            </div>
            <p className="text-xs text-success leading-relaxed">
              {tBooking("checkout.promoCoveredDesc")}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {tBooking("checkout.paymentOptions")}
              </p>
              <p className="text-xs text-muted-foreground">
                {tBooking("checkout.paymentOptionsDesc")}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Card / Mobile Money */}
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPaymentMethod("PAYSTACK")}
                className={`flex items-center justify-start gap-3 p-3.5 h-auto rounded-xl border text-left transition-all ${
                  paymentMethod === "PAYSTACK"
                    ? "border-primary bg-primary/5 text-primary shadow-xs hover:bg-primary/10 hover:text-primary"
                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                <CreditCard className="size-5 shrink-0" />
                <div>
                  <p className="text-xs font-bold font-sans">
                    {tBooking("checkout.cardMobileMoney")}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-sans mt-0.5">
                    {tBooking("checkout.payViaPaystack")}
                  </p>
                </div>
              </Button>

              {/* Wallet Balance */}
              <Button
                type="button"
                variant="ghost"
                disabled={!canPayWithWallet}
                onClick={() => setPaymentMethod("WALLET")}
                className={`flex items-center justify-start gap-3 p-3.5 h-auto rounded-xl border text-left transition-all relative ${
                  paymentMethod === "WALLET"
                    ? "border-primary bg-primary/5 text-primary shadow-xs hover:bg-primary/10 hover:text-primary"
                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                } ${!canPayWithWallet ? "opacity-50 cursor-not-allowed bg-muted/40" : ""}`}
              >
                <Wallet className="size-5 shrink-0" />
                <div>
                  <p className="text-xs font-bold font-sans">
                    {tBooking("checkout.walletBalance")}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-sans mt-0.5">
                    {formatPriceXOF(walletAvailable)} {tBooking("checkout.available")}
                  </p>
                </div>
              </Button>
            </div>

            {!canPayWithWallet && paymentMethod === "WALLET" ? (
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                <span>
                  {tBooking("checkout.insufficientBalance", {
                    needed: formatPriceXOF(totalAmount),
                    have: formatPriceXOF(walletAvailable),
                  })}
                </span>
                <Link
                  href="/dashboard/wallet"
                  className="text-primary font-bold hover:underline shrink-0"
                  target="_blank"
                >
                  {tBooking("checkout.topUpWallet")}
                </Link>
              </div>
            ) : null}

            {paymentMethod === "WALLET" && canPayWithWallet ? (
              <div className="rounded-lg bg-success/10 border border-success/20 p-3 text-xs text-success leading-relaxed">
                <strong>{tBooking("checkout.walletBenefitTitle")}</strong>:{" "}
                {tBooking("checkout.walletBenefitDesc")}
              </div>
            ) : null}

            {isLoggedIn && paymentMethod === "PAYSTACK" && canPayWithWallet ? (
              <p className="text-[10px] text-muted-foreground italic">
                {tBooking("checkout.walletTip")}
              </p>
            ) : null}
          </>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
        >
          {tBooking("checkout.backToSeats")}
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-sm"
        >
          {isSubmitting ? (
            <>
              <Spinner className="mr-2 size-4" />
              {tBooking("checkout.processing")}
            </>
          ) : isZeroCash ? (
            "Confirm Free Booking (0 XOF)"
          ) : paymentMethod === "WALLET" ? (
            "Complete with Wallet"
          ) : (
            "Complete payment"
          )}
        </Button>
      </div>
    </form>
  );
}
