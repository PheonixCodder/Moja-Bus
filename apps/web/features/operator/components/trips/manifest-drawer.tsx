"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  RefreshCw,
  ScanLine,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@moja/ui/lib/utils";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Spinner } from "@moja/ui/components/ui/spinner";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@moja/ui/components/ui/combobox";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@moja/ui/components/ui/drawer";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RouterOutputs } from "@/trpc/client";
import {
  TicketScanner,
  type TicketScanResult,
} from "@/features/operator/components/ticket-scanner";
import { TripStatusBadge } from "./trip-status-badge";
import { SegmentOccupancySection } from "./segment-occupancy";
import {
  formatTripDate,
  formatTripTime,
} from "@/features/operator/lib/trips/format";
import { nextTripActions } from "@/lib/trip-status";

type BusItem = RouterOutputs["fleet"]["getBuses"]["buses"][number];

export function ManifestDrawer({
  tripId,
  open,
  onClose,
  buses,
  canUpdate,
  canCancel,
  canCheckIn,
}: {
  tripId: string | null;
  open: boolean;
  onClose: () => void;
  buses: BusItem[];
  canUpdate: boolean;
  canCancel: boolean;
  canCheckIn: boolean;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [delayMinutes, setDelayMinutes] = useState("15");
  const [cancelReason, setCancelReason] = useState("");
  const [showDelayForm, setShowDelayForm] = useState(false);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [gateDraft, setGateDraft] = useState("");
  const [notesDraft, setNotesDraft] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  // L7: multi-select for bulk cancel.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkCancelOpen, setBulkCancelOpen] = useState(false);
  const [bulkReason, setBulkReason] = useState("");

  const {
    data: trip,
    isLoading,
    isFetching,
    isError,
  } = useQuery({
    // L1: lighter manifest payload (no seat map) so the drawer opens fast.
    ...trpc.trips.getManifest.queryOptions({ id: tripId ?? "" }),
    enabled: !!tripId && open,
  });

  // L1: the seat map is a separate, lighter query loaded only when the Seat
  // Map tab is opened, so it never bloats the manifest drawer's initial load.
  const [view, setView] = useState<"passengers" | "seatmap">("passengers");
  const { data: seatData, isLoading: isSeatLoading } = useQuery({
    ...trpc.trips.getSeatMap.queryOptions({ id: tripId ?? "" }),
    enabled: !!tripId && open && view === "seatmap",
  });

  // Sync drafts when trip payload arrives so empty save can clear fields
  useEffect(() => {
    if (trip) {
      setGateDraft(trip.gate ?? "");
      setNotesDraft(trip.notes ?? "");
    }
  }, [trip?.id, trip?.gate, trip?.notes]);

  const invalidateTripData = useCallback(() => {
    void queryClient.invalidateQueries(trpc.trips.list.pathFilter());
    void queryClient.invalidateQueries(trpc.trips.statusCounts.queryFilter());
    if (tripId) {
      void queryClient.invalidateQueries(
        trpc.trips.getManifest.queryFilter({ id: tripId }),
      );
    }
  }, [queryClient, trpc, tripId]);

  const checkInMutation = useMutation({
    ...trpc.operator.checkInBooking.mutationOptions(),
    onSuccess: (result) => {
      invalidateTripData();
      if (result.alreadyCheckedIn) {
        toast.info(`${result.passengerName} was already checked in`);
      } else {
        toast.success(
          `Checked in ${result.passengerName} (seat ${result.seatLabel})`,
        );
      }
    },
    onError: (err) => toast.error(err.message || "Check-in failed"),
  });

  const assignBusMutation = useMutation({
    ...trpc.trips.assignBus.mutationOptions(),
    onSuccess: () => {
      toast.success("Bus assigned");
      invalidateTripData();
    },
    onError: (err) => toast.error(err.message || "Failed to assign bus"),
  });

  const updateStatusMutation = useMutation({
    ...trpc.trips.updateStatus.mutationOptions(),
    onSuccess: (_data, vars) => {
      invalidateTripData();
      toast.success(`Status updated to ${vars.status}`);
    },
    onError: (err) => toast.error(err.message || "Failed to update status"),
  });

  const delayMutation = useMutation({
    ...trpc.trips.delay.mutationOptions(),
    onSuccess: () => {
      invalidateTripData();
      toast.success("Delay logged");
      setShowDelayForm(false);
    },
    onError: (err) => toast.error(err.message || "Failed to log delay"),
  });

  const cancelMutation = useMutation({
    ...trpc.trips.cancel.mutationOptions(),
    onSuccess: (result) => {
      invalidateTripData();
      const failed =
        result.refundResults?.filter((r) => !r.success) ?? [];
      if (failed.length > 0) {
        toast.warning(
          `Trip cancelled. ${failed.length} refund(s) need attention.`,
        );
      } else {
        toast.success("Trip cancelled");
      }
      setShowCancelForm(false);
    },
    onError: (err) => toast.error(err.message || "Failed to cancel trip"),
  });

  // L7: bulk check-in / bulk cancel mutations.
  const bulkCheckInMutation = useMutation(
    trpc.operator.bulkCheckInBookings.mutationOptions({
      onSuccess: () => invalidateTripData(),
    }),
  );
  const bulkCancelMutation = useMutation(
    trpc.operator.bulkCancelBookings.mutationOptions({
      onSuccess: () => invalidateTripData(),
    }),
  );

  const setGateMutation = useMutation({
    ...trpc.trips.setGate.mutationOptions(),
    onSuccess: () => {
      toast.success("Gate updated");
      invalidateTripData();
    },
    onError: (err) => toast.error(err.message || "Failed to set gate"),
  });

  const updateNotesMutation = useMutation({
    ...trpc.trips.updateNotes.mutationOptions(),
    onSuccess: () => {
      toast.success("Notes saved");
      invalidateTripData();
    },
    onError: (err) => toast.error(err.message || "Failed to save notes"),
  });

  const actionLoading =
    assignBusMutation.isPending ||
    updateStatusMutation.isPending ||
    delayMutation.isPending ||
    cancelMutation.isPending ||
    setGateMutation.isPending ||
    updateNotesMutation.isPending ||
    checkInMutation.isPending;

  const confirmedBookings =
    trip?.bookings?.filter((b) => b.status === "CONFIRMED") ?? [];
  // M23: active holds (PENDING_PAYMENT, not yet expired) are returned by
  // trips.get alongside confirmed bookings — surface them separately so
  // operators don't miscount unpaid holds as sold seats.
  const holdBookings =
    trip?.bookings?.filter((b) => b.status === "PENDING_PAYMENT") ?? [];
  const checkedInCount = confirmedBookings.filter((b) => b.checkedInAt).length;
  const actions = trip ? nextTripActions(trip.status) : null;

  async function handleManualCheckIn(bookingId: string) {
    if (!trip) return;
    setCheckingInId(bookingId);
    try {
      await checkInMutation.mutateAsync({ bookingId, tripId: trip.id });
    } finally {
      setCheckingInId(null);
    }
  }

  // L7: bulk selection + actions.
  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const pendingCheckIns = confirmedBookings.filter((b) => !b.checkedInAt);

  const handleCheckInAll = async () => {
    if (!trip || pendingCheckIns.length === 0) return;
    try {
      const res = await bulkCheckInMutation.mutateAsync({ tripId: trip.id });
      toast.success(
        `Checked in ${res.checkedIn} passenger${res.checkedIn === 1 ? "" : "s"}` +
          (res.alreadyCheckedIn > 0
            ? ` (${res.alreadyCheckedIn} already in)`
            : ""),
      );
      setSelectedIds(new Set());
    } catch (err: any) {
      toast.error(err?.message || "Bulk check-in failed");
    }
  };

  const handleBulkCancel = async () => {
    if (!trip || selectedIds.size === 0) return;
    if (!bulkReason.trim()) {
      toast.error("Cancellation reason is required");
      return;
    }
    try {
      const res = await bulkCancelMutation.mutateAsync({
        tripId: trip.id,
        bookingIds: Array.from(selectedIds),
        reason: bulkReason.trim(),
      });
      toast.success(
        `Cancelled ${res.cancelled} booking(s)` +
          (res.failed > 0 ? `; ${res.failed} failed` : ""),
      );
      setSelectedIds(new Set());
      setBulkCancelOpen(false);
      setBulkReason("");
    } catch (err: any) {
      toast.error(err?.message || "Bulk cancel failed");
    }
  };

  const handleScanCheckIn = useCallback(
    async (raw: string): Promise<TicketScanResult> => {
      if (!tripId) throw new Error("Trip not loaded");
      return checkInMutation.mutateAsync({ ticketToken: raw, tripId });
    },
    [checkInMutation, tripId],
  );

  return (
    <Drawer
      open={open}
      onOpenChange={(v) => !v && onClose()}
      direction="right"
      modal
    >
      <DrawerContent className="!inset-y-0 !right-0 !left-auto !w-full !max-w-lg flex flex-col">
        <DrawerHeader className="border-b border-border px-5 py-4 shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <DrawerTitle className="text-base font-bold">
                Trip Manifest
              </DrawerTitle>
              <DrawerDescription className="text-xs text-muted-foreground">
                {trip
                  ? `${
                      trip.schedule?.route?.originTerminal?.cityRelation
                        ?.name ?? "Origin"
                    } → ${
                      trip.schedule?.route?.destTerminal?.cityRelation?.name ??
                      "Dest"
                    } · ${formatTripDate(trip.departureDate)}`
                  : "Loading…"}
              </DrawerDescription>
            </div>
            {isFetching && !isLoading ? (
              <RefreshCw className="size-3.5 text-muted-foreground animate-spin shrink-0 mt-1" />
            ) : null}
          </div>
        </DrawerHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Spinner className="size-6 text-primary" />
          </div>
        ) : isError ? (
          <div className="flex-1 flex items-center justify-center px-5">
            <p className="text-sm text-destructive">Failed to load trip details</p>
          </div>
        ) : trip ? (
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
            <div className="flex items-center justify-between">
              <TripStatusBadge status={trip.status} />
              {(trip.delayMinutes ?? 0) > 0 ? (
                <span className="text-xs font-semibold text-amber-600">
                  +{trip.delayMinutes}m delay
                </span>
              ) : null}
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Trip Summary
              </h4>
              <div className="border border-border rounded-md p-3 space-y-2 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Calendar className="size-3.5 text-muted-foreground" />
                  <span className="text-xs">{formatTripDate(trip.departureDate)}</span>
                  <Clock className="size-3.5 text-muted-foreground ml-2" />
                  <span className="text-xs">{formatTripTime(trip.departureDate)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold">
                    {trip.schedule?.route?.originTerminal?.cityRelation?.name ??
                      "Origin"}
                  </span>
                  <ArrowRight className="size-3 text-muted-foreground/50" />
                  <span className="text-xs font-semibold">
                    {trip.schedule?.route?.destTerminal?.cityRelation?.name ??
                      "Destination"}
                  </span>
                </div>
                {trip.cancelReason ? (
                  <p className="text-xs text-destructive">
                    Cancel reason: {trip.cancelReason}
                  </p>
                ) : null}
              </div>
            </div>

            {/* L1: tab switch — Passengers (manifest) vs Seat Map (lazy seat viz) */}
            <div className="flex gap-1 border-b border-border -mb-2">
              <button
                type="button"
                onClick={() => setView("passengers")}
                className={cn(
                  "px-3 py-2 text-xs font-bold border-b-2 -mb-px",
                  view === "passengers"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                Passengers
              </button>
              <button
                type="button"
                onClick={() => setView("seatmap")}
                className={cn(
                  "px-3 py-2 text-xs font-bold border-b-2 -mb-px",
                  view === "seatmap"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                Seat Map
              </button>
            </div>

            {view === "passengers" && canUpdate && buses.length > 0 ? (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Bus
                </h4>
                <Combobox
                  items={buses
                    .filter((b) => b.status === "ACTIVE")
                    .map((b) => ({
                      value: b.id,
                      label: `${b.registrationPlate}${b.internalName ? ` — ${b.internalName}` : ""}`,
                    }))}
                  value={trip.busId ?? ""}
                  onValueChange={(val) => {
                    if (val) {
                      assignBusMutation.mutate({
                        id: trip.id,
                        data: { busId: val },
                      });
                    }
                  }}
                  disabled={actionLoading}
                >
                  <ComboboxInput
                    placeholder="Assign a bus…"
                    aria-label="Assign a bus to this trip"
                    className="w-full text-sm"
                    value={
                      trip.busId
                        ? (() => {
                            const b = buses.find((x) => x.id === trip.busId);
                            return b
                              ? `${b.registrationPlate}${b.internalName ? ` — ${b.internalName}` : ""}`
                              : "";
                          })()
                        : ""
                    }
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>No active bus found.</ComboboxEmpty>
                    <ComboboxList>
                      {buses
                        .filter((b) => b.status === "ACTIVE")
                        .map((b) => (
                          <ComboboxItem key={b.id} value={b.id}>
                            {b.registrationPlate}
                            {b.internalName ? ` — ${b.internalName}` : ""}
                          </ComboboxItem>
                        ))}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>
            ) : null}

            {view === "passengers" && canUpdate ? (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Gate & notes
                </h4>
                <div className="flex gap-2">
                  <Input
                    placeholder="Gate / bay"
                    value={gateDraft}
                    onChange={(e) => setGateDraft(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={actionLoading}
                    onClick={() =>
                      setGateMutation.mutate({
                        id: trip.id,
                        gate: gateDraft.trim() === "" ? null : gateDraft.trim(),
                      })
                    }
                  >
                    Save gate
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Internal notes"
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={actionLoading}
                    onClick={() =>
                      updateNotesMutation.mutate({
                        id: trip.id,
                        notes:
                          notesDraft.trim() === "" ? null : notesDraft.trim(),
                      })
                    }
                  >
                    Save notes
                  </Button>
                </div>
              </div>
            ) : null}

            {view === "seatmap" ? (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Seat Map
                </h4>
                {isSeatLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Spinner className="size-6 text-primary" />
                  </div>
                ) : (
                  <SegmentOccupancySection
                    trip={trip}
                    seats={seatData?.seats ?? []}
                  />
                )}
              </div>
            ) : null}

            {view === "passengers" &&
            (confirmedBookings.length > 0 || holdBookings.length > 0) ? (
              <div className="space-y-4">
                {confirmedBookings.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Confirmed Passengers ({confirmedBookings.length})
                      </h4>
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        {checkedInCount} / {confirmedBookings.length} checked in
                      </span>
                    </div>
                    {/* L7: bulk action toolbar */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {pendingCheckIns.length > 0 ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] px-2"
                          onClick={() => void handleCheckInAll()}
                          disabled={bulkCheckInMutation.isPending}
                        >
                          {bulkCheckInMutation.isPending ? (
                            <Spinner className="size-3" />
                          ) : (
                            `Check In All (${pendingCheckIns.length})`
                          )}
                        </Button>
                      ) : null}
                      {selectedIds.size > 0 ? (
                        <span className="text-[11px] font-semibold text-muted-foreground">
                          {selectedIds.size} selected
                        </span>
                      ) : null}
                      {selectedIds.size > 0 && !bulkCancelOpen ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 text-[11px] px-2"
                          onClick={() => setBulkCancelOpen(true)}
                        >
                          Cancel selected
                        </Button>
                      ) : null}
                      {selectedIds.size > 0 ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-[11px] px-2"
                          onClick={() => setSelectedIds(new Set())}
                        >
                          Clear
                        </Button>
                      ) : null}
                    </div>
                    {bulkCancelOpen ? (
                      <div className="space-y-2 border border-destructive/20 rounded-md p-2">
                        <Input
                          placeholder="Cancellation reason…"
                          aria-label="Cancellation reason"
                          value={bulkReason}
                          onChange={(e) => setBulkReason(e.target.value)}
                          className="text-sm"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => void handleBulkCancel()}
                            disabled={
                              bulkCancelMutation.isPending || !bulkReason.trim()
                            }
                            className="flex-1"
                          >
                            {bulkCancelMutation.isPending ? (
                              <Spinner className="size-3" />
                            ) : (
                              `Confirm Cancel (${selectedIds.size})`
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setBulkCancelOpen(false);
                              setBulkReason("");
                            }}
                          >
                            Back
                          </Button>
                        </div>
                      </div>
                    ) : null}
                    <div className="border border-border rounded-md overflow-hidden">
                      {confirmedBookings.map((b) => (
                        <div
                          key={b.id}
                          className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-2 px-3 py-2.5 border-b border-border last:border-b-0 items-center"
                        >
                          <input
                            type="checkbox"
                            className="size-4 accent-primary"
                            checked={selectedIds.has(b.id)}
                            onChange={() => toggleSelect(b.id)}
                            aria-label={`Select ${b.passengerName}`}
                          />
                          <div>
                            <p className="text-xs font-semibold">{b.passengerName}</p>
                            {b.passengerPhone ? (
                              <p className="text-[11px] text-muted-foreground">
                                {b.passengerPhone}
                              </p>
                            ) : null}
                          </div>
                          <span className="font-mono text-xs font-bold">
                            {b.seat?.label ?? "—"}
                          </span>
                          <span
                            className={cn(
                              "text-[11px] font-bold",
                              b.checkedInAt
                                ? "text-green-600"
                                : "text-muted-foreground",
                            )}
                          >
                            {b.checkedInAt
                              ? "Checked in"
                              : b.status === "CONFIRMED"
                                ? "Pending"
                                : b.status}
                          </span>
                          {canCheckIn &&
                          b.status === "CONFIRMED" &&
                          !b.checkedInAt ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[11px] px-2"
                              disabled={
                                checkingInId === b.id || checkInMutation.isPending
                              }
                              onClick={() => void handleManualCheckIn(b.id)}
                            >
                              {checkingInId === b.id ? (
                                <Spinner className="size-3" />
                              ) : (
                                "Check in"
                              )}
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground text-right">
                              —
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                {holdBookings.length > 0 ? (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Pending Holds ({holdBookings.length})
                    </h4>
                    <div className="border border-border rounded-md overflow-hidden">
                      {holdBookings.map((b) => (
                        <div
                          key={b.id}
                          className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-2.5 border-b border-border last:border-b-0 items-center opacity-60"
                        >
                          <div>
                            <p className="text-xs font-semibold">{b.passengerName}</p>
                            {b.passengerPhone ? (
                              <p className="text-[11px] text-muted-foreground">
                                {b.passengerPhone}
                              </p>
                            ) : null}
                          </div>
                          <span className="font-mono text-xs font-bold">
                            {b.seat?.label ?? "—"}
                          </span>
                          <span className="text-[11px] font-bold text-amber-600">
                            Hold
                          </span>
                          <span className="text-xs text-muted-foreground text-right">
                            —
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {view === "passengers" ? (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Actions
              </h4>
              <div className="flex flex-col gap-2">
                {canCheckIn && confirmedBookings.length > 0 ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setScannerOpen(true)}
                    disabled={actionLoading}
                    className="w-full"
                  >
                    <ScanLine className="size-4 mr-2" />
                    Scan ticket
                  </Button>
                ) : null}
                {canUpdate && actions?.canBoard ? (
                  <Button
                    size="sm"
                    onClick={() =>
                      updateStatusMutation.mutate({
                        id: trip.id,
                        status: "BOARDING",
                      })
                    }
                    disabled={actionLoading || !trip.busId}
                    className="w-full"
                  >
                    <CheckCircle2 className="size-4 mr-2" />
                    Start Boarding
                  </Button>
                ) : null}
                {canUpdate && actions?.canDepart ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      updateStatusMutation.mutate({
                        id: trip.id,
                        status: "DEPARTED",
                      })
                    }
                    disabled={actionLoading}
                    className="w-full"
                  >
                    Mark Departed
                  </Button>
                ) : null}
                {canUpdate && actions?.canArrive ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      updateStatusMutation.mutate({
                        id: trip.id,
                        status: "ARRIVED",
                      })
                    }
                    disabled={actionLoading}
                    className="w-full"
                  >
                    Mark Arrived
                  </Button>
                ) : null}
                {canUpdate && actions?.canDelay ? (
                  showDelayForm ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        placeholder="Minutes"
                        value={delayMinutes}
                        onChange={(e) => setDelayMinutes(e.target.value)}
                        className="h-8 text-sm"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const mins = parseInt(delayMinutes, 10);
                          if (isNaN(mins) || mins <= 0) {
                            toast.error("Enter a valid delay in minutes");
                            return;
                          }
                          delayMutation.mutate({
                            id: trip.id,
                            data: { delayMinutes: mins },
                          });
                        }}
                        disabled={actionLoading}
                      >
                        Log
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowDelayForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowDelayForm(true)}
                      className="w-full text-amber-600 border-amber-200"
                    >
                      <AlertTriangle className="size-4 mr-2" />
                      Log Delay
                    </Button>
                  )
                ) : null}
                {canCancel && actions?.canCancel ? (
                  showCancelForm ? (
                    <div className="space-y-2">
                      <Input
                        placeholder="Cancellation reason…"
                        aria-label="Cancellation reason"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (!cancelReason.trim()) {
                              toast.error("Cancellation reason is required");
                              return;
                            }
                            cancelMutation.mutate({
                              id: trip.id,
                              data: { cancelReason: cancelReason.trim() },
                            });
                          }}
                          disabled={actionLoading || !cancelReason.trim()}
                          className="flex-1"
                        >
                          Confirm Cancel
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowCancelForm(false)}
                        >
                          Back
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowCancelForm(true)}
                      className="w-full text-destructive border-destructive/20"
                    >
                      <XCircle className="size-4 mr-2" />
                      Cancel Trip
                    </Button>
                  )
                ) : null}
              </div>
            </div>
            ) : null}
          </div>
        ) : null}
      </DrawerContent>
      <TicketScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScan={handleScanCheckIn}
        disabled={!trip}
        description="Scan passenger tickets for this departure. Only tickets for this trip will be accepted."
      />
    </Drawer>
  );
}
