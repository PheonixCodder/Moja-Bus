"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@moja/ui/lib/utils";
import { Button } from "@moja/ui/components/ui/button";
import { DatePicker } from "@moja/ui/components/ui/date-picker";
import { TimePicker } from "@moja/ui/components/ui/time-picker";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { Switch } from "@moja/ui/components/ui/switch";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@moja/ui/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@moja/ui/components/ui/combobox";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DAYS,
  humanizeEnum,
} from "@/features/operator/lib/schedules/schedule-search-params";
import type {
  BusListItem,
  CalendarConfig,
  ScheduleDetail,
} from "@/features/operator/lib/schedules/types";
import { buildStopsFromRoute } from "@/features/operator/lib/schedules/types";

export function ScheduleEditDrawer({
  open,
  schedule,
  buses,
  extending,
  onOpenChange,
  onExtend,
}: {
  open: boolean;
  schedule: ScheduleDetail | null;
  buses: BusListItem[];
  extending: boolean;
  onOpenChange: (open: boolean) => void;
  onExtend: () => void;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [editName, setEditName] = useState("");
  const [editDepartureTime, setEditDepartureTime] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editPreferredBusId, setEditPreferredBusId] = useState("");
  const [editCalConfig, setEditCalConfig] = useState<CalendarConfig | null>(
    null,
  );
  const [editFares, setEditFares] = useState<ScheduleDetail["fares"]>([]);
  const [editExceptions, setEditExceptions] = useState<
    ScheduleDetail["exceptions"]
  >([]);
  const [exceptionDate, setExceptionDate] = useState("");
  const [exceptionType, setExceptionType] = useState<
    "CANCELLED" | "EXTRA_SERVICE" | "MODIFIED"
  >("CANCELLED");
  const [exceptionReason, setExceptionReason] = useState("OPERATIONAL");
  const [exceptionNotes, setExceptionNotes] = useState("");
  const [exceptionOverrideTime, setExceptionOverrideTime] = useState("08:00");
  const [applyForward, setApplyForward] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [savingFareIds, setSavingFareIds] = useState<Set<string>>(new Set());
  const fareDebounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );
  const baselineRef = useRef("");

  useEffect(() => {
    if (!schedule || !open) return;
    setEditName(schedule.name ?? "");
    setEditDepartureTime(schedule.departureTime);
    setEditIsActive(schedule.isActive);
    setEditPreferredBusId(schedule.preferredBusId ?? "");
    const cal = schedule.calendar;
    const cfg: CalendarConfig = {
      days: {
        monday: cal?.monday ?? false,
        tuesday: cal?.tuesday ?? false,
        wednesday: cal?.wednesday ?? false,
        thursday: cal?.thursday ?? false,
        friday: cal?.friday ?? false,
        saturday: cal?.saturday ?? false,
        sunday: cal?.sunday ?? false,
      },
      departureTime: schedule.departureTime,
      validFrom: cal?.validFrom
        ? new Date(cal.validFrom).toISOString().slice(0, 10)
        : "",
      validUntil: cal?.validUntil
        ? new Date(cal.validUntil).toISOString().slice(0, 10)
        : "",
      preferredBusId: schedule.preferredBusId ?? "",
    };
    setEditCalConfig(cfg);
    setEditFares(schedule.fares ?? []);
    setEditExceptions(schedule.exceptions ?? []);
    setApplyForward(false);
    baselineRef.current = JSON.stringify({
      name: schedule.name ?? "",
      departureTime: schedule.departureTime,
      isActive: schedule.isActive,
      preferredBusId: schedule.preferredBusId ?? "",
      days: cfg.days,
      validFrom: cfg.validFrom,
      validUntil: cfg.validUntil,
    });
  }, [schedule, open]);

  const updateBasicMutation = useMutation({
    ...trpc.schedules.updateBasic.mutationOptions(),
  });
  const updateCalendarMutation = useMutation({
    ...trpc.schedules.updateCalendar.mutationOptions(),
  });
  const updateFareMutation = useMutation({
    ...trpc.schedules.updateFare.mutationOptions(),
  });
  const addExceptionMutation = useMutation({
    ...trpc.schedules.addException.mutationOptions(),
  });
  const removeExceptionMutation = useMutation({
    ...trpc.schedules.removeException.mutationOptions(),
  });
  const reconcileMutation = useMutation({
    ...trpc.schedules.reconcileFutureTrips.mutationOptions(),
  });

  function isDirty() {
    if (!editCalConfig) return false;
    const current = JSON.stringify({
      name: editName,
      departureTime: editDepartureTime,
      isActive: editIsActive,
      preferredBusId: editPreferredBusId,
      days: editCalConfig.days,
      validFrom: editCalConfig.validFrom,
      validUntil: editCalConfig.validUntil,
    });
    return current !== baselineRef.current;
  }

  const stops = schedule?.route
    ? buildStopsFromRoute(schedule.route as never)
    : [];
  const stopName = (order: number) =>
    stops.find((s) => s.order === order)?.name ?? `Stop ${order}`;

  async function handleAddException() {
    if (!schedule || !exceptionDate) {
      toast.error("Select a date for the exception");
      return;
    }
    try {
      const created = await addExceptionMutation.mutateAsync({
        scheduleId: schedule.id,
        date: exceptionDate,
        type: exceptionType,
        reason: exceptionReason as
          | "HOLIDAY_ISLAMIC"
          | "HOLIDAY_CHRISTIAN"
          | "HOLIDAY_NATIONAL"
          | "STRIKE"
          | "WEATHER"
          | "MAINTENANCE"
          | "OPERATIONAL"
          | "OTHER",
        notes: exceptionNotes || undefined,
        overrideDepartureTime:
          exceptionType === "MODIFIED" ? exceptionOverrideTime : undefined,
      });
      setEditExceptions((prev) => [...prev, created]);
      setExceptionDate("");
      setExceptionNotes("");
      toast.success("Service exception added");
      await queryClient.invalidateQueries(trpc.schedules.list.pathFilter());
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add exception");
    }
  }

  async function handleRemoveException(exceptionId: string) {
    try {
      await removeExceptionMutation.mutateAsync({ exceptionId });
      setEditExceptions((prev) => prev.filter((e) => e.id !== exceptionId));
      toast.success("Service exception removed");
      await queryClient.invalidateQueries(trpc.schedules.list.pathFilter());
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to remove exception",
      );
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!schedule || !editCalConfig) return;
    setEditSaving(true);
    try {
      await updateBasicMutation.mutateAsync({
        id: schedule.id,
        data: {
          name: editName.trim() || null,
          departureTime: editDepartureTime,
          isActive: editIsActive,
          preferredBusId: editPreferredBusId || null,
        },
      });

      if (schedule.calendar) {
        await updateCalendarMutation.mutateAsync({
          id: schedule.id,
          data: {
            monday: editCalConfig.days.monday,
            tuesday: editCalConfig.days.tuesday,
            wednesday: editCalConfig.days.wednesday,
            thursday: editCalConfig.days.thursday,
            friday: editCalConfig.days.friday,
            saturday: editCalConfig.days.saturday,
            sunday: editCalConfig.days.sunday,
            validFrom: new Date(editCalConfig.validFrom).toISOString(),
            validUntil: editCalConfig.validUntil
              ? new Date(editCalConfig.validUntil).toISOString()
              : null,
          },
        });
      }

      if (applyForward) {
        await reconcileMutation.mutateAsync({
          id: schedule.id,
          busId: editPreferredBusId || undefined,
        });
      }

      toast.success(
        applyForward
          ? "Schedule updated and future empty trips reconciled"
          : "Schedule updated successfully",
      );
      await queryClient.invalidateQueries(trpc.schedules.list.pathFilter());
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update schedule");
    } finally {
      setEditSaving(false);
    }
  }

  function handleFarePriceChange(fareId: string, priceVal: string) {
    if (!schedule) return;
    const parsed = parseInt(priceVal, 10);
    const price = Number.isNaN(parsed) ? 0 : parsed;

    setEditFares((prev) =>
      prev.map((f) => (f.id === fareId ? { ...f, priceXOF: price } : f)),
    );

    const existingTimer = fareDebounceRef.current[fareId];
    if (existingTimer) clearTimeout(existingTimer);

    fareDebounceRef.current[fareId] = setTimeout(async () => {
      try {
        setSavingFareIds((prev) => new Set(prev).add(fareId));
        await updateFareMutation.mutateAsync({
          scheduleId: schedule.id,
          fareId,
          data: { priceXOF: price },
        });
        queryClient.invalidateQueries(trpc.schedules.get.queryFilter());
        queryClient.invalidateQueries(trpc.schedules.list.pathFilter());
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : "Failed to update fare price",
        );
      } finally {
        setSavingFareIds((prev) => {
          const next = new Set(prev);
          next.delete(fareId);
          return next;
        });
      }
    }, 500);
  }

  const activeBuses = buses.filter((b) => b.status === "ACTIVE");

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next && isDirty()) {
          if (
            !window.confirm(
              "You have unsaved changes. Are you sure you want to discard them?",
            )
          ) {
            return;
          }
        }
        onOpenChange(next);
      }}
    >
      <DrawerContent className="max-h-[92vh] flex flex-col">
        <DrawerHeader className="border-b border-border py-4 shrink-0">
          <DrawerTitle className="text-base font-bold tracking-tight">
            Edit Operating Schedule:{" "}
            {schedule?.name ?? schedule?.route?.name ?? "Schedule"}
          </DrawerTitle>
          <DrawerDescription className="text-xs">
            Modify timing, recurrence calendar, preferred bus, and pricing.
          </DrawerDescription>
        </DrawerHeader>

        <form
          onSubmit={handleSave}
          className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0"
        >
          <div className="border border-amber-200 bg-amber-50 rounded-md p-3.5 flex items-start gap-2.5 text-amber-800">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <p className="font-bold">Important Notice</p>
              <p className="mt-0.5">
                Departure time and calendar updates only apply to newly
                generated trips unless you enable “Apply to future empty trips”
                below.
              </p>
            </div>
          </div>

          <div className="space-y-3.5">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border/60 pb-1">
              Basic Info & Status
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="edit-name" className="text-xs font-semibold">
                  Schedule Name (Optional)
                </Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Morning Express"
                  className="h-9 text-xs shadow-none border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-time" className="text-xs font-semibold">
                  Departure Time *
                </Label>
                <TimePicker
                  value={editDepartureTime}
                  onChange={(newTime) => setEditDepartureTime(newTime)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Preferred bus</Label>
              <Combobox
                items={activeBuses.map((b) => ({
                  value: b.id,
                  label: `${b.registrationPlate}${b.internalName ? ` — ${b.internalName}` : ""}`,
                }))}
                value={editPreferredBusId}
                onValueChange={(val) => {
                  if (val) setEditPreferredBusId(val);
                }}
              >
                <ComboboxInput
                  placeholder="Select preferred bus…"
                  className="w-full text-sm"
                  value={
                    editPreferredBusId
                      ? (() => {
                          const b = buses.find(
                            (x) => x.id === editPreferredBusId,
                          );
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
                    {activeBuses.map((b) => (
                      <ComboboxItem key={b.id} value={b.id}>
                        {b.registrationPlate}
                        {b.internalName ? ` — ${b.internalName}` : ""}
                      </ComboboxItem>
                    ))}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>

            <div className="flex items-center justify-between rounded-md border border-border bg-muted/20 p-3">
              <div className="space-y-0.5">
                <Label
                  htmlFor="edit-active-toggle"
                  className="text-xs font-semibold"
                >
                  Status Active
                </Label>
                <p className="text-[10px] text-muted-foreground">
                  Active schedules are included in the daily trip generation job
                </p>
              </div>
              <Switch
                id="edit-active-toggle"
                checked={editIsActive}
                onCheckedChange={setEditIsActive}
              />
            </div>

            <div className="flex items-center justify-between rounded-md border border-border bg-muted/20 p-3">
              <div className="space-y-0.5">
                <Label
                  htmlFor="apply-forward"
                  className="text-xs font-semibold"
                >
                  Apply to future empty trips
                </Label>
                <p className="text-[10px] text-muted-foreground">
                  Prune unbooked future trips that no longer match, then
                  regenerate the 14-day window
                </p>
              </div>
              <Switch
                id="apply-forward"
                checked={applyForward}
                onCheckedChange={setApplyForward}
              />
            </div>
          </div>

          {editCalConfig && (
            <div className="space-y-3.5">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border/60 pb-1">
                Recurrence Calendar
              </h3>
              <div className="flex flex-wrap gap-2" role="group">
                {DAYS.map((d) => {
                  const active = editCalConfig.days[d.key];
                  return (
                    <button
                      key={d.key}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        setEditCalConfig({
                          ...editCalConfig,
                          days: {
                            ...editCalConfig.days,
                            [d.key]: !active,
                          },
                        })
                      }
                      className={cn(
                        "px-3 py-1.5 rounded-md text-xs font-semibold border transition-all cursor-pointer",
                        active
                          ? "bg-primary text-white border-primary"
                          : "bg-background text-muted-foreground border-border hover:bg-slate-50",
                      )}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="edit-valid-from"
                    className="text-xs font-semibold"
                  >
                    Valid From *
                  </Label>
                  <DatePicker
                    value={editCalConfig.validFrom}
                    onChange={(date) => {
                      if (date) {
                        const yyyy = date.getFullYear();
                        const mm = String(date.getMonth() + 1).padStart(2, "0");
                        const dd = String(date.getDate()).padStart(2, "0");
                        setEditCalConfig({
                          ...editCalConfig,
                          validFrom: `${yyyy}-${mm}-${dd}`,
                        });
                      }
                    }}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="edit-valid-until"
                    className="text-xs font-semibold"
                  >
                    Valid Until (Optional)
                  </Label>
                  <DatePicker
                    value={editCalConfig.validUntil ?? ""}
                    onChange={(date) => {
                      if (date) {
                        const yyyy = date.getFullYear();
                        const mm = String(date.getMonth() + 1).padStart(2, "0");
                        const dd = String(date.getDate()).padStart(2, "0");
                        setEditCalConfig({
                          ...editCalConfig,
                          validUntil: `${yyyy}-${mm}-${dd}`,
                        });
                      } else {
                        setEditCalConfig({
                          ...editCalConfig,
                          validUntil: "",
                        });
                      }
                    }}
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3.5">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border/60 pb-1">
              Service Exceptions
            </h3>
            {editExceptions.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No exceptions configured.
              </p>
            ) : (
              <div className="space-y-2">
                {editExceptions.map((exception) => (
                  <div
                    key={exception.id}
                    className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-xs"
                  >
                    <div>
                      <p className="font-semibold">
                        {new Date(exception.date).toISOString().slice(0, 10)} —{" "}
                        {humanizeEnum(exception.type)}
                        {exception.overrideDepartureTime
                          ? ` @ ${exception.overrideDepartureTime}`
                          : ""}
                      </p>
                      <p className="text-muted-foreground">
                        {humanizeEnum(exception.reason)}
                        {exception.notes ? ` — ${exception.notes}` : ""}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveException(exception.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Date</Label>
                <DatePicker
                  value={exceptionDate}
                  onChange={(date) => {
                    if (date) {
                      const yyyy = date.getFullYear();
                      const mm = String(date.getMonth() + 1).padStart(2, "0");
                      const dd = String(date.getDate()).padStart(2, "0");
                      setExceptionDate(`${yyyy}-${mm}-${dd}`);
                    } else {
                      setExceptionDate("");
                    }
                  }}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Type</Label>
                <Select
                  value={exceptionType}
                  onValueChange={(val) =>
                    setExceptionType(
                      (val ?? "CANCELLED") as "CANCELLED" | "EXTRA_SERVICE" | "MODIFIED",
                    )
                  }
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    <SelectItem value="MODIFIED">Modified</SelectItem>
                    <SelectItem value="EXTRA_SERVICE">Extra service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {exceptionType === "MODIFIED" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    Override departure time
                  </Label>
                  <TimePicker
                    value={exceptionOverrideTime}
                    onChange={(newTime) => setExceptionOverrideTime(newTime)}
                    className="h-9 text-xs"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Reason</Label>
                <Select
                  value={exceptionReason}
                  onValueChange={(val) => setExceptionReason(val ?? "OPERATIONAL")}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPERATIONAL">Operational</SelectItem>
                    <SelectItem value="HOLIDAY_NATIONAL">National holiday</SelectItem>
                    <SelectItem value="HOLIDAY_ISLAMIC">Islamic holiday</SelectItem>
                    <SelectItem value="HOLIDAY_CHRISTIAN">Christian holiday</SelectItem>
                    <SelectItem value="WEATHER">Weather</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                    <SelectItem value="STRIKE">Strike</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Notes</Label>
                <Input
                  value={exceptionNotes}
                  onChange={(e) => setExceptionNotes(e.target.value)}
                  placeholder="Optional notes"
                  className="h-9 text-xs"
                />
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleAddException}
              disabled={addExceptionMutation.isPending}
            >
              Add Exception
            </Button>
          </div>

          <div className="space-y-3.5">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border/60 pb-1">
              Fare Matrix
            </h3>
            {editFares.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No fares configured for this schedule.
              </p>
            ) : (
              <div className="border border-border rounded-md overflow-hidden bg-card">
                <div className="grid bg-slate-50 border-b border-border px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <div
                    className="grid gap-2"
                    style={{ gridTemplateColumns: "1fr 1fr auto auto" }}
                  >
                    <span>From</span>
                    <span>To</span>
                    <span>Class</span>
                    <span className="w-32 text-right">Price (FCFA)</span>
                  </div>
                </div>
                <div className="divide-y divide-border">
                  {editFares.map((f) => (
                    <div
                      key={f.id}
                      className="grid gap-2 px-4 py-2.5 items-center hover:bg-slate-50/50"
                      style={{ gridTemplateColumns: "1fr 1fr auto auto" }}
                    >
                      <span className="text-xs font-semibold text-foreground">
                        {stopName(f.fromStopOrder)}
                      </span>
                      <span className="text-xs font-semibold text-foreground">
                        {stopName(f.toStopOrder)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {f.seatClass}
                        {!f.isActive ? " (off)" : ""}
                      </span>
                      <div className="w-32 flex flex-col gap-1 items-end">
                        <Input
                          type="number"
                          min={0}
                          value={f.priceXOF}
                          onChange={(e) =>
                            handleFarePriceChange(f.id, e.target.value)
                          }
                          className="h-8 text-xs font-mono text-right"
                          aria-label={`Price ${stopName(f.fromStopOrder)} to ${stopName(f.toStopOrder)}`}
                        />
                        {savingFareIds.has(f.id) && (
                          <span className="text-[10px] text-muted-foreground">
                            Saving…
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </form>

        <DrawerFooter className="border-t border-border py-4 shrink-0 flex-row justify-between bg-card">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8.5 text-xs font-semibold text-primary hover:bg-primary/5 hover:text-primary gap-1.5"
            onClick={onExtend}
            disabled={extending || !schedule?.isActive}
          >
            {extending ? (
              <Spinner className="size-3.5" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            Extend Trip Window
          </Button>
          <div className="flex gap-2">
            <DrawerClose asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8.5 text-xs font-semibold"
              >
                Cancel
              </Button>
            </DrawerClose>
            <Button
              size="sm"
              disabled={editSaving}
              className="h-8.5 text-xs font-semibold"
              onClick={handleSave}
            >
              {editSaving && <Spinner className="size-3 mr-1.5" />}
              Save Changes
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
