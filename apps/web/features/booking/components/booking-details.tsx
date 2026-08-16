"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  Check,
  Copy,
  CreditCard,
  ExternalLink,
  Star,
  Ticket,
  Wallet,
} from "lucide-react";
import { cn } from "@moja/ui/lib/utils";
import { Alert, AlertDescription } from "@moja/ui/components/ui/alert";
import { Avatar, AvatarFallback } from "@moja/ui/components/ui/avatar";
import { Badge } from "@moja/ui/components/ui/badge";
import { Button, buttonVariants } from "@moja/ui/components/ui/button";
import { Label } from "@moja/ui/components/ui/label";
import { ScrollArea } from "@moja/ui/components/ui/scroll-area";
import { Separator } from "@moja/ui/components/ui/separator";
import { Spinner } from "@moja/ui/components/ui/spinner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@moja/ui/components/ui/tabs";
import { Textarea } from "@moja/ui/components/ui/textarea";
import { useTRPC } from "@/trpc/client";
import { useHoldCountdown, isHoldActive } from "@/features/booking/lib/hold-countdown";
import { formatDateWithWeekday } from "@/lib/format-date";
import { formatDepartureTime, formatPriceXOF, formatTripDuration } from "@/features/search/lib/format";
import { formatLocationLabel } from "@/lib/format-location-label";
import { resolveCheckoutPayable } from "@/features/payments/lib/checkout-payable";
import type { PassengerBookingSummary } from "@moja/types";
import dynamic from "next/dynamic";
import { Map as MapIcon } from "lucide-react";

const BookingRouteMap = dynamic(() => import("./booking-route-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-muted/30">
      <Spinner className="size-6 text-muted-foreground/30" />
    </div>
  ),
});

const BADGE_LABEL_KEY: Record<string, string> = {
  CONFIRMED: "badgeConfirmed",
  PENDING_PAYMENT: "badgePendingPayment",
  COMPLETED: "badgeCompleted",
  CANCELLED: "badgeCancelled",
  EXPIRED: "badgeExpired",
};

function StatusBadge({ status }: { status: PassengerBookingSummary["status"] }) {
  const t = useTranslations("passengerDashboard.bookingDetails");
  const map: Record<string, string> = {
    CONFIRMED: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
    PENDING_PAYMENT: "bg-amber-500/10 text-amber-700 border-amber-500/20",
    COMPLETED: "bg-muted text-muted-foreground border-muted",
    CANCELLED: "bg-destructive/10 text-destructive border-destructive/20",
    EXPIRED: "bg-muted text-muted-foreground border-muted",
  };

  return (
    <Badge variant="outline" className={map[status]}>
      {t(BADGE_LABEL_KEY[status] ?? "statusUnknown")}
    </Badge>
  );
}

function CopyButton({ text }: { text: string }) {
  const t = useTranslations("passengerDashboard.bookingDetails");
  const [copied, setCopied] = React.useState(false);
  function handleCopy() {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      type="button"
      aria-label={t("copyAria")}
      onClick={handleCopy}
      className="rounded-md p-1 transition-colors hover:bg-muted"
    >
      {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5 text-muted-foreground" />}
    </button>
  );
}

function OverviewTab({ booking }: { booking: PassengerBookingSummary }) {
  const t = useTranslations("passengerDashboard.bookingDetails");
  const countdown = useHoldCountdown(
    booking.status === "PENDING_PAYMENT" ? booking.holdExpiresAt : null,
  );
  const durationMs = booking.arrivalTime.getTime() - booking.departureTime.getTime();
  const durationMin = Math.max(0, Math.round(durationMs / 60000));
  const ticketRef = booking.seats[0]?.bookingReference;
  const ticketToken = booking.seats[0]?.ticketToken;
  const ticketHref = ticketToken && booking.status === "CONFIRMED"
    ? `/tickets/${encodeURIComponent(ticketToken)}`
    : null;

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex items-center gap-2">
            <h1 className="font-medium text-lg tabular-nums tracking-tight sm:text-xl">
              #{ticketRef ?? booking.groupId.slice(0, 10)}
            </h1>
            <CopyButton text={ticketRef ?? booking.groupId} />
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <StatusBadge status={booking.status} />
            <span className="text-muted-foreground">·</span>
            <span className="text-foreground tabular-nums">{t("departsLabel", { time: `${formatDateWithWeekday(booking.departureTime)} · ${formatDepartureTime(booking.departureTime)}` })}</span>
          </div>
        </div>

        <Separator />

        {booking.status === "PENDING_PAYMENT" && (
          <Alert className="border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-300">
            <AlertDescription>
              {countdown?.expired
                ? t("holdExpired")
                : countdown?.label
                  ? t("completePaymentWithin", { time: countdown.label })
                  : t("secureSeats")}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="size-9 after:rounded-sm">
              <AvatarFallback className="rounded-sm bg-primary/10 font-bold text-primary">
                {booking.companyName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <div className="font-medium text-sm leading-none">{booking.companyName}</div>
              <div className="text-muted-foreground text-xs leading-none">{t("busOperator")}</div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="secondary">
              {durationMin > 0 ? formatTripDuration(durationMin) : t("directDuration")}
            </Badge>
            <div className="text-muted-foreground text-xs leading-none">{t("duration")}</div>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">
            {t("passengerDetails")}
          </Label>
          <div className="flex flex-col gap-1">
            <p className="font-semibold text-sm">{booking.passengerName}</p>
            <p className="text-muted-foreground text-xs">{booking.passengerPhone}</p>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">
            {t("journeyDetails")}
          </Label>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border bg-muted/30 p-3 text-sm">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">{t("from")}</span>
              <span className="font-semibold">{formatLocationLabel({ cityName: booking.originCityName, municipalityName: booking.originMunicipalityName, quarterName: booking.originQuarterName, isUrban: booking.serviceType === "URBAN" })}</span>
              <span className="text-xs text-muted-foreground">{booking.originTerminalName}{booking.originQuarterName ? ` · ${booking.originQuarterName}` : ""}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">{t("to")}</span>
              <span className="font-semibold">{formatLocationLabel({ cityName: booking.destinationCityName, municipalityName: booking.destinationMunicipalityName, quarterName: booking.destinationQuarterName, isUrban: booking.serviceType === "URBAN" })}</span>
              <span className="text-xs text-muted-foreground">{booking.destinationTerminalName}{booking.destinationQuarterName ? ` · ${booking.destinationQuarterName}` : ""}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">{t("departs")}</span>
              <span className="font-semibold tabular-nums">{formatDepartureTime(booking.departureTime)}</span>
              <span className="text-xs text-muted-foreground">{formatDateWithWeekday(booking.departureTime)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">{t("arrives")}</span>
              <span className="font-semibold tabular-nums">{formatDepartureTime(booking.arrivalTime)}</span>
              <span className="text-xs text-muted-foreground">{formatDateWithWeekday(booking.arrivalTime)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">{t("seats")}</span>
              <span className="font-semibold">{booking.seats.map((s) => s.seatLabel).join(", ")}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border bg-primary/5 px-4 py-3">
          <span className="text-sm font-semibold">{t("totalPaid")}</span>
          <span className="font-black text-primary text-lg tabular-nums">
            {formatPriceXOF(booking.totalAmountXOF)}
          </span>
        </div>

        {ticketHref && (
          <Link
            href={ticketHref}
            className={cn(
              buttonVariants(),
              "w-full gap-2 bg-primary hover:bg-primary/90 text-white font-bold"
            )}
          >
            <Ticket className="size-4" />
            {t("viewTicket")}
            <ExternalLink className="size-3.5" />
          </Link>
        )}
      </div>
    </ScrollArea>
  );
}

function PassengersTab({ booking }: { booking: PassengerBookingSummary }) {
  const t = useTranslations("passengerDashboard.bookingDetails");

  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{t("seatCol")}</th>
                <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{t("nameCol")}</th>
                <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest text-muted-foreground font-semibold hidden sm:table-cell">{t("refCol")}</th>
                <th className="px-3 py-2 text-right text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{t("fareCol")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {booking.seats.map((seat) => (
                <tr key={seat.bookingId} className="hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-3 font-mono font-bold text-primary text-sm">{seat.seatLabel}</td>
                  <td className="px-3 py-3">
                    <p className="font-medium text-sm">{seat.passengerName}</p>
                    <p className="text-xs text-muted-foreground">{seat.passengerPhone}</p>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs text-muted-foreground hidden sm:table-cell">
                    {seat.bookingReference}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums text-sm">
                    {formatPriceXOF(seat.farePaidXOF)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t bg-muted/30">
                <td colSpan={3} className="px-3 py-2 text-xs font-bold text-muted-foreground">
                  {t("totalSeats", { count: booking.seats.length })}
                </td>
                <td className="px-3 py-2 text-right font-black text-primary tabular-nums">
                  {formatPriceXOF(booking.totalAmountXOF)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </ScrollArea>
  );
}

type PaymentTabProps = {
  booking: PassengerBookingSummary;
  paymentMethod: "PAYSTACK" | "WALLET";
  setPaymentMethod: (m: "PAYSTACK" | "WALLET") => void;
  isPaying: boolean;
  onExecutePayment: (discount?: {
    code?: string | undefined;
    monetaryVoucherId?: string | undefined;
    useCredits?: boolean | undefined;
    waiveConvenienceFee?: boolean | undefined;
  }) => void;
};

function PaymentTab({
  booking,
  paymentMethod,
  setPaymentMethod,
  isPaying,
  onExecutePayment,
}: PaymentTabProps) {
  const t = useTranslations("passengerDashboard.bookingDetails");
  const td = useTranslations("discounts");
  const trpc = useTRPC();
  const [promoCode, setPromoCode] = React.useState("");
  const [appliedCode, setAppliedCode] = React.useState<string | undefined>();
  const [selectedVoucherId, setSelectedVoucherId] = React.useState<
    string | undefined
  >();

  const walletQuery = useQuery({
    ...trpc.passenger.getWalletBalance.queryOptions(),
  });

  const pricingQuery = useQuery({
    ...trpc.payments.getCheckoutPricing.queryOptions({
      offerId: booking.offerId,
      seatCount: Math.max(1, booking.seats.length),
      paymentMethod,
      code: appliedCode,
      monetaryVoucherId: selectedVoucherId,
      autoApply: true,
      useCredits: true,
      ...(booking.holdGroupId
        ? { excludeHoldGroupId: booking.holdGroupId }
        : {}),
    }),
    staleTime: 10 * 1000,
  });

  const vouchersQuery = useQuery({
    ...trpc.discounts.listMyVouchers.queryOptions({ includeExpired: false }),
    staleTime: 30 * 1000,
  });

  const tripScheduleQuery = useQuery({
    ...trpc.booking.getTripDetails.queryOptions({ offerId: booking.offerId }),
    staleTime: 60 * 1000,
  });

  const pricing = pricingQuery.data;
  const creditAppliedXOF = pricing?.creditAppliedXOF ?? 0;
  const ticketDiscountXOF = pricing?.ticketDiscountXOF ?? 0;
  const postSub =
    pricing?.subtotalBaseXOF ?? booking.totalAmountXOF;
  const totalAmount =
    pricing?.payableXOF ??
    resolveCheckoutPayable({
      postDiscountSubtotalXOF: postSub,
      convenienceFeeXOF: pricing?.convenienceFeeXOF ?? 0,
      ticketDiscountXOF,
      feeDiscountXOF: pricing?.feeDiscountXOF ?? 0,
      creditAppliedXOF,
      chargeAmountXOF: pricing?.chargeAmountXOF ?? booking.totalAmountXOF,
      paymentMethod,
    }).payableXOF;
  const convenienceFeeXOF =
    pricing?.displayFeeXOF ??
    resolveCheckoutPayable({
      postDiscountSubtotalXOF: postSub,
      convenienceFeeXOF: pricing?.convenienceFeeXOF ?? 0,
      ticketDiscountXOF,
      feeDiscountXOF: pricing?.feeDiscountXOF ?? 0,
      creditAppliedXOF,
      chargeAmountXOF: pricing?.chargeAmountXOF ?? booking.totalAmountXOF,
      paymentMethod,
    }).displayFeeXOF;
  const isZeroCash = totalAmount === 0;
  const walletBalance = walletQuery.data?.availableBalance ?? 0;
  const canPayWithWallet = isZeroCash || walletBalance >= totalAmount;
  const holdActive = isHoldActive(booking.holdExpiresAt);
  const scheduleId = tripScheduleQuery.data?.scheduleId ?? null;
  const eligibleVouchers =
    vouchersQuery.data?.filter(
      (v) => !v.scheduleId || v.scheduleId === scheduleId,
    ) ?? [];

  if (!holdActive) {
    return (
      <div className="grid h-full min-h-40 place-items-center p-4">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground text-sm">{t("holdExpired")}</p>
          <Link href="/" className={buttonVariants({ variant: "outline", size: "sm" })}>
            {t("searchAgain")} →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-4">
        <div className="rounded-xl border bg-muted/30 p-3 space-y-1.5">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">{t("summary")}</p>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("fare")}</span>
            <span className="tabular-nums">
              {formatPriceXOF(pricing?.preDiscountSubtotalXOF ?? booking.totalAmountXOF)}
            </span>
          </div>
          {ticketDiscountXOF > 0 ? (
            <div className="flex justify-between text-sm text-emerald-700">
              <span>{td("discount")}</span>
              <span className="tabular-nums">-{formatPriceXOF(ticketDiscountXOF)}</span>
            </div>
          ) : null}
          {convenienceFeeXOF > 0 ? (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("serviceFee")}</span>
              <span className="tabular-nums">{formatPriceXOF(convenienceFeeXOF)}</span>
            </div>
          ) : null}
          {creditAppliedXOF > 0 ? (
            <div className="flex justify-between text-sm text-emerald-700">
              <span>{td("credits")}</span>
              <span className="tabular-nums">-{formatPriceXOF(creditAppliedXOF)}</span>
            </div>
          ) : null}
          <Separator className="my-1.5" />
          <div className="flex justify-between text-sm font-black text-primary">
            <span>{t("total")}</span>
            <span className="tabular-nums">{formatPriceXOF(totalAmount)}</span>
          </div>
        </div>

        <div className="space-y-2 rounded-xl border p-3">
          <Label className="text-xs font-semibold">{td("promoCode")}</Label>
          <div className="flex gap-2">
            <input
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder={td("promoPlaceholder")}
              className="h-9 flex-1 rounded-md border border-border bg-background px-2 text-sm uppercase"
              disabled={Boolean(appliedCode) || isPaying}
            />
            {appliedCode ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPaying}
                onClick={() => {
                  setAppliedCode(undefined);
                  setPromoCode("");
                }}
              >
                {td("remove")}
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!promoCode.trim() || isPaying || pricingQuery.isFetching}
                onClick={() => setAppliedCode(promoCode.trim().toUpperCase())}
              >
                {td("apply")}
              </Button>
            )}
          </div>
          {eligibleVouchers.length > 0 ? (
            <div className="space-y-1 pt-1">
              <Label className="text-xs font-semibold">{td("voucher")}</Label>
              <select
                className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
                value={selectedVoucherId ?? ""}
                onChange={(e) =>
                  setSelectedVoucherId(e.target.value || undefined)
                }
                disabled={isPaying}
              >
                <option value="">{td("noVoucher")}</option>
                {eligibleVouchers.map((v) => (
                  <option key={v.id} value={v.id}>
                    {formatPriceXOF(v.remainingAmountXOF)}
                    {v.scheduleId ? " · schedule" : ` · ${v.source}`}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">{t("paymentMethod")}</Label>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod("PAYSTACK")}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all",
                paymentMethod === "PAYSTACK"
                  ? "border-primary bg-primary/5 shadow-xs"
                  : "border-border hover:bg-muted/40",
              )}
            >
              <CreditCard className="size-4 shrink-0" />
              <div>
                <p className="text-xs font-bold">{t("cardMobileMoney")}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{t("payViaPaystack")}</p>
              </div>
            </button>

            <button
              type="button"
              disabled={!canPayWithWallet}
              onClick={() => canPayWithWallet && setPaymentMethod("WALLET")}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all",
                paymentMethod === "WALLET"
                  ? "border-primary bg-primary/5 shadow-xs"
                  : "border-border hover:bg-muted/40",
                !canPayWithWallet && "cursor-not-allowed opacity-50",
              )}
            >
              <Wallet className="size-4 shrink-0" />
              <div>
                <p className="text-xs font-bold">{t("mojaWallet")}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                  {isZeroCash
                    ? "Covered by promo"
                    : t("available", { balance: formatPriceXOF(Number(walletBalance)) })}
                </p>
              </div>
            </button>
          </div>
        </div>

        {paymentMethod === "WALLET" && isZeroCash ? (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-700">
            Fully covered by credits/voucher — no wallet debit.
          </div>
        ) : null}
        {paymentMethod === "WALLET" && !isZeroCash ? (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300">
            <strong>{t("convenienceFee", { fee: "0 XOF" })}</strong>
          </div>
        ) : null}
        {!canPayWithWallet && !isZeroCash ? (
          <div className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-700">
            <span>{t("walletInsufficient")}</span>
            <Link href="/dashboard/wallet" className="font-bold text-primary hover:underline" target="_blank">
              {t("topUp")} →
            </Link>
          </div>
        ) : null}

        <Button
          className="w-full gap-2 bg-primary hover:bg-primary/90 text-white font-bold"
          disabled={isPaying || (paymentMethod === "WALLET" && !canPayWithWallet)}
          onClick={() =>
            onExecutePayment({
              code: appliedCode,
              monetaryVoucherId: selectedVoucherId,
              useCredits: true,
              waiveConvenienceFee: paymentMethod === "WALLET" || isZeroCash,
            })
          }
        >
          {isPaying && <Spinner className="size-4 text-white" />}
          {paymentMethod === "WALLET"
            ? isZeroCash
              ? "Confirm (promo covers fare)"
              : t("completeWithWallet")
            : t("completePayment")}
        </Button>
      </div>
    </ScrollArea>
  );
}

function TimelineNode({
  label,
  time,
  done,
}: {
  label: string;
  time: string | null;
  done: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2",
            done
              ? "border-primary bg-primary text-white"
              : "border-muted-foreground/30 bg-background",
          )}
        >
          {done && <Check className="size-2.5" strokeWidth={3} />}
        </div>
        <div className="mt-1 w-px flex-1 bg-muted-foreground/20" />
      </div>
      <div className="pb-4">
        <p className="text-sm font-medium">{label}</p>
        {time && <p className="text-[10px] text-muted-foreground">{time}</p>}
      </div>
    </div>
  );
}

type ActivityTabProps = {
  booking: PassengerBookingSummary;
  onOpenReview: () => void;
  isReviewed: boolean;
};

function ActivityTab({ booking, onOpenReview, isReviewed }: ActivityTabProps) {
  const t = useTranslations("passengerDashboard.bookingDetails");
  const [rating, setRating] = React.useState(5);
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);
  const [reviewContent, setReviewContent] = React.useState("");

  const isPastOrCompleted =
    booking.status === "COMPLETED" ||
    booking.status === "CANCELLED" ||
    (booking.status === "CONFIRMED" &&
      booking.departureTime.getTime() < Date.now());

  return (
    <ScrollArea className="h-full">
      <div className="space-y-0 p-4">
        <TimelineNode
          label={t("bookingRequested")}
          time={booking.issuedAt
            ? null
            : formatDepartureTime(booking.departureTime)}
          done={true}
        />
        <TimelineNode
          label={t("seatsReserved")}
          time={booking.holdExpiresAt
            ? t("holdUntil", { time: formatDepartureTime(booking.holdExpiresAt) })
            : null}
          done={true}
        />
        <TimelineNode
          label={t("paymentConfirmed")}
          time={booking.issuedAt ? formatDepartureTime(booking.issuedAt) : null}
          done={booking.issuedAt !== null}
        />
        <TimelineNode
          label={t("ticketIssued")}
          time={booking.issuedAt ? formatDepartureTime(booking.issuedAt) : null}
          done={booking.status === "CONFIRMED" || booking.status === "COMPLETED"}
        />

        {isPastOrCompleted && (
          <div className="flex gap-3 mt-2">
            <div className="flex flex-col items-center">
              <div className="grid size-5 shrink-0 place-items-center rounded-full border-2 border-amber-500/60 bg-amber-500/10 mt-0.5">
                <Star className="size-2.5 fill-amber-500 text-amber-500" />
              </div>
            </div>
            <div className="flex-1 pb-4">
              {isReviewed ? (
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                  <Check className="size-4" />
                  {t("reviewSubmitted")}
                </div>
              ) : (
                <div className="space-y-3 rounded-xl border bg-muted/30 p-3">
                  <p className="text-sm font-semibold">{t("rateYourTrip")}</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const filled = (hoverRating ?? rating) >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(null)}
                          className="focus:outline-none"
                        >
                          <Star
                            className={cn(
                              "size-6 transition-colors",
                              filled ? "fill-amber-500 text-amber-500" : "text-muted-foreground",
                            )}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <Textarea
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    placeholder={t("tellUsAboutJourney")}
                    className="min-h-[72px] text-sm resize-none"
                    maxLength={1000}
                  />
                  <Button
                    size="sm"
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold"
                    onClick={onOpenReview}
                  >
                    {t("submitReview")}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

function EmptyDetailsState() {
  const t = useTranslations("passengerDashboard.bookingDetails");
  return (
    <div className="grid h-full min-h-0 grid-rows-[280px_1fr] overflow-hidden">
      <div className="min-h-0 overflow-hidden border-b border-border">
        <BookingRouteMap booking={null} />
      </div>
      <div className="grid min-h-40 place-items-center text-muted-foreground text-sm">
        {t("emptyState")}
      </div>
    </div>
  );
}

export type BookingDetailsProps = {
  booking: PassengerBookingSummary | null;
  isPaying: boolean;
  paymentMethod: "PAYSTACK" | "WALLET";
  setPaymentMethod: (m: "PAYSTACK" | "WALLET") => void;
  onExecutePayment: (discount?: {
    code?: string | undefined;
    monetaryVoucherId?: string | undefined;
    useCredits?: boolean | undefined;
    waiveConvenienceFee?: boolean | undefined;
  }) => void;
  onOpenReview: (booking: PassengerBookingSummary) => void;
  isReviewedFn: (booking: PassengerBookingSummary) => boolean;
};

export function BookingDetails({
  booking,
  isPaying,
  paymentMethod,
  setPaymentMethod,
  onExecutePayment,
  onOpenReview,
  isReviewedFn,
}: BookingDetailsProps) {
  const t = useTranslations("passengerDashboard.bookingDetails");
  if (!booking) return <EmptyDetailsState />;

  const isPendingPayment = booking.status === "PENDING_PAYMENT";
  const isPast =
    booking.status === "COMPLETED" ||
    booking.status === "CANCELLED" ||
    (booking.status === "CONFIRMED" &&
      booking.departureTime.getTime() < Date.now());

  return (
    <div className="grid h-full min-h-0 grid-rows-[280px_1fr] overflow-hidden lg:grid-rows-[320px_1fr]">
      <div className="min-h-0 overflow-hidden border-b border-border">
        <BookingRouteMap booking={booking} />
      </div>

      <div className="min-h-0 overflow-hidden py-2">
        <Tabs defaultValue="overview" className="flex h-full flex-col gap-0">
          <TabsList
            className="w-full justify-start gap-2 border-b px-4 **:data-[slot=tabs-trigger]:text-xs sm:gap-4 sm:**:data-[slot=tabs-trigger]:text-sm"
            variant="line"
          >
            <TabsTrigger className="flex-none" value="overview">{t("tabOverview")}</TabsTrigger>
            <TabsTrigger className="flex-none" value="passengers">{t("tabPassengers")}</TabsTrigger>
            {isPendingPayment && (
              <TabsTrigger className="flex-none" value="payment">{t("tabPayment")}</TabsTrigger>
            )}
            <TabsTrigger className="flex-none" value="activity">{t("tabActivity")}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0 h-0 flex-1 overflow-hidden">
            <OverviewTab booking={booking} />
          </TabsContent>

          <TabsContent value="passengers" className="mt-0 h-0 flex-1 overflow-hidden">
            <PassengersTab booking={booking} />
          </TabsContent>

          {isPendingPayment && (
            <TabsContent value="payment" className="mt-0 h-0 flex-1 overflow-hidden">
              <PaymentTab
                booking={booking}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                isPaying={isPaying}
                onExecutePayment={onExecutePayment}
              />
            </TabsContent>
          )}

          <TabsContent value="activity" className="mt-0 h-0 flex-1 overflow-hidden">
            <ActivityTab
              booking={booking}
              onOpenReview={() => onOpenReview(booking)}
              isReviewed={isReviewedFn(booking)}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
