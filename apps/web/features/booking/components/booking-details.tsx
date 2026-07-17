"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
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
import { formatDepartureTime, formatPriceXOF, formatTripDuration } from "@/features/search/lib/format";
import type { PassengerBookingSummary } from "@moja/types";
import dynamic from "next/dynamic";
import { Map as MapIcon } from "lucide-react";

// Dynamically import Leaflet map to avoid window is not defined error on SSR
const BookingRouteMap = dynamic(() => import("./booking-route-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-muted/30">
      <Spinner className="size-6 text-muted-foreground/30" />
    </div>
  ),
});

// ─────────────────────────────────────────────────────────
// Status badge
// ─────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: PassengerBookingSummary["status"] }) {
  const map = {
    CONFIRMED: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
    PENDING_PAYMENT: "bg-amber-500/10 text-amber-700 border-amber-500/20",
    COMPLETED: "bg-muted text-muted-foreground border-muted",
    CANCELLED: "bg-destructive/10 text-destructive border-destructive/20",
    EXPIRED: "bg-muted text-muted-foreground border-muted",
  } as const;

  return (
    <Badge variant="outline" className={map[status]}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

// ─────────────────────────────────────────────────────────
// Copy button
// ─────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  function handleCopy() {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      type="button"
      aria-label="Copy to clipboard"
      onClick={handleCopy}
      className="rounded-md p-1 transition-colors hover:bg-muted"
    >
      {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5 text-muted-foreground" />}
    </button>
  );
}

// ─────────────────────────────────────────────────────────
// Overview tab
// ─────────────────────────────────────────────────────────
function OverviewTab({ booking }: { booking: PassengerBookingSummary }) {
  const countdown = useHoldCountdown(
    booking.status === "PENDING_PAYMENT" ? booking.holdExpiresAt : null,
  );
  const durationMs = booking.arrivalTime.getTime() - booking.departureTime.getTime();
  const durationMin = Math.max(0, Math.round(durationMs / 60000));
  const ticketRef = booking.seats[0]?.bookingReference;
  const ticketHref = ticketRef && booking.status === "CONFIRMED"
    ? `/tickets/${encodeURIComponent(ticketRef)}`
    : null;

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-4 p-4">
        {/* Ref + status */}
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
            <span className="text-foreground tabular-nums">Departs: {formatDepartureTime(booking.departureTime)}</span>
          </div>
        </div>

        <Separator />

        {/* Pending payment alert */}
        {booking.status === "PENDING_PAYMENT" && (
          <Alert className="border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-300">
            <AlertDescription>
              {countdown?.expired
                ? "Hold expired. Please search again for a new ticket."
                : countdown?.label
                  ? `Complete payment within ${countdown.label} to secure your seats.`
                  : "Complete payment to secure your seats."}
            </AlertDescription>
          </Alert>
        )}

        {/* Operator Profile */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="size-9 after:rounded-sm">
              <AvatarFallback className="rounded-sm bg-primary/10 font-bold text-primary">
                {booking.companyName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <div className="font-medium text-sm leading-none">{booking.companyName}</div>
              <div className="text-muted-foreground text-xs leading-none">Bus Operator</div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="secondary">
              {durationMin > 0 ? formatTripDuration(durationMin) : "Direct"}
            </Badge>
            <div className="text-muted-foreground text-xs leading-none">Duration</div>
          </div>
        </div>

        <Separator />

        {/* Passenger info */}
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">
            Passenger Details
          </Label>
          <div className="flex flex-col gap-1">
            <p className="font-semibold text-sm">{booking.passengerName}</p>
            <p className="text-muted-foreground text-xs">{booking.passengerPhone}</p>
          </div>
        </div>

        <Separator />

        {/* Journey details grid */}
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">
            Journey Details
          </Label>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border bg-muted/30 p-3 text-sm">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">From</span>
              <span className="font-semibold">{booking.originCityName}</span>
              <span className="text-xs text-muted-foreground">{booking.originTerminalName}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">To</span>
              <span className="font-semibold">{booking.destinationCityName}</span>
              <span className="text-xs text-muted-foreground">{booking.destinationTerminalName}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Departs</span>
              <span className="font-semibold tabular-nums">{formatDepartureTime(booking.departureTime)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Arrives</span>
              <span className="font-semibold tabular-nums">{formatDepartureTime(booking.arrivalTime)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Seats</span>
              <span className="font-semibold">{booking.seats.map((s) => s.seatLabel).join(", ")}</span>
            </div>
          </div>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between rounded-xl border bg-primary/5 px-4 py-3">
          <span className="text-sm font-semibold">Total paid</span>
          <span className="font-black text-primary text-lg tabular-nums">
            {formatPriceXOF(booking.totalAmountXOF)}
          </span>
        </div>

        {/* Action */}
        {ticketHref && (
          <Link
            href={ticketHref}
            className={cn(
              buttonVariants(),
              "w-full gap-2 bg-primary hover:bg-primary/90 text-white font-bold"
            )}
          >
            <Ticket className="size-4" />
            View Ticket
            <ExternalLink className="size-3.5" />
          </Link>
        )}
      </div>
    </ScrollArea>
  );
}

// ─────────────────────────────────────────────────────────
// Passengers tab
// ─────────────────────────────────────────────────────────
function PassengersTab({ booking }: { booking: PassengerBookingSummary }) {
  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Seat</th>
                <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Name</th>
                <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest text-muted-foreground font-semibold hidden sm:table-cell">Ref</th>
                <th className="px-3 py-2 text-right text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Fare</th>
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
                  Total ({booking.seats.length} seat{booking.seats.length !== 1 ? "s" : ""})
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

// ─────────────────────────────────────────────────────────
// Payment tab
// ─────────────────────────────────────────────────────────
type PaymentTabProps = {
  booking: PassengerBookingSummary;
  paymentMethod: "PAYSTACK" | "WALLET";
  setPaymentMethod: (m: "PAYSTACK" | "WALLET") => void;
  isPaying: boolean;
  onExecutePayment: () => void;
};

function PaymentTab({
  booking,
  paymentMethod,
  setPaymentMethod,
  isPaying,
  onExecutePayment,
}: PaymentTabProps) {
  const trpc = useTRPC();

  const walletQuery = useQuery({
    ...trpc.wallet.getWalletBalance.queryOptions(),
  });

  const pricingQuery = useQuery({
    ...trpc.payments.getHoldPricing.queryOptions({
      holdId: booking.holdGroupId ?? "",
    }),
    enabled: Boolean(booking.holdGroupId),
  });

  const subtotalBaseXOF = pricingQuery.data?.subtotalBaseXOF ?? booking.totalAmountXOF;
  const convenienceFeeXOF = paymentMethod === "WALLET" ? 0 : (pricingQuery.data?.convenienceFeeXOF ?? 0);
  const totalAmount = paymentMethod === "WALLET" ? subtotalBaseXOF : (pricingQuery.data?.chargeAmountXOF ?? subtotalBaseXOF);
  const walletBalance = walletQuery.data?.balance ?? 0;
  const walletInsufficient = walletBalance < subtotalBaseXOF;
  const holdActive = isHoldActive(booking.holdExpiresAt);

  if (!holdActive) {
    return (
      <div className="grid h-full min-h-40 place-items-center p-4">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground text-sm">This hold has expired.</p>
          <Link href="/" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Search again →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-4">
        {/* Pricing summary */}
        <div className="rounded-xl border bg-muted/30 p-3 space-y-1.5">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Summary</p>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Fare</span>
            <span className="tabular-nums">{formatPriceXOF(subtotalBaseXOF)}</span>
          </div>
          {convenienceFeeXOF > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Service fee</span>
              <span className="tabular-nums">{formatPriceXOF(convenienceFeeXOF)}</span>
            </div>
          )}
          <Separator className="my-1.5" />
          <div className="flex justify-between text-sm font-black text-primary">
            <span>Total</span>
            <span className="tabular-nums">{formatPriceXOF(totalAmount)}</span>
          </div>
        </div>

        {/* Method selector */}
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">Payment Method</Label>
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
                <p className="text-xs font-bold">Card / Mobile Money</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Pay via Paystack checkout</p>
              </div>
            </button>

            <button
              type="button"
              disabled={walletInsufficient}
              onClick={() => !walletInsufficient && setPaymentMethod("WALLET")}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all",
                paymentMethod === "WALLET"
                  ? "border-primary bg-primary/5 shadow-xs"
                  : "border-border hover:bg-muted/40",
                walletInsufficient && "cursor-not-allowed opacity-50",
              )}
            >
              <Wallet className="size-4 shrink-0" />
              <div>
                <p className="text-xs font-bold">Moja Wallet</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                  Available: {formatPriceXOF(Number(walletBalance))}
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Info banners */}
        {paymentMethod === "WALLET" && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300">
            <strong>0 XOF</strong> convenience fee when paying with your Moja Wallet.
          </div>
        )}
        {walletInsufficient && (
          <div className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-700">
            <span>Wallet balance insufficient.</span>
            <Link href="/dashboard/wallet" className="font-bold text-primary hover:underline" target="_blank">
              Top-Up →
            </Link>
          </div>
        )}

        {/* CTA */}
        <Button
          className="w-full gap-2 bg-primary hover:bg-primary/90 text-white font-bold"
          disabled={isPaying || (paymentMethod === "WALLET" && walletInsufficient)}
          onClick={onExecutePayment}
        >
          {isPaying && <Spinner className="size-4 text-white" />}
          {paymentMethod === "WALLET" ? "Complete with Wallet" : "Complete Payment"}
        </Button>
      </div>
    </ScrollArea>
  );
}

// ─────────────────────────────────────────────────────────
// Activity tab (timeline + review)
// ─────────────────────────────────────────────────────────
type ActivityTabProps = {
  booking: PassengerBookingSummary;
  onOpenReview: () => void;
  isReviewed: boolean;
};

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

function ActivityTab({ booking, onOpenReview, isReviewed }: ActivityTabProps) {
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
          label="Booking requested"
          time={booking.issuedAt
            ? null
            : formatDepartureTime(booking.departureTime)}
          done={true}
        />
        <TimelineNode
          label="Seats reserved"
          time={booking.holdExpiresAt
            ? `Hold until ${formatDepartureTime(booking.holdExpiresAt)}`
            : null}
          done={true}
        />
        <TimelineNode
          label="Payment confirmed"
          time={booking.issuedAt ? formatDepartureTime(booking.issuedAt) : null}
          done={booking.issuedAt !== null}
        />
        <TimelineNode
          label="Ticket issued"
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
                  Review submitted
                </div>
              ) : (
                <div className="space-y-3 rounded-xl border bg-muted/30 p-3">
                  <p className="text-sm font-semibold">Rate your trip</p>
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
                    placeholder="Tell us about your journey..."
                    className="min-h-[72px] text-sm resize-none"
                    maxLength={1000}
                  />
                  <Button
                    size="sm"
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold"
                    onClick={onOpenReview}
                  >
                    Submit Review
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

// ─────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────
function EmptyDetailsState() {
  return (
    <div className="grid h-full min-h-0 grid-rows-[280px_1fr] overflow-hidden">
      <div className="min-h-0 overflow-hidden border-b border-border">
        <BookingRouteMap booking={null} />
      </div>
      <div className="grid min-h-40 place-items-center text-muted-foreground text-sm">
        Select a booking to view details.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Public component
// ─────────────────────────────────────────────────────────
export type BookingDetailsProps = {
  booking: PassengerBookingSummary | null;
  isPaying: boolean;
  paymentMethod: "PAYSTACK" | "WALLET";
  setPaymentMethod: (m: "PAYSTACK" | "WALLET") => void;
  onExecutePayment: () => void;
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
  if (!booking) return <EmptyDetailsState />;

  const isPendingPayment = booking.status === "PENDING_PAYMENT";
  const isPast =
    booking.status === "COMPLETED" ||
    booking.status === "CANCELLED" ||
    (booking.status === "CONFIRMED" &&
      booking.departureTime.getTime() < Date.now());

  return (
    <div className="grid h-full min-h-0 grid-rows-[280px_1fr] overflow-hidden lg:grid-rows-[320px_1fr]">
      {/* Top — geo map / CSS banner */}
      <div className="min-h-0 overflow-hidden border-b border-border">
        <BookingRouteMap booking={booking} />
      </div>

      {/* Bottom — tabs */}
      <div className="min-h-0 overflow-hidden py-2">
        <Tabs defaultValue="overview" className="flex h-full flex-col gap-0">
          <TabsList
            className="w-full justify-start gap-2 border-b px-4 **:data-[slot=tabs-trigger]:text-xs sm:gap-4 sm:**:data-[slot=tabs-trigger]:text-sm"
            variant="line"
          >
            <TabsTrigger className="flex-none" value="overview">Overview</TabsTrigger>
            <TabsTrigger className="flex-none" value="passengers">Passengers</TabsTrigger>
            {isPendingPayment && (
              <TabsTrigger className="flex-none" value="payment">Payment</TabsTrigger>
            )}
            <TabsTrigger className="flex-none" value="activity">Activity</TabsTrigger>
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
