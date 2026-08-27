"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
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
import { DepartureTimesEditor } from "./departure-times-editor";

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
  const t = useTranslations("operatorDashboard.schedules");
  const tc = useTranslations("common");

  const [editName, setEditName] = useState("");
  const [editDepartureTimes, setEditDepartureTimes] = useState<string[]>([
    "08:00",
  ]);
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
    setEditDepartureTimes(
      schedule.departureTimes.length > 0
        ? schedule.departureTimes
        : [schedule.departureTime],
    );
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
      departureTimes:
        schedule.departureTimes.length > 0
          ? schedule.departureTimes
          : [schedule.departureTime],
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
      departureTimes:
        schedule.departureTimes.length > 0
          ? schedule.departureTimes
          : [schedule.departureTime],
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
      departureTimes: editDepartureTimes,
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
    stops.find((s) => s.order === order)?.name ??
    t("editDrawer.stopName", { order });

  async function handleAddException() {
    if (!schedule || !exceptionDate) {
      toast.error(t("editDrawer.selectDateForException"));
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
      toast.success(t("editDrawer.exceptionAdded"));
      await queryClient.invalidateQueries(trpc.schedules.list.pathFilter());
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : t("editDrawer.exceptionAddFailed"),
      );
    }
  }

  async function handleRemoveException(exceptionId: string) {
    try {
      await removeExceptionMutation.mutateAsync({ exceptionId });
      setEditExceptions((prev) => prev.filter((e) => e.id !== exceptionId));
      toast.success(t("editDrawer.exceptionRemoved"));
      await queryClient.invalidateQueries(trpc.schedules.list.pathFilter());
    } catch (err: unknown) {
      toast.error(
        err instanceof Error
          ? err.message
          : t("editDrawer.exceptionRemoveFailed"),
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
          departureTimes: editDepartureTimes,
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
          ? t("editDrawer.scheduleUpdatedReconciled")
          : t("editDrawer.scheduleUpdated"),
      );
      await queryClient.invalidateQueries(trpc.schedules.list.pathFilter());
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error
          ? err.message
          : t("editDrawer.scheduleUpdateFailed"),
      );
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
          err instanceof Error ? err.message : t("editDrawer.fareUpdateFailed"),
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

  const exceptionTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      CANCELLED: t("editDrawer.typeCancelled"),
      MODIFIED: t("editDrawer.typeModified"),
      EXTRA_SERVICE: t("editDrawer.typeExtraService"),
    };
    return map[type] ?? type;
  };

  const exceptionReasonLabel = (reason: string) => {
    const map: Record<string, string> = {
      OPERATIONAL: t("editDrawer.reasonOperational"),
      HOLIDAY_NATIONAL: t("editDrawer.reasonNationalHoliday"),
      HOLIDAY_ISLAMIC: t("editDrawer.reasonIslamicHoliday"),
      HOLIDAY_CHRISTIAN: t("editDrawer.reasonChristianHoliday"),
      WEATHER: t("editDrawer.reasonWeather"),
      MAINTENANCE: t("editDrawer.reasonMaintenance"),
      STRIKE: t("editDrawer.reasonStrike"),
      OTHER: t("editDrawer.reasonOther"),
    };
    return map[reason] ?? reason;
  };

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next && isDirty()) {
          if (!window.confirm(t("editDrawer.unsavedChanges"))) {
            return;
          }
        }
        onOpenChange(next);
      }}
    >
      <DrawerContent className="max-h-[92vh] flex flex-col">
        <DrawerHeader className="border-b border-border py-4 shrink-0">
          <DrawerTitle className="text-base font-bold tracking-tight">
            {t("editDrawer.title", {
              name:
                schedule?.name ??
                schedule?.route?.name ??
                t("editDrawer.scheduleName"),
            })}
          </DrawerTitle>
          <DrawerDescription className="text-xs">
            {t("editDrawer.description")}
          </DrawerDescription>
        </DrawerHeader>

        <form
          onSubmit={handleSave}
          className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0"
        >
          <div className="border border-amber-200 bg-amber-50 rounded-md p-3.5 flex items-start gap-2.5 text-amber-800">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <p className="font-bold">{t("editDrawer.alertTitle")}</p>
              <p className="mt-0.5">{t("editDrawer.alertDesc")}</p>
            </div>
          </div>

          <div className="space-y-3.5">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border/60 pb-1">
              {t("editDrawer.basicInfo")}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="edit-name" className="text-xs font-semibold">
                  {t("editDrawer.scheduleName")}
                </Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder={t("editDrawer.scheduleNamePlaceholder")}
                  className="h-9 text-xs shadow-none border-border"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <DepartureTimesEditor
                  times={editDepartureTimes}
                  onChange={setEditDepartureTimes}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                {t("editDrawer.preferredBus")}
              </Label>
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
                  placeholder={t("editDrawer.selectPreferredBus")}
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
                  <ComboboxEmpty>{t("editDrawer.noActiveBus")}</ComboboxEmpty>
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
                  {t("editDrawer.statusActive")}
                </Label>
                <p className="text-[10px] text-muted-foreground">
                  {t("editDrawer.statusActiveDesc")}
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
                  {t("editDrawer.applyForward")}
                </Label>
                <p className="text-[10px] text-muted-foreground">
                  {t("editDrawer.applyForwardDesc")}
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
                {t("editDrawer.recurrenceCalendar")}
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
                    {t("editDrawer.validFrom")} *
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
                    {t("editDrawer.validUntil")}
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
              {t("editDrawer.serviceExceptions")}
            </h3>
            {editExceptions.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                {t("editDrawer.noExceptions")}
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
                        {exceptionTypeLabel(exception.type)}
                        {exception.overrideDepartureTime
                          ? ` @ ${exception.overrideDepartureTime}`
                          : ""}
                      </p>
                      <p className="text-muted-foreground">
                        {exceptionReasonLabel(exception.reason)}
                        {exception.notes ? ` — ${exception.notes}` : ""}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveException(exception.id)}
                    >
                      {tc("remove")}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  {t("editDrawer.date")}
                </Label>
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
                <Label className="text-xs font-semibold">
                  {t("editDrawer.type")}
                </Label>
                <Select
                  value={exceptionType}
                  onValueChange={(val) =>
                    setExceptionType(
                      (val ?? "CANCELLED") as
                        | "CANCELLED"
                        | "EXTRA_SERVICE"
                        | "MODIFIED",
                    )
                  }
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder={t("editDrawer.selectType")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CANCELLED">
                      {t("editDrawer.typeCancelled")}
                    </SelectItem>
                    <SelectItem value="MODIFIED">
                      {t("editDrawer.typeModified")}
                    </SelectItem>
                    <SelectItem value="EXTRA_SERVICE">
                      {t("editDrawer.typeExtraService")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {exceptionType === "MODIFIED" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    {t("editDrawer.overrideDepartureTime")}
                  </Label>
                  <TimePicker
                    value={exceptionOverrideTime}
                    onChange={(newTime) => setExceptionOverrideTime(newTime)}
                    className="h-9 text-xs"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  {t("editDrawer.reason")}
                </Label>
                <Select
                  value={exceptionReason}
                  onValueChange={(val) =>
                    setExceptionReason(val ?? "OPERATIONAL")
                  }
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder={t("editDrawer.selectReason")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPERATIONAL">
                      {t("editDrawer.reasonOperational")}
                    </SelectItem>
                    <SelectItem value="HOLIDAY_NATIONAL">
                      {t("editDrawer.reasonNationalHoliday")}
                    </SelectItem>
                    <SelectItem value="HOLIDAY_ISLAMIC">
                      {t("editDrawer.reasonIslamicHoliday")}
                    </SelectItem>
                    <SelectItem value="HOLIDAY_CHRISTIAN">
                      {t("editDrawer.reasonChristianHoliday")}
                    </SelectItem>
                    <SelectItem value="WEATHER">
                      {t("editDrawer.reasonWeather")}
                    </SelectItem>
                    <SelectItem value="MAINTENANCE">
                      {t("editDrawer.reasonMaintenance")}
                    </SelectItem>
                    <SelectItem value="STRIKE">
                      {t("editDrawer.reasonStrike")}
                    </SelectItem>
                    <SelectItem value="OTHER">
                      {t("editDrawer.reasonOther")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  {t("editDrawer.notes")}
                </Label>
                <Input
                  value={exceptionNotes}
                  onChange={(e) => setExceptionNotes(e.target.value)}
                  placeholder={t("editDrawer.notesPlaceholder")}
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
              {t("editDrawer.addException")}
            </Button>
          </div>

          <div className="space-y-3.5">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border/60 pb-1">
              {t("editDrawer.fareMatrix")}
            </h3>
            {editFares.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                {t("editDrawer.noFares")}
              </p>
            ) : (
              <div className="border border-border rounded-md overflow-hidden bg-card">
                <div className="grid bg-slate-50 border-b border-border px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <div
                    className="grid gap-2"
                    style={{ gridTemplateColumns: "1fr 1fr auto" }}
                  >
                    <span>{t("editDrawer.from")}</span>
                    <span>{t("editDrawer.to")}</span>
                    <span className="w-32 text-right">
                      {t("editDrawer.price")}
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-border">
                  {editFares.map((f) => (
                    <div
                      key={f.id}
                      className="grid gap-2 px-4 py-2.5 items-center hover:bg-slate-50/50"
                      style={{ gridTemplateColumns: "1fr 1fr auto" }}
                    >
                      <span className="text-xs font-semibold text-foreground">
                        {stopName(f.fromStopOrder)}
                      </span>
                      <span className="text-xs font-semibold text-foreground">
                        {stopName(f.toStopOrder)}
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
                          aria-label={t("editDrawer.priceAria", {
                            fromName: stopName(f.fromStopOrder),
                            toName: stopName(f.toStopOrder),
                          })}
                        />
                        {savingFareIds.has(f.id) && (
                          <span className="text-[10px] text-muted-foreground">
                            {tc("saving")}
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
            {t("editDrawer.extendTripWindow")}
          </Button>
          <div className="flex gap-2">
            <DrawerClose asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8.5 text-xs font-semibold"
              >
                {tc("cancel")}
              </Button>
            </DrawerClose>
            <Button
              size="sm"
              disabled={editSaving}
              className="h-8.5 text-xs font-semibold"
              onClick={handleSave}
            >
              {editSaving && <Spinner className="size-3 mr-1.5" />}
              {tc("save")}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
