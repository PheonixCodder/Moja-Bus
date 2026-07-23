"use client";

import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock8 } from "lucide-react";
import { cn } from "@moja/ui/lib/utils";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
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
        <h3 className="text-sm font-bold text-foreground">Calendar & timing</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Set the days, departure time, and the preferred bus for generated
          trips.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold">Runs on</Label>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Operating days">
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
            ? "No days selected"
            : activeDays === 7
              ? "Runs every day"
              : `Runs ${activeDays} day${activeDays > 1 ? "s" : ""} per week`}
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-2">
        <Label htmlFor="time-picker" className="text-xs font-semibold">
          Departure time *
        </Label>
        <div className="relative">
          <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3">
            <Clock8 className="size-4" />
            <span className="sr-only">Departure Time</span>
          </div>
          <Input
            type="time"
            id="time-picker"
            value={config.departureTime}
            onChange={(e) =>
              onChange({ ...config, departureTime: e.target.value })
            }
            className="peer bg-background appearance-none pl-9 [&::-webkit-calendar-picker-indicator]:hidden text-sm w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Valid from *</Label>
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
                <span>Pick a date</span>
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
              This date is in the past. Please select today or a future date.
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">
            Valid until (optional)
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
                <span>Pick a date</span>
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
        <Label className="text-xs font-semibold">Preferred bus *</Label>
        <Combobox
          items={activeBuses.map((b) => ({
            value: b.id,
            label: `${b.registrationPlate}${b.internalName ? ` — ${b.internalName}` : ""} (${b.layoutTemplate?.totalSeats ?? "?"} seats)`,
          }))}
          value={config.preferredBusId}
          onValueChange={(val) => {
            if (val) onChange({ ...config, preferredBusId: val });
          }}
        >
          <ComboboxInput
            placeholder="Select a bus…"
            className="w-full text-sm"
            value={
              config.preferredBusId
                ? (() => {
                    const b = buses.find((x) => x.id === config.preferredBusId);
                    return b
                      ? `${b.registrationPlate}${b.internalName ? ` — ${b.internalName}` : ""} (${b.layoutTemplate?.totalSeats ?? "?"} seats)`
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
                  {b.internalName ? ` — ${b.internalName}` : ""} (
                  {b.layoutTemplate?.totalSeats ?? "?"} seats)
                </ComboboxItem>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        <p className="text-[11px] text-muted-foreground">
          Used as the default bus when generating trips. Individual trips can
          still be reassigned later.
        </p>
      </div>
    </div>
  );
}
