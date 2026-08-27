"use client";

import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@moja/ui/lib/utils";
import { Button } from "@moja/ui/components/ui/button";
import { Label } from "@moja/ui/components/ui/label";
import { Calendar } from "@moja/ui/components/ui/calendar";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@moja/ui/components/ui/combobox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@moja/ui/components/ui/popover";
import {
  DAYS,
  type DayKey,
  parseLocalDate,
} from "@/features/operator/lib/schedules/schedule-search-params";
import { DepartureTimesEditor } from "./departure-times-editor";
import type {
  BusListItem,
  CalendarConfig,
} from "@/features/operator/lib/schedules/types";

export function CalendarStep({
  config,
  buses,
  onChange,
}: {
  config: CalendarConfig;
  buses: BusListItem[];
  onChange: (c: CalendarConfig) => void;
}) {
  const t = useTranslations("operatorDashboard.schedules");
  const tc = useTranslations("common");

  function toggleDay(key: DayKey) {
    onChange({ ...config, days: { ...config.days, [key]: !config.days[key] } });
  }

  const activeDays = DAYS.filter((d) => config.days[d.key]).length;
  const activeBuses = buses.filter((b) => b.status === "ACTIVE");

  // Re-compute on every render: if the wizard was left open overnight the previously
  // valid "today" date will have become yesterday without the operator noticing.
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);
  const validFromDate = parseLocalDate(config.validFrom);
  const isValidFromStale =
    validFromDate !== undefined && validFromDate < todayMidnight;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-foreground">
          {t("wizard.calendarTitle")}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t("wizard.calendarDesc")}
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold">{t("wizard.runsOn")}</Label>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label={t("wizard.runsOn")}
        >
          {DAYS.map((d) => {
            const active = config.days[d.key];
            return (
              <button
                type="button"
                key={d.key}
                onClick={() => toggleDay(d.key)}
                aria-pressed={active}
                className={cn(
                  "px-4 py-2 rounded-full border text-xs font-bold transition-all duration-150",
                  active
                    ? "border-primary bg-primary text-white shadow-sm"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40",
                )}
              >
                {d.label}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-muted-foreground">
          {activeDays === 0
            ? t("wizard.noDays")
            : activeDays === 7
              ? t("wizard.everyDay")
              : t("wizard.daysPerWeek", { count: activeDays })}
        </p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-2">
        <DepartureTimesEditor
          times={config.departureTimes}
          onChange={(departureTimes) => onChange({ ...config, departureTimes })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">
            {t("wizard.validFrom")}
          </Label>
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  className={cn(
                    "w-full pl-3 text-left font-normal text-sm border-border h-9 rounded-md bg-card",
                    !config.validFrom && "text-muted-foreground",
                  )}
                />
              }
            >
              {config.validFrom ? (
                format(parseLocalDate(config.validFrom)!, "PPP")
              ) : (
                <span>{t("wizard.pickDate")}</span>
              )}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50 text-muted-foreground" />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={parseLocalDate(config.validFrom)}
                onSelect={(date) => {
                  if (date) {
                    const yyyy = date.getFullYear();
                    const mm = String(date.getMonth() + 1).padStart(2, "0");
                    const dd = String(date.getDate()).padStart(2, "0");
                    onChange({ ...config, validFrom: `${yyyy}-${mm}-${dd}` });
                  } else {
                    onChange({ ...config, validFrom: "" });
                  }
                }}
                disabled={(date) =>
                  date < new Date(new Date().setHours(0, 0, 0, 0))
                }
              />
            </PopoverContent>
          </Popover>
          {isValidFromStale && (
            <p className="text-xs text-destructive mt-1">
              {t("wizard.dateInPast")}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">
            {t("wizard.validUntil")}
          </Label>
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  className={cn(
                    "w-full pl-3 text-left font-normal text-sm border-border h-9 rounded-md bg-card",
                    !config.validUntil && "text-muted-foreground",
                  )}
                />
              }
            >
              {config.validUntil ? (
                format(parseLocalDate(config.validUntil)!, "PPP")
              ) : (
                <span>{t("wizard.pickDate")}</span>
              )}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50 text-muted-foreground" />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={parseLocalDate(config.validUntil)}
                onSelect={(date) => {
                  if (date) {
                    const yyyy = date.getFullYear();
                    const mm = String(date.getMonth() + 1).padStart(2, "0");
                    const dd = String(date.getDate()).padStart(2, "0");
                    onChange({ ...config, validUntil: `${yyyy}-${mm}-${dd}` });
                  } else {
                    onChange({ ...config, validUntil: "" });
                  }
                }}
                disabled={(date) =>
                  config.validFrom
                    ? date < parseLocalDate(config.validFrom)!
                    : date < new Date(new Date().setHours(0, 0, 0, 0))
                }
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">
          {t("wizard.preferredBus")}
        </Label>
        <Combobox
          items={activeBuses.map((b) => ({
            value: b.id,
            label: `${b.registrationPlate}${b.internalName ? ` — ${b.internalName}` : ""} (${b.layoutTemplate?.totalSeats ?? "?"} ${t("wizard.seats")})`,
          }))}
          value={config.preferredBusId}
          onValueChange={(val) => {
            if (val) onChange({ ...config, preferredBusId: val });
          }}
        >
          <ComboboxInput
            placeholder={t("wizard.selectBus")}
            className="w-full text-sm"
            value={
              config.preferredBusId
                ? (() => {
                    const b = buses.find((x) => x.id === config.preferredBusId);
                    return b
                      ? `${b.registrationPlate}${b.internalName ? ` — ${b.internalName}` : ""} (${b.layoutTemplate?.totalSeats ?? "?"} ${t("wizard.seats")})`
                      : "";
                  })()
                : ""
            }
          />
          <ComboboxContent>
            <ComboboxEmpty>{t("wizard.noActiveBus")}</ComboboxEmpty>
            <ComboboxList>
              {activeBuses.map((b) => (
                <ComboboxItem key={b.id} value={b.id}>
                  {b.registrationPlate}
                  {b.internalName ? ` — ${b.internalName}` : ""} (
                  {b.layoutTemplate?.totalSeats ?? "?"} {t("wizard.seats")})
                </ComboboxItem>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        <p className="text-[11px] text-muted-foreground">
          {t("wizard.busDesc")}
        </p>
      </div>
    </div>
  );
}
