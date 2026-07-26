"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  Ticket, QrCode, MapPin, Armchair, Share2, AlertTriangle, ArrowRight
} from "lucide-react";
import { cn } from "@moja/ui/lib/utils";
import { buttonVariants } from "@moja/ui/components/ui/button";
import { Button } from "@moja/ui/components/ui/button";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { useTRPC } from "@/trpc/client";
import { DigitalTicketCard } from "@/features/booking/components/digital-ticket-card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from "@moja/ui/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@moja/ui/components/ui/dialog";
import type { PassengerBookingSummary } from "@moja/types";
import { formatDepartureTime, formatPriceXOF } from "@/features/search/lib/format";
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
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [refundChannel, setRefundChannel] = useState<"WALLET" | "VOUCHER">("WALLET");

  const { data: ticket, isLoading, isError } = useQuery(
    trpc.booking.getTicket.queryOptions({ bookingReference }),
  );

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
    })
  );

  const handleCancelBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket) return;
    cancelMutation.mutate({
      bookingReference: ticket.bookingReference,
      channel: refundChannel,
    });
  };

  const isCancellable = ticket ? new Date(ticket.departureTime) > new Date() : false;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="w-full sm:max-w-md p-0 flex flex-col border-l border-border bg-bg-surface overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-bg-base">
            <SheetHeader className="text-left space-y-0">
              <SheetTitle className="text-lg font-bold">{t("sheetTitle")}</SheetTitle>
              <SheetDescription className="text-xs">
                {bookingReference}
              </SheetDescription>
            </SheetHeader>
            <Link
              href={`/tickets/${encodeURIComponent(ticketToken)}`}
              target="_blank"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 gap-1.5 rounded-full text-xs font-medium")}
            >
              <Share2 className="w-3 h-3" />
              {t("share")}
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Spinner className="size-8 text-primary" />
              </div>
            ) : isError || !ticket ? (
              <div className="py-12 text-center space-y-4">
                <p className="text-sm text-error font-medium">{t("loadError")}</p>
                <Button variant="outline" size="sm" onClick={onClose}>
                  {t("close")}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-900 leading-relaxed shadow-sm">
                  {t("qrInstructions")}
                </div>

                <DigitalTicketCard ticket={ticket} compact />
              </div>
            )}
          </div>

          <div className="p-6 border-t border-border bg-bg-base shrink-0">
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
                className="w-full h-11 font-medium rounded-xl border-border text-text-secondary"
                disabled
              >
                {t("cancelClosed")}
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <DialogContent className="max-w-md border border-border bg-white rounded-2xl p-6 shadow-xl">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="size-5 text-error" />
              {t("cancelDialogTitle")}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              {t("cancelDialogDesc")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCancelBooking} className="space-y-5 pt-2">
            {ticket && (
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-1.5">
                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{t("refundSummary")}</div>
                <div className="text-sm font-bold text-slate-900 flex justify-between items-center border-b border-slate-200 pb-2 mb-2">
                  <span>{t("farePaid")}</span>
                  <span>{formatPriceXOF(ticket.farePaidXOF)}</span>
                </div>
                <div className="text-sm font-bold text-primary flex justify-between items-center">
                  <span>{t("refundAmount")}</span>
                  <span>{formatPriceXOF(ticket.farePaidXOF)}</span>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-11 rounded-xl border-slate-200 text-slate-700"
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
                {cancelMutation.isPending ? <Spinner className="size-4" /> : t("confirmCancel")}
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
        <p className="text-sm text-text-muted mt-1">
          {error instanceof Error ? error.message : t("errorFallback")}
        </p>
        <Button variant="outline" className="mt-4 border-border text-text-primary" onClick={() => refetch()}>
          {t("tryAgain")}
        </Button>
      </div>
    );
  }

  if (confirmed.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-bg-surface p-12 text-center max-w-lg flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-2">
          <Ticket className="size-8" />
        </div>
        <div className="space-y-1.5">
          <p className="text-lg font-bold text-text-primary tracking-tight">{t("emptyTitle")}</p>
          <p className="text-sm text-text-secondary">{t("emptyDescription")}</p>
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
        <p className="text-xs font-bold text-text-secondary uppercase tracking-widest px-1">
          {t(activeTicketsCount === 1 ? "activeCountSingular" : "activeCountPlural", { count: activeTicketsCount })}
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {confirmed.flatMap((booking) =>
          booking.seats.map((seat) => {
            return (
              <div
                key={seat.bookingReference}
                onClick={() => setActiveTicket({
                  bookingReference: seat.bookingReference,
                  ticketToken: seat.ticketToken,
                })}
                className="group relative flex flex-col justify-between rounded-2xl bg-bg-surface hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden border border-border"
              >
                <div className="absolute top-1/2 -left-3 w-6 h-6 bg-bg-base rounded-full border border-border group-hover:border-transparent transition-colors z-10" />
                <div className="absolute top-1/2 -right-3 w-6 h-6 bg-bg-base rounded-full border border-border group-hover:border-transparent transition-colors z-10" />

                <div className="p-6 space-y-5 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {booking.companyName}
                    </span>
                    <span className="text-[10px] font-bold text-text-muted font-mono tracking-tight bg-bg-base px-2 py-1 rounded-md border border-border">
                      {seat.bookingReference}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex flex-col flex-1 truncate">
                      <span className="text-xl font-extrabold text-text-primary tracking-tight truncate">
                        {booking.originCityName}{booking.originMunicipalityName ? ` (${booking.originMunicipalityName})` : ""}
                      </span>
                      <span className="text-xs text-text-secondary truncate mt-0.5">
                        {booking.originTerminalName}{booking.originQuarterName ? ` · ${booking.originQuarterName}` : ""}
                      </span>
                    </div>
                    <ArrowRight className="size-4 text-primary shrink-0 opacity-50" />
                    <div className="flex flex-col flex-1 truncate text-right">
                      <span className="text-xl font-extrabold text-text-primary tracking-tight truncate">
                        {booking.destinationCityName}{booking.destinationMunicipalityName ? ` (${booking.destinationMunicipalityName})` : ""}
                      </span>
                      <span className="text-xs text-text-secondary truncate mt-0.5">
                        {booking.destinationTerminalName}{booking.destinationQuarterName ? ` · ${booking.destinationQuarterName}` : ""}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-full border-t-2 border-dashed border-border/60 relative opacity-50" />

                <div className="p-5 bg-primary/5 flex items-center justify-between group-hover:bg-primary/10 transition-colors">
                  <div className="flex gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
                        {t("cardDeparture")}
                      </p>
                      <p className="font-semibold text-sm text-text-primary">
                        {formatDepartureTime(booking.departureTime)}
                      </p>
                    </div>
                    <div className="space-y-1 border-l border-border/50 pl-4">
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
                        <Armchair className="size-3" /> {t("cardSeat")}
                      </p>
                      <p className="font-semibold text-sm text-text-primary">
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
          })
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