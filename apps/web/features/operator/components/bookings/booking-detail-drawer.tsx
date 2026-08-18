"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowRightLeft, Calendar, Check, Clock, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@moja/ui/components/ui/button";
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
import { formatDepartureTime, formatPriceXOF } from "@/features/search/lib/format";
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
    ...trpc.operator.listUpcomingScheduleTrips.queryOptions(
      {
        scheduleId: booking?.scheduleId ?? undefined,
        limit: 20,
      },
    ),
    enabled: isRebookModalOpen && !!booking?.scheduleId,
  });

  const candidateTrips = (upcomingTripsQuery.data ?? []).filter(
    (trip) => trip.id !== booking?.tripId,
  );

  const selectedTrip = candidateTrips.find((t) => t.id === selectedTargetTripId);

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
            <SheetTitle className="text-base font-semibold">
              {t("detail.title")}
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              {booking?.bookingReference ?? t("detail.loading")}
            </SheetDescription>
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
                      Booking Ref
                    </p>
                    <p className="font-mono text-lg font-bold text-foreground">
                      {booking.bookingReference}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      booking.status === "CONFIRMED" &&
                        "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
                      booking.status === "PENDING_PAYMENT" &&
                        "bg-amber-500/10 text-amber-600 border border-amber-500/20",
                      booking.status === "CANCELLED" &&
                        "bg-red-500/10 text-red-600 border border-red-500/20",
                      booking.status === "COMPLETED" &&
                        "bg-blue-500/10 text-blue-600 border border-blue-500/20",
                    )}
                  >
                    {booking.status}
                  </span>
                </div>

                {/* Passenger Info */}
                <div className="rounded-xl border border-border bg-card px-4 py-4 space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Passenger
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
                    {booking.originQuarterName ? ` · ${booking.originQuarterName}` : ""}{" "}
                    →{" "}
                    {booking.destinationTerminalName}
                    {booking.destinationQuarterName ? ` · ${booking.destinationQuarterName}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatLocationLabel({ cityName: booking.originCityName, municipalityName: booking.originMunicipalityName, quarterName: booking.originQuarterName, isUrban: booking.serviceType === "URBAN" })}
                    {" → "}
                    {formatLocationLabel({ cityName: booking.destinationCityName, municipalityName: booking.destinationMunicipalityName, quarterName: booking.destinationQuarterName, isUrban: booking.serviceType === "URBAN" })}
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
                    <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                      {formatPriceXOF(booking.farePaidXOF)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-card px-4 py-3.5 col-span-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      {t("detail.departure")}
                    </p>
                    <p className="text-sm text-foreground">
                      {formatDateWithWeekday(booking.departureTime)} · {formatDepartureTime(booking.departureTime)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-card px-4 py-3.5 col-span-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      {t("detail.checkIn")}
                    </p>
                    <p className={cn(
                      "text-sm",
                      booking.checkedInAt ? "text-foreground" : "text-amber-600 dark:text-amber-400",
                    )}>
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
                  className="w-full bg-[#00875A] hover:bg-[#00704A] text-white font-semibold"
                  onClick={() => setIsRebookModalOpen(true)}
                >
                  <ArrowRightLeft className="size-4" />
                  Rebook Passenger
                </Button>
                {canCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-medium"
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
        <DialogContent className="max-w-lg border border-border bg-white rounded-xl p-6">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ArrowRightLeft className="size-5 text-[#00875A]" />
              Rebook Passenger to Upcoming Trip
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Transfer this passenger onto any upcoming departure from the same schedule. A new booking and ticket will be issued immediately.
            </DialogDescription>
          </DialogHeader>

          {booking ? (
            <form onSubmit={handleConfirmRebook} className="space-y-4 py-2">
              {/* Current Ticket Summary */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 space-y-1.5 text-xs text-slate-700">
                <div className="flex justify-between font-semibold text-slate-900">
                  <span>Passenger: {booking.passengerName}</span>
                  <span>Seat: #{booking.seatLabel}</span>
                </div>
                <div className="text-slate-500">
                  Current Departure: {formatDateWithWeekday(booking.departureTime)} at {formatDepartureTime(booking.departureTime)}
                </div>
              </div>

              {/* Target Upcoming Trip Selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Select Upcoming Departure
                </Label>
                {upcomingTripsQuery.isLoading ? (
                  <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
                    <Spinner className="size-4 text-[#00875A]" />
                    Loading upcoming departures...
                  </div>
                ) : candidateTrips.length === 0 ? (
                  <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                    No other upcoming trips found for this schedule. You can create a new trip under Fleet Management.
                  </p>
                ) : (
                  <Select
                    value={selectedTargetTripId}
                    onValueChange={(val) => {
                      setSelectedTargetTripId(val ?? "");
                      setSelectedSeatId("");
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose an upcoming departure..." />
                    </SelectTrigger>
                    <SelectContent>
                      {candidateTrips.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {new Intl.DateTimeFormat("en-GB", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          }).format(new Date(t.departureDate))} · {t.availableSeats} open seats ({t.busName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Seat Selection */}
              {selectedTrip && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Seat Assignment
                  </Label>
                  <Select
                    value={selectedSeatId || "__auto__"}
                    onValueChange={(val) => setSelectedSeatId(val === "__auto__" ? "" : (val ?? ""))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Auto-assign next available seat" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__auto__">Auto-assign next available seat</SelectItem>
                      {selectedTrip.seats
                        .filter((s: { id: string; seatNumber: string | number; isOccupied: boolean }) => !s.isOccupied)
                        .map((s: { id: string; seatNumber: string | number; isOccupied: boolean }) => (
                          <SelectItem key={s.id} value={s.id}>
                            Seat #{s.seatNumber} (Available)
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Rebook Reason */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="rebook-reason"
                  className="text-xs font-bold text-slate-700 uppercase tracking-wider"
                >
                  Reason for Rebooking
                </Label>
                <Input
                  id="rebook-reason"
                  type="text"
                  placeholder="e.g. Schedule delay, passenger request, mechanical change"
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
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#00875A] hover:bg-[#00704A] text-white h-9 font-semibold"
                  disabled={
                    rebookMutation.isPending ||
                    !selectedTargetTripId ||
                    rebookReason.trim().length < 3
                  }
                >
                  {rebookMutation.isPending ? (
                    <>
                      <Spinner className="mr-2 size-3.5 text-white" />
                      Rebooking...
                    </>
                  ) : (
                    "Confirm Rebooking"
                  )}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Cancellation Modal Dialog */}
      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <DialogContent className="max-w-md border border-border bg-white rounded-lg p-6">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="size-5 text-red-600" />
              {t("cancelModal.title")}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {t("cancelModal.description")}
            </DialogDescription>
          </DialogHeader>

          {booking ? (
            <form onSubmit={handleConfirmCancel} className="space-y-4 py-2">
              <div className="rounded-md border border-slate-100 bg-slate-50 p-3.5 space-y-1">
                <div className="text-xs text-slate-500">{t("cancelModal.refundSummary")}</div>
                <div className="text-sm font-bold text-slate-900 flex justify-between">
                  <span>{t("cancelModal.refundAmount")}</span>
                  <span>{formatPriceXOF(booking.farePaidXOF)}</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {t("cancelModal.feeNote")}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
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
                    <button
                      key={opt.id}
                      type="button"
                      disabled={opt.disabled}
                      onClick={() => setRefundChannel(opt.id)}
                      className={cn(
                        "p-2.5 rounded-md border text-center text-xs font-semibold transition-all",
                        opt.disabled && "opacity-40 cursor-not-allowed",
                        refundChannel === opt.id
                          ? "border-red-600 bg-red-50 text-red-700"
                          : "border-slate-200 hover:border-slate-300 text-slate-700",
                      )}
                    >
                      {t(opt.labelKey)}
                      <span className="block text-[8px] text-slate-400 font-normal mt-0.5">
                        {opt.disabled ? t("cancelModal.unavailable") : t(opt.hintKey)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="operator-cancel-reason"
                  className="text-xs font-bold text-slate-700 uppercase tracking-wider"
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
                  className="bg-red-600 hover:bg-red-700 text-white h-9"
                  disabled={cancelMutation.isPending}
                >
                  {cancelMutation.isPending ? (
                    <>
                      <Spinner className="mr-2 size-3.5 text-white" />
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
