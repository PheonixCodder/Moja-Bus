"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import {
  Ticket,
  QrCode,
  MapPin,
  Armchair,
  Share2,
  ExternalLink,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { cn } from "@moja/ui/lib/utils";
import { buttonVariants } from "@moja/ui/components/ui/button";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { useTRPC } from "@/trpc/client";
import { DigitalTicketCard } from "@/features/booking/components/digital-ticket-card";
import { PrintTicketButton } from "@/features/booking/components/print-ticket-button";
import { formatLocationLabel } from "@/lib/format-location-label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@moja/ui/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@moja/ui/components/ui/dialog";
import type { PassengerBookingSummary } from "@moja/types";
import { formatDateWithWeekday } from "@/lib/format-date";
import {
  formatDepartureTime,
  formatPriceXOF,
} from "@/features/search/lib/format";
import { toast } from "sonner";

function TicketSheet({
  bookingReference,
  ticketToken,
  isOpen,
  onClose,
}: {
  bookingReference: string;
  ticketToken: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("passengerDashboard.tickets");
  const locale = useLocale();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  // F-PS-02: passenger self-cancel refunds to the Moja wallet only.
  const refundChannel = "WALLET" as const;

  const {
    data: ticket,
    isLoading,
    isError,
  } = useQuery(trpc.booking.getTicket.queryOptions({ bookingReference }));

  // P2-12 — real refund quote from the same policy code the service executes.
  const refundQuoteQuery = useQuery({
    ...trpc.passenger.getRefundQuote.queryOptions({
      bookingReference,
      channel: refundChannel,
    }),
    enabled: isCancelModalOpen && !!ticket,
  });
  const quote = refundQuoteQuery.data;

  const cancelMutation = useMutation(
    trpc.payments.cancelBooking.mutationOptions({
      onSuccess: () => {
        toast.success(t("cancelSuccess"));
        setIsCancelModalOpen(false);
        onClose();
        queryClient.invalidateQueries(trpc.booking.listMyBookings.pathFilter());
      },
      onError: (err: any) => {
        toast.error(err.message || t("cancelFailed"));
      },
    }),
  );

  // P2-3 👻 → wired: email the digital-ticket link to a companion.
  const shareMutation = useMutation(
    trpc.booking.shareTicket.mutationOptions({
      onSuccess: () => {
        toast.success(t("shareSuccess", { name: recipientName }));
        setIsShareOpen(false);
        setRecipientName("");
        setRecipientEmail("");
        setRecipientPhone("");
      },
      onError: (err: any) => {
        toast.error(err.message || t("shareFailed"));
      },
    }),
  );

  const handleShareTicket = (e: React.FormEvent) => {
    e.preventDefault();
    shareMutation.mutate({
      bookingReference,
      recipientName: recipientName.trim(),
      recipientEmail: recipientEmail.trim(),
      ...(recipientPhone.trim()
        ? { recipientPhone: recipientPhone.trim() }
        : {}),
      locale: locale === "en" ? "en" : "fr",
    });
  };

  const handleCancelBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket) return;
    cancelMutation.mutate({
      bookingReference: ticket.bookingReference,
      channel: refundChannel,
    });
  };

  const isCancellable = ticket
    ? new Date(ticket.departureTime) > new Date()
    : false;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="w-full sm:max-w-md p-0 flex flex-col border-l border-border bg-surface overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted">
            <SheetHeader className="text-left space-y-0 border-none p-0">
              <SheetTitle className="text-lg font-bold">
                {t("sheetTitle")}
              </SheetTitle>
              <SheetDescription className="text-xs">
                {bookingReference}
              </SheetDescription>
            </SheetHeader>
            <div className="flex items-center gap-2">
              <PrintTicketButton
                translationNamespace="passengerDashboard.tickets"
                size="sm"
                className="h-8 gap-1.5 rounded-full text-xs font-medium"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsShareOpen(true)}
                className="h-8 gap-1.5 rounded-full text-xs font-medium"
              >
                <Share2 className="w-3 h-3" />
                {t("share")}
              </Button>
              <Link
                href={`/tickets/${encodeURIComponent(ticketToken)}`}
                target="_blank"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "h-8 gap-1.5 rounded-full text-xs font-medium",
                )}
              >
                <ExternalLink className="w-3 h-3" />
                {t("openInTab")}
              </Link>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <Spinner className="size-8 text-primary" />
              </div>
            ) : isError || !ticket ? (
              <div className="text-center py-12 space-y-3">
                <p className="text-sm text-muted-foreground">{t("ticketNotFound")}</p>
                <Button variant="outline" onClick={onClose}>
                  {t("close")}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-xs text-success leading-relaxed shadow-sm">
                  {t("qrInstructions")}
                </div>

                <DigitalTicketCard ticket={ticket} compact />
              </div>
            )}
          </div>

          <div className="p-6 border-t border-border bg-muted shrink-0">
            {isCancellable ? (
              <Button
                variant="destructive"
                className="w-full h-11 font-bold bg-error hover:bg-error/90 text-white rounded-xl shadow-sm"
                onClick={() => setIsCancelModalOpen(true)}
              >
                {t("cancelRefund")}
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full h-11 font-medium rounded-xl border-border text-muted-foreground"
                disabled
              >
                {t("cancelClosed")}
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent className="max-w-md border border-border bg-white rounded-2xl p-6 shadow-xl">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-extrabold text-foreground flex items-center gap-2">
              <Share2 className="size-5 text-primary" />
              {t("shareDialogTitle")}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {t("shareDialogDesc")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleShareTicket} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="shareRecipientName">{t("recipientName")}</Label>
              <Input
                id="shareRecipientName"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                required
                minLength={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shareRecipientEmail">{t("recipientEmail")}</Label>
              <Input
                id="shareRecipientEmail"
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shareRecipientPhone">
                {t("recipientPhoneOptional")}
              </Label>
              <Input
                id="shareRecipientPhone"
                type="tel"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-11 rounded-xl"
                onClick={() => setIsShareOpen(false)}
              >
                {t("close")}
              </Button>
              <Button
                type="submit"
                className="flex-1 h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold"
                disabled={shareMutation.isPending}
              >
                {shareMutation.isPending ? (
                  <Spinner className="size-4" />
                ) : (
                  t("send")
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <DialogContent className="max-w-md border border-border bg-card rounded-2xl p-6 shadow-xl">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-extrabold text-foreground flex items-center gap-2">
              <AlertTriangle className="size-5 text-destructive" />
              {t("cancelDialogTitle")}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {t("cancelDialogDesc")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCancelBooking} className="space-y-5 pt-2">
            {ticket && (
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-1.5">
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  {t("refundSummary")}
                </div>
                <div className="text-sm font-bold text-foreground flex justify-between items-center border-b border-border pb-2 mb-2">
                  <span>{t("farePaid")}</span>
                  <span>{formatPriceXOF(ticket.farePaidXOF)}</span>
                </div>
                {quote?.cancellable ? (
                  <>
                    <div className="text-sm font-bold text-primary flex justify-between items-center">
                      <span>{t("refundAmount")}</span>
                      <span>{formatPriceXOF(quote.refundAmountXOF)}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground pt-2 leading-relaxed">
                      {t("feeNote")}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
                      {/* Phase 38 (F-PS-12) — was hardcoded French beside t() */}
                      {t("cancelEstimateNote")}
                    </p>
                  </>
                ) : quote && !quote.cancellable ? (
                  <p className="text-[11px] text-muted-foreground pt-1">
                    {t("notCancellable")}
                  </p>
                ) : null}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-11 rounded-xl"
                onClick={() => setIsCancelModalOpen(false)}
              >
                {t("keepTicket")}
              </Button>
              <Button
                type="submit"
                variant="destructive"
                className="flex-1 h-11 rounded-xl bg-error hover:bg-error/90 text-white font-bold"
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? (
                  <Spinner className="size-4" />
                ) : (
                  t("confirmCancel")
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function PassengerTicketsView() {
  const t = useTranslations("passengerDashboard.tickets");
  const trpc = useTRPC();

  const [activeTicket, setActiveTicket] = useState<{
    bookingReference: string;
    ticketToken: string;
  } | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery(
    trpc.booking.listMyBookings.queryOptions({ filter: "upcoming" }),
  );

  const confirmed = data?.items.filter((b) => b.status === "CONFIRMED") ?? [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-error/20 bg-error/5 p-6 text-center max-w-lg">
        <p className="text-error font-medium">{t("errorTitle")}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {error instanceof Error ? error.message : t("errorFallback")}
        </p>
        <Button
          variant="outline"
          className="mt-4 border-border text-foreground"
          onClick={() => refetch()}
        >
          {t("tryAgain")}
        </Button>
      </div>
    );
  }

  if (confirmed.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center max-w-lg flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-2">
          <Ticket className="size-8" />
        </div>
        <div className="space-y-1.5">
          <p className="text-lg font-bold text-foreground tracking-tight">
            {t("emptyTitle")}
          </p>
          <p className="text-sm text-muted-foreground">{t("emptyDescription")}</p>
        </div>
        <Link
          href="/search"
          className={cn(
            buttonVariants(),
            "mt-4 bg-primary hover:bg-primary/95 text-white font-bold h-11 px-8 rounded-full shadow-sm",
          )}
        >
          {t("bookTrip")}
        </Link>
      </div>
    );
  }

  const activeTicketsCount = confirmed.reduce((n, b) => n + b.seats.length, 0);

  return (
    <div className="space-y-6 w-full max-w-6xl">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">
          {t(
            activeTicketsCount === 1
              ? "activeCountSingular"
              : "activeCountPlural",
            { count: activeTicketsCount },
          )}
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {confirmed.flatMap((booking) =>
          booking.seats.map((seat) => {
            return (
              <div
                key={seat.bookingReference}
                onClick={() =>
                  setActiveTicket({
                    bookingReference: seat.bookingReference,
                    ticketToken: seat.ticketToken,
                  })
                }
                className="group relative flex flex-col justify-between rounded-2xl bg-surface hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden border border-border"
              >
                <div className="absolute top-1/2 -left-3 w-6 h-6 bg-muted rounded-full border border-border group-hover:border-transparent transition-colors z-10" />
                <div className="absolute top-1/2 -right-3 w-6 h-6 bg-muted rounded-full border border-border group-hover:border-transparent transition-colors z-10" />

                <div className="p-6 space-y-5 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {booking.companyName}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground font-mono tracking-tight bg-muted px-2 py-1 rounded-md border border-border">
                      {seat.bookingReference}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex flex-col flex-1 truncate">
                      <span className="text-xl font-extrabold text-foreground tracking-tight truncate">
                        {formatLocationLabel({
                          cityName: booking.originCityName,
                          municipalityName: booking.originMunicipalityName,
                          quarterName: booking.originQuarterName,
                          isUrban: booking.serviceType === "URBAN",
                        })}
                      </span>
                      <span className="text-xs text-muted-foreground truncate mt-0.5">
                        {booking.originTerminalName}
                        {booking.originQuarterName
                          ? ` · ${booking.originQuarterName}`
                          : ""}
                      </span>
                    </div>
                    <ArrowRight className="size-4 text-primary shrink-0 opacity-50" />
                    <div className="flex flex-col flex-1 truncate text-right">
                      <span className="text-xl font-extrabold text-foreground tracking-tight truncate">
                        {formatLocationLabel({
                          cityName: booking.destinationCityName,
                          municipalityName: booking.destinationMunicipalityName,
                          quarterName: booking.destinationQuarterName,
                          isUrban: booking.serviceType === "URBAN",
                        })}
                      </span>
                      <span className="text-xs text-muted-foreground truncate mt-0.5">
                        {booking.destinationTerminalName}
                        {booking.destinationQuarterName
                          ? ` · ${booking.destinationQuarterName}`
                          : ""}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-full border-t-2 border-dashed border-border/60 relative opacity-50" />

                <div className="p-5 bg-primary/5 flex items-center justify-between group-hover:bg-primary/10 transition-colors">
                  <div className="flex gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        {t("cardDeparture")}
                      </p>
                      <p className="font-semibold text-sm text-foreground">
                        {formatDepartureTime(booking.departureTime)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatDateWithWeekday(booking.departureTime)}
                      </p>
                    </div>
                    <div className="space-y-1 border-l border-border/50 pl-4">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <Armchair className="size-3" /> {t("cardSeat")}
                      </p>
                      <p className="font-semibold text-sm text-foreground">
                        {seat.seatLabel}
                      </p>
                    </div>
                  </div>

                  <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform text-primary border border-primary/10">
                    <QrCode className="size-5" />
                  </div>
                </div>
              </div>
            );
          }),
        )}
      </div>

      {activeTicket && (
        <TicketSheet
          bookingReference={activeTicket.bookingReference}
          ticketToken={activeTicket.ticketToken}
          isOpen={activeTicket !== null}
          onClose={() => setActiveTicket(null)}
        />
      )}
    </div>
  );
}
