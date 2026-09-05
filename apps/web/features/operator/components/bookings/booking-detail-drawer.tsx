"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRightLeft,
  Calendar,
  Check,
  Clock,
  Printer,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { PassengerSeatMap } from "@/features/booking/components/passenger-seat-map";
import { toast } from "sonner";
import { Button, buttonVariants } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { cn } from "@moja/ui/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@moja/ui/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@moja/ui/components/ui/dialog";
import { Label } from "@moja/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";
import { useTRPC } from "@/trpc/client";
import { formatDateWithWeekday } from "@/lib/format-date";
import {
  formatDepartureTime,
  formatPriceXOF,
} from "@/features/search/lib/format";
import { formatLocationLabel } from "@/lib/format-location-label";
import { useStaffPermissions } from "@/features/operator/hooks/use-staff-permissions";

type RefundChannel = "CASH" | "WALLET";

export function BookingDetailDrawer({
  bookingId,
  open,
  onClose,
}: {
  bookingId: string;
  open: boolean;
  onClose: () => void;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { can } = useStaffPermissions();
  const t = useTranslations("operatorDashboard.bookings");
  const canUpdate = can("bookings:update");
  const canCancel = can("bookings:update") && can("bookings:cancel");

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isRebookModalOpen, setIsRebookModalOpen] = useState(false);
  const [refundChannel, setRefundChannel] = useState<RefundChannel>("WALLET");
  const [cancelReason, setCancelReason] = useState("");

  // Rebooking state
  const [selectedTargetTripId, setSelectedTargetTripId] = useState<string>("");
  const [selectedSeatId, setSelectedSeatId] = useState<string>("");
  const [rebookReason, setRebookReason] = useState("");

  const { data: booking, isLoading } = useQuery({
    ...trpc.operator.getBooking.queryOptions({ bookingId }),
    enabled: open,
  });

  const isGuest = !booking?.userId;

  useEffect(() => {
    if (isGuest && refundChannel === "WALLET") {
      setRefundChannel("CASH");
    }
  }, [isGuest, refundChannel]);

  // Query upcoming candidate trips for rebooking
  const upcomingTripsQuery = useQuery({
    ...trpc.operator.listUpcomingScheduleTrips.queryOptions({
      scheduleId: booking?.scheduleId ?? undefined,
      limit: 20,
    }),
    enabled: isRebookModalOpen && !!booking?.scheduleId,
  });

  const candidateTrips = (upcomingTripsQuery.data ?? []).filter(
    (trip) => trip.id !== booking?.tripId,
  );

  const selectedTrip = candidateTrips.find(
    (t) => t.id === selectedTargetTripId,
  );

  const cancelMutation = useMutation(
    trpc.operator.cancelBooking.mutationOptions({
      onSuccess: () => {
        toast.success(t("toast.bookingCancelled"));
        setIsCancelModalOpen(false);
        void queryClient.invalidateQueries(
          trpc.operator.listBookings.pathFilter(),
        );
        onClose();
      },
      onError: (err) => {
        toast.error(err.message || t("toast.cancelFailed"));
      },
    }),
  );

  const rebookMutation = useMutation(
    trpc.operator.rebookBooking.mutationOptions({
      onSuccess: (result) => {
        toast.success(
          `Passenger rebooked to ${new Date(result.departureDate).toLocaleDateString()} (Seat #${result.seatNumber}). Ref: ${result.newBookingReference}`,
        );
        setIsRebookModalOpen(false);
        setSelectedTargetTripId("");
        setSelectedSeatId("");
        setRebookReason("");
        void queryClient.invalidateQueries(
          trpc.operator.listBookings.pathFilter(),
        );
        onClose();
      },
      onError: (err) => {
        toast.error(err.message || "Failed to rebook passenger");
      },
    }),
  );

  const handleConfirmCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;
    if (!cancelReason.trim()) {
      toast.error(t("toast.reasonRequired"));
      return;
    }
    if (isGuest && refundChannel === "WALLET") {
      toast.error(t("toast.walletNotAvailable"));
      return;
    }
    cancelMutation.mutate({
      bookingReference: booking.bookingReference,
      channel: refundChannel,
      reason: cancelReason.trim(),
    });
  };

  const handleConfirmRebook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;
    if (!selectedTargetTripId) {
      toast.error("Please select a target upcoming departure");
      return;
    }
    if (!rebookReason.trim() || rebookReason.trim().length < 3) {
      toast.error("Please provide a valid rebooking reason (min 3 characters)");
      return;
    }
    rebookMutation.mutate({
      bookingReference: booking.bookingReference,
      targetTripId: selectedTargetTripId,
      targetSeatId: selectedSeatId || undefined,
      reason: rebookReason.trim(),
    });
  };

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
        <SheetContent className="flex flex-col p-0 sm:max-w-lg">
          <SheetHeader>
            <div className="flex items-center justify-between gap-3 pr-6">
              <div>
                <SheetTitle className="text-base font-semibold">
                  {t("detail.title")}
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground">
                  {booking?.bookingReference ?? t("detail.loading")}
                </SheetDescription>
              </div>
              {booking?.ticketToken && (
                <Link
                  href={`/tickets/${encodeURIComponent(booking.ticketToken)}`}
                  target="_blank"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "h-8 gap-1.5 rounded-full text-xs font-medium print:hidden shrink-0",
                  )}
                >
                  <Printer className="size-3.5" />
                  {t("detail.printTicket")}
                </Link>
              )}
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Spinner className="size-6 text-muted-foreground" />
              </div>
            ) : !booking ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {t("detail.notFound")}
              </p>
            ) : (
              <>
                {/* Status + Reference Hero */}
                <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3.5">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("detail.bookingRef")}
                    </p>
                    <p className="font-mono text-lg font-bold text-foreground">
                      {booking.bookingReference}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      booking.status === "CONFIRMED" &&
                        "bg-success/10 text-success border border-success/20",
                      booking.status === "PENDING_PAYMENT" &&
                        "bg-warning/10 text-warning border border-warning/20",
                      booking.status === "CANCELLED" &&
                        "bg-destructive/10 text-destructive border border-destructive/20",
                      booking.status === "COMPLETED" &&
                        "bg-primary/10 text-primary border border-primary/20",
                    )}
                  >
                    {booking.status}
                  </span>
                </div>

                {/* Passenger Info */}
                <div className="rounded-xl border border-border bg-card px-4 py-4 space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {t("detail.passenger")}
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">
                        {t("detail.passenger")}
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {booking.passengerName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">
                        {t("detail.phone")}
                      </p>
                      <p className="text-sm font-mono text-foreground">
                        {booking.passengerPhone}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Route */}
                <div className="rounded-xl border border-border bg-card px-4 py-4 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {t("detail.route")}
                  </p>
                  <p className="text-sm font-semibold text-foreground leading-snug">
                    {booking.originTerminalName}
                    {booking.originQuarterName
                      ? ` · ${booking.originQuarterName}`
                      : ""}{" "}
                    → {booking.destinationTerminalName}
                    {booking.destinationQuarterName
                      ? ` · ${booking.destinationQuarterName}`
                      : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatLocationLabel({
                      cityName: booking.originCityName,
                      municipalityName: booking.originMunicipalityName,
                      quarterName: booking.originQuarterName,
                      isUrban: booking.serviceType === "URBAN",
                    })}
                    {" → "}
                    {formatLocationLabel({
                      cityName: booking.destinationCityName,
                      municipalityName: booking.destinationMunicipalityName,
                      quarterName: booking.destinationQuarterName,
                      isUrban: booking.serviceType === "URBAN",
                    })}
                  </p>
                </div>

                {/* Ticket Details Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border bg-card px-4 py-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      {t("detail.seat")}
                    </p>
                    <p className="font-mono text-base font-bold text-foreground">
                      {booking.seatLabel}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-card px-4 py-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      {t("detail.fare")}
                    </p>
                    <p className="text-base font-bold text-success">
                      {formatPriceXOF(booking.farePaidXOF)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-card px-4 py-3.5 col-span-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      {t("detail.departure")}
                    </p>
                    <p className="text-sm text-foreground">
                      {formatDateWithWeekday(booking.departureTime)} ·{" "}
                      {formatDepartureTime(booking.departureTime)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-card px-4 py-3.5 col-span-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      {t("detail.checkIn")}
                    </p>
                    <p
                      className={cn(
                        "text-sm",
                        booking.checkedInAt
                          ? "text-foreground"
                          : "text-warning",
                      )}
                    >
                      {booking.checkedInAt
                        ? formatDepartureTime(booking.checkedInAt)
                        : t("detail.notCheckedIn")}
                    </p>
                  </div>
                </div>

                {canCancel &&
                  booking.status === "CONFIRMED" &&
                  booking.checkedInAt && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      {t("detail.cancelDisabledCheckedIn")}
                    </p>
                  )}
              </>
            )}
          </div>

          {/* Sticky Action Footer */}
          {booking &&
            canUpdate &&
            booking.status === "CONFIRMED" &&
            !booking.checkedInAt &&
            new Date(booking.departureTime) > new Date() && (
              <SheetFooter>
                <Button
                  type="button"
                  className="w-full bg-success hover:bg-success/90 text-success-foreground font-semibold"
                  onClick={() => setIsRebookModalOpen(true)}
                >
                  <ArrowRightLeft className="size-4" />
                  {t("rebookButton")}
                </Button>
                {canCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/40 font-medium"
                    onClick={() => setIsCancelModalOpen(true)}
                  >
                    {t("detail.cancelButton")}
                  </Button>
                )}
              </SheetFooter>
            )}
        </SheetContent>
      </Sheet>

      {/* Rebooking Modal Dialog */}
      <Dialog open={isRebookModalOpen} onOpenChange={setIsRebookModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto border border-border bg-card rounded-xl p-6">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <ArrowRightLeft className="size-5 text-success" />
              {t("rebookModal.title")}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t("rebookModal.description")}
            </DialogDescription>
          </DialogHeader>

          {booking ? (
            <form onSubmit={handleConfirmRebook} className="space-y-4 py-2">
              {/* Current Ticket Summary */}
              <div className="rounded-lg border border-border bg-muted/40 p-3.5 space-y-1.5 text-xs text-foreground/80">
                <div className="flex justify-between font-semibold text-foreground">
                  <span>
                    {t("rebookModal.passenger")} {booking.passengerName}
                  </span>
                  <span>
                    {t("rebookModal.seatNumber", { seat: booking.seatLabel })}
                  </span>
                </div>
                <div className="text-muted-foreground">
                  {t("rebookModal.currentDeparture", {
                    date: formatDateWithWeekday(booking.departureTime),
                    time: formatDepartureTime(booking.departureTime),
                  })}
                </div>
              </div>

              {/* Target Upcoming Trip Selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
                  {t("rebookModal.selectDeparture")}
                </Label>
                {upcomingTripsQuery.isLoading ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                    <Spinner className="size-4 text-success" />
                    {t("rebookModal.loadingDepartures")}
                  </div>
                ) : candidateTrips.length === 0 ? (
                  <p className="text-xs text-warning bg-warning/10 p-3 rounded-lg border border-warning/20">
                    {t("rebookModal.noDepartures")}
                  </p>
                ) : (
                  <Select
                    value={selectedTargetTripId}
                    onValueChange={(val) => {
                      setSelectedTargetTripId(val ?? "");
                      setSelectedSeatId("");
                    }}
                  >
                    <SelectTrigger className="h-10 text-xs">
                      <SelectValue placeholder={t("rebookModal.placeholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {candidateTrips.map((trip) => (
                        <SelectItem
                          key={trip.id}
                          value={trip.id}
                          disabled={trip.availableSeats === 0}
                          className="text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              {formatDepartureTime(trip.departureDate)}
                            </span>
                            <span className="text-muted-foreground">·</span>
                            <span>{formatDateWithWeekday(trip.departureDate)}</span>
                            <span className="text-muted-foreground">·</span>
                            <span className="font-medium text-success">
                              {t("rebookModal.seatsRemaining", {
                                count: trip.availableSeats,
                              })}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Interactive Seat Selection Map */}
              {selectedTrip && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
                      {t("rebookModal.seatAssignment", {
                        count: selectedTrip.availableSeats,
                      })}
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedSeatId("")}
                      className={cn(
                        "text-xs px-2.5 py-1 h-auto rounded-md border transition-all",
                        !selectedSeatId
                          ? "bg-success/10 text-success border-success/30 font-bold shadow-xs hover:bg-success/20 hover:text-success"
                          : "bg-muted/40 text-muted-foreground border-border hover:bg-muted font-medium",
                      )}
                    >
                      {t("rebookModal.autoAssign")}
                    </Button>
                  </div>

                  {selectedSeatId ? (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-success/10 border border-success/20 text-xs text-success font-medium">
                      <Sparkles className="size-4 text-success shrink-0" />
                      <span>
                        {t("rebookModal.selectedSeat", {
                          number:
                            selectedTrip.seats.find(
                              (s) => s.seatId === selectedSeatId,
                            )?.label ?? selectedSeatId,
                        })}
                      </span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground italic">
                      {t("rebookModal.seatHint")}
                    </p>
                  )}

                  <PassengerSeatMap
                    rows={selectedTrip.rows}
                    columns={selectedTrip.columns}
                    seats={selectedTrip.seats.map((s) => ({
                      seatId: s.seatId,
                      tripSeatId: s.id,
                      label: s.label,
                      row: s.row,
                      col: s.col,
                      deck: s.deck,
                      seatType: s.seatType,
                      status: s.status as any,
                    }))}
                    selectedSeatIds={selectedSeatId ? [selectedSeatId] : []}
                    onToggleSeat={(seatId) => {
                      setSelectedSeatId((prev) => (prev === seatId ? "" : seatId));
                    }}
                    maxSelection={1}
                  />
                </div>
              )}

              {/* Reason for Rebooking */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="rebook-reason"
                  className="text-xs font-semibold text-foreground/80"
                >
                  {t("rebookModal.reasonLabel")}
                </Label>
                <Input
                  id="rebook-reason"
                  type="text"
                  placeholder={t("rebookModal.reasonPlaceholder")}
                  value={rebookReason}
                  onChange={(e) => setRebookReason(e.target.value)}
                  required
                />
              </div>

              <DialogFooter className="pt-4 gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9"
                  onClick={() => setIsRebookModalOpen(false)}
                >
                  {t("rebookModal.cancel")}
                </Button>
                <Button
                  type="submit"
                  className="bg-success hover:bg-success/90 text-success-foreground h-9 font-semibold"
                  disabled={
                    rebookMutation.isPending ||
                    !selectedTargetTripId ||
                    rebookReason.trim().length < 3
                  }
                >
                  {rebookMutation.isPending ? (
                    <>
                      <Spinner className="mr-2 size-3.5 text-success-foreground" />
                      {t("rebookModal.rebooking")}
                    </>
                  ) : (
                    t("rebookModal.confirm")
                  )}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Cancellation Modal Dialog */}
      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <DialogContent className="max-w-md border border-border bg-card rounded-lg p-6">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <AlertTriangle className="size-5 text-destructive" />
              {t("cancelModal.title")}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t("cancelModal.description")}
            </DialogDescription>
          </DialogHeader>

          {booking ? (
            <form onSubmit={handleConfirmCancel} className="space-y-4 py-2">
              <div className="rounded-md border border-border bg-muted/40 p-3.5 space-y-1">
                <div className="text-xs text-muted-foreground">
                  {t("cancelModal.refundSummary")}
                </div>
                <div className="text-sm font-bold text-foreground flex justify-between">
                  <span>{t("cancelModal.refundAmount")}</span>
                  <span>{formatPriceXOF(booking.farePaidXOF)}</span>
                </div>
                <p className="text-[10px] text-muted-foreground/70 mt-1">
                  {t("cancelModal.feeNote")}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
                  {t("cancelModal.refundMethod")}
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      {
                        id: "WALLET" as const,
                        labelKey: "cancelModal.wallet",
                        hintKey: "cancelModal.walletHint",
                        disabled: isGuest,
                      },
                      {
                        id: "CASH" as const,
                        labelKey: "cancelModal.cash",
                        hintKey: "cancelModal.cashHint",
                        disabled: false,
                      },
                    ] as const
                  ).map((opt) => (
                    <Button
                      key={opt.id}
                      type="button"
                      variant="ghost"
                      disabled={opt.disabled}
                      onClick={() => setRefundChannel(opt.id)}
                      className={cn(
                        "p-2.5 h-auto flex flex-col items-center rounded-md border text-center text-xs font-semibold transition-all",
                        opt.disabled && "opacity-40 cursor-not-allowed",
                        refundChannel === opt.id
                          ? "border-destructive bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive"
                          : "border-border hover:border-border/80 text-foreground",
                      )}
                    >
                      <span>{t(opt.labelKey)}</span>
                      <span className="block text-[8px] text-muted-foreground font-normal mt-0.5">
                        {opt.disabled
                          ? t("cancelModal.unavailable")
                          : t(opt.hintKey)}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="operator-cancel-reason"
                  className="text-xs font-bold text-foreground/80 uppercase tracking-wider"
                >
                  {t("cancelModal.reasonLabel")}
                </Label>
                <Input
                  id="operator-cancel-reason"
                  type="text"
                  placeholder={t("cancelModal.reasonPlaceholder")}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  required
                />
              </div>

              <DialogFooter className="pt-4 gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9"
                  onClick={() => setIsCancelModalOpen(false)}
                >
                  {t("cancelModal.keepBooking")}
                </Button>
                <Button
                  type="submit"
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground h-9"
                  disabled={cancelMutation.isPending}
                >
                  {cancelMutation.isPending ? (
                    <>
                      <Spinner className="mr-2 size-3.5 text-destructive-foreground" />
                      {t("cancelModal.cancelling")}
                    </>
                  ) : (
                    t("cancelModal.confirmCancel")
                  )}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
