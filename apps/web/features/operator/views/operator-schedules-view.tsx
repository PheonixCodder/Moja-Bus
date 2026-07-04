"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CalendarClock,
  Plus,
  CheckCircle2,
  ArrowRight,
  Clock,
  Radio,
  ChevronRight,
  Trash2,
  AlertCircle,
  Bus,
  Pencil,
  RefreshCw,
  Clock8,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@moja/ui/lib/utils";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { Card, CardContent } from "@moja/ui/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@moja/ui/components/ui/dialog";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@moja/ui/components/ui/empty";
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
import { Calendar } from "@moja/ui/components/ui/calendar";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@moja/ui/components/ui/drawer";
import { Switch } from "@moja/ui/components/ui/switch";

import { useTRPC } from "@/trpc/client";
import {
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { RouterOutputs } from "@/trpc/client";

type Schedule = RouterOutputs["schedules"]["list"][number];
type Fare = Schedule["fares"][number];
type Route = RouterOutputs["routes"]["list"][number];
type RouteDetail = RouterOutputs["routes"]["get"];
type BusType = RouterOutputs["fleet"]["getBuses"]["buses"][number];

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

// Helper to parse dates in local timezone to prevent UTC date shifting
function parseLocalDate(dateStr: string | null | undefined): Date | undefined {
  if (!dateStr) return undefined;
  const parts = dateStr.split("T")[0]?.split("-");
  if (!parts || parts.length !== 3) return undefined;
  const year = parseInt(parts[0]!, 10);
  const month = parseInt(parts[1]!, 10) - 1;
  const day = parseInt(parts[2]!, 10);
  return new Date(year, month, day);
}

const DAYS = [
  { key: "monday", label: "Mon" },
  { key: "tuesday", label: "Tue" },
  { key: "wednesday", label: "Wed" },
  { key: "thursday", label: "Thu" },
  { key: "friday", label: "Fri" },
  { key: "saturday", label: "Sat" },
  { key: "sunday", label: "Sun" },
] as const;

type DayKey = (typeof DAYS)[number]["key"];

function formatTime(t: string) {
  const [h, m] = t.split(":");
  const hour = parseInt(h ?? "0");
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Generate rolling days for preview calendar
function getPreviewDates(
  days: Record<DayKey, boolean>,
  validFrom: string,
  count = 14,
): Date[] {
  const results: Date[] = [];
  const start = validFrom
    ? parseLocalDate(validFrom) || new Date()
    : new Date();
  const dayMap: Record<number, DayKey> = {
    0: "sunday",
    1: "monday",
    2: "tuesday",
    3: "wednesday",
    4: "thursday",
    5: "friday",
    6: "saturday",
  };
  const cursor = new Date(start);
  let iterations = 0;
  while (results.length < count && iterations < 60) {
    const key = dayMap[cursor.getDay()];
    if (key && days[key]) results.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
    iterations++;
  }
  return results;
}

// ──────────────────────────────────────────────
// Wizard step indicator
// ──────────────────────────────────────────────

const STEPS = ["Route", "Calendar", "Pricing", "Preview"] as const;
type WizardStep = (typeof STEPS)[number];

function WizardStepper({
  current,
  onStepClick,
  maxReached,
}: {
  current: WizardStep;
  onStepClick: (s: WizardStep) => void;
  maxReached: number;
}) {
  return (
    <div className="flex items-center gap-0 border-b border-border bg-slate-50/50 px-5 py-3 shrink-0">
      {STEPS.map((step, i) => {
        const idx = STEPS.indexOf(current);
        const isActive = step === current;
        const isCompleted = i < idx;
        const isClickable = i <= maxReached;

        return (
          <div key={step} className="flex items-center">
            <button
              onClick={() => isClickable && onStepClick(step)}
              disabled={!isClickable}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors",
                isActive && "bg-primary/10 text-primary",
                isCompleted && !isActive && "text-green-600 hover:bg-green-50",
                !isActive && !isCompleted && "text-muted-foreground",
                isClickable && !isActive && "hover:bg-slate-100 cursor-pointer",
                !isClickable && "cursor-not-allowed opacity-40",
              )}
            >
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full border text-[10px] font-bold",
                  isActive && "border-primary bg-primary text-white",
                  isCompleted && "border-green-600 bg-green-600 text-white",
                  !isActive &&
                    !isCompleted &&
                    "border-border bg-background text-muted-foreground",
                )}
              >
                {isCompleted ? <CheckCircle2 className="size-3" /> : i + 1}
              </span>
              {step}
            </button>
            {i < STEPS.length - 1 && (
              <ChevronRight className="size-3.5 text-border mx-1 shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────
// Step 1: Route picker
// ──────────────────────────────────────────────

function RoutePickerStep({
  routes,
  selectedId,
  onSelect,
}: {
  routes: Route[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-foreground">Select a route</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Choose which route this schedule will operate on.
        </p>
      </div>

      {routes.length === 0 ? (
        <Empty className="py-10">
          <EmptyMedia>
            <ArrowRight className="size-8 text-muted-foreground/30" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>No routes available</EmptyTitle>
            <EmptyDescription>
              Create a route first before scheduling it.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link href="/dashboard/operator/routes">
              <Button size="sm" variant="outline">
                Go to Routes →
              </Button>
            </Link>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {routes.map((r) => {
            const isSelected = r.id === selectedId;
            return (
              <button
                key={r.id}
                onClick={() => onSelect(r.id)}
                className={cn(
                  "text-left p-4 rounded-md border transition-all duration-150",
                  isSelected
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border bg-card hover:border-primary/30",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold text-foreground">{r.name}</p>
                  {isSelected && (
                    <CheckCircle2 className="size-4 text-primary shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-xs text-muted-foreground">
                    {r.originTerminal?.cityRelation?.name ??
                      r.originTerminal?.city}
                  </span>
                  <ArrowRight className="size-3 text-muted-foreground/40" />
                  <span className="text-xs text-muted-foreground">
                    {r.destTerminal?.cityRelation?.name ?? r.destTerminal?.city}
                  </span>
                </div>
                {r.estimatedMinutes && (
                  <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="size-3" />~
                    {Math.floor(r.estimatedMinutes / 60)}h{" "}
                    {r.estimatedMinutes % 60}m
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Step 2: Calendar config
// ──────────────────────────────────────────────

interface CalendarConfig {
  days: Record<DayKey, boolean>;
  departureTime: string;
  validFrom: string;
  validUntil: string;
  defaultBusId: string;
}

function CalendarStep({
  config,
  buses,
  onChange,
}: {
  config: CalendarConfig;
  buses: BusType[];
  onChange: (c: CalendarConfig) => void;
}) {
  function toggleDay(key: DayKey) {
    onChange({ ...config, days: { ...config.days, [key]: !config.days[key] } });
  }

  const activeDays = DAYS.filter((d) => config.days[d.key]).length;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-foreground">Calendar & timing</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Set the days, departure time, and the default bus for this schedule.
        </p>
      </div>

      {/* Day toggles */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold">Runs on</Label>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d) => {
            const active = config.days[d.key];
            return (
              <button
                key={d.key}
                onClick={() => toggleDay(d.key)}
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

      {/* Departure time */}
      <div className="flex w-full max-w-xs flex-col gap-2">
        <Label htmlFor="time-picker" className="text-xs font-semibold">
          Departure time *
        </Label>
        <div className="relative">
          <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 peer-disabled:opacity-50">
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
            className="peer bg-background appearance-none pl-9 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none text-sm w-full"
          />
        </div>
      </div>

      {/* Date range */}
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

      {/* Default Bus */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Default bus *</Label>
        <div className="w-full">
          <Combobox
            items={buses
              .filter((b) => b.status === "ACTIVE")
              .map((b) => ({
                value: b.id,
                label: `${b.registrationPlate}${b.internalName ? ` — ${b.internalName}` : ""} (${b.layoutTemplate?.totalSeats ?? "?"} seats)`,
              }))}
            value={config.defaultBusId}
            onValueChange={(val) => {
              if (val) onChange({ ...config, defaultBusId: val });
            }}
          >
            <ComboboxInput
              placeholder="Select a bus…"
              className="w-full text-sm"
              value={
                config.defaultBusId
                  ? (() => {
                      const b = buses.find((x) => x.id === config.defaultBusId);
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
                {buses
                  .filter((b) => b.status === "ACTIVE")
                  .map((b) => (
                    <ComboboxItem key={b.id} value={b.id}>
                      {b.registrationPlate}
                      {b.internalName ? ` — ${b.internalName}` : ""} (
                      {b.layoutTemplate?.totalSeats ?? "?"} seats)
                    </ComboboxItem>
                  ))}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Only active buses are shown. This bus will be pre-assigned to
          generated trips.
        </p>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Step 3: Pricing matrix
// ──────────────────────────────────────────────

interface StopLabel {
  order: number; // 0 = origin, 1…n = waypoints, n+1 = dest
  name: string;
  city: string;
}

interface FareDraft {
  fromStopOrder: number;
  toStopOrder: number;
  priceXOF: number;
}

function PricingStep({
  stops,
  fares,
  onChange,
}: {
  stops: StopLabel[];
  fares: FareDraft[];
  onChange: (fares: FareDraft[]) => void;
}) {
  function getFare(from: number, to: number) {
    return fares.find((f) => f.fromStopOrder === from && f.toStopOrder === to);
  }

  function setFare(from: number, to: number, price: string) {
    const parsed = parseInt(price.replace(/\D/g, ""), 10);
    const value = isNaN(parsed) ? 0 : parsed;
    const existing = fares.filter(
      (f) => !(f.fromStopOrder === from && f.toStopOrder === to),
    );
    if (value > 0) {
      onChange([
        ...existing,
        { fromStopOrder: from, toStopOrder: to, priceXOF: value },
      ]);
    } else {
      onChange(existing);
    }
  }

  if (stops.length < 2) {
    return (
      <div className="text-center py-10 text-sm text-muted-foreground">
        At least 2 stops are required to configure pricing.
      </div>
    );
  }

  // Upper triangle: from row i → to column j where j > i
  const segmentPairs: [StopLabel, StopLabel][] = [];
  for (let i = 0; i < stops.length - 1; i++) {
    for (let j = i + 1; j < stops.length; j++) {
      segmentPairs.push([stops[i]!, stops[j]!]);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-foreground">Segment pricing</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Set ticket fares (in FCFA) for every stop-to-stop combination.
        </p>
      </div>

      <div className="border border-border rounded-md overflow-hidden">
        {/* Header */}
        <div className="grid bg-slate-50 border-b border-border px-4 py-2.5">
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: "1fr 1fr auto" }}
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              From
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              To
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground w-32">
              Fare (FCFA)
            </span>
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-border">
          {segmentPairs.map(([from, to]) => {
            const fare = getFare(from.order, to.order);
            return (
              <div
                key={`${from.order}-${to.order}`}
                className="grid gap-2 px-4 py-3 items-center hover:bg-slate-50/50 transition-colors"
                style={{ gridTemplateColumns: "1fr 1fr auto" }}
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {from.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {from.city}
                  </p>
                </div>
                <div className="min-w-0 flex items-center gap-1.5">
                  <ArrowRight className="size-3 text-muted-foreground/40 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-foreground truncate">
                      {to.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {to.city}
                    </p>
                  </div>
                </div>
                <div className="w-32">
                  <Input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={fare?.priceXOF ?? ""}
                    onChange={(e) =>
                      setFare(from.order, to.order, e.target.value)
                    }
                    className="h-8 text-sm text-right font-mono"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Leave a field at 0 to make that segment unbookable. All prices are in
        West African CFA franc (FCFA).
      </p>
    </div>
  );
}

// ──────────────────────────────────────────────
// Step 4: Preview
// ──────────────────────────────────────────────

function PreviewStep({
  days,
  validFrom,
  departureTime,
  routeName,
  fares,
}: {
  days: Record<DayKey, boolean>;
  validFrom: string;
  departureTime: string;
  routeName: string;
  fares: FareDraft[];
}) {
  const previewDates = getPreviewDates(days, validFrom, 14);

  // Build a 4-week calendar from validFrom
  const start = validFrom
    ? parseLocalDate(validFrom) || new Date()
    : new Date();
  // Go back to the start of the week containing start
  const monday = new Date(start);
  monday.setDate(start.getDate() - ((start.getDay() + 6) % 7));

  const weeks: Date[][] = [];
  for (let w = 0; w < 4; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + w * 7 + d);
      week.push(day);
    }
    weeks.push(week);
  }

  const previewSet = new Set(previewDates.map((d) => d.toDateString()));
  const activeDayCount = previewDates.length;
  const totalFares = fares.filter((f) => f.priceXOF > 0).length;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-bold text-foreground">Review & preview</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Confirm everything looks right before publishing.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-md border border-border bg-slate-50/50 p-3 text-center">
          <p className="text-2xl font-bold text-primary">{activeDayCount}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            trips in first 2 weeks
          </p>
        </div>
        <div className="rounded-md border border-border bg-slate-50/50 p-3 text-center">
          <p className="text-sm font-bold text-foreground truncate">
            {routeName || "—"}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">route</p>
        </div>
        <div className="rounded-md border border-border bg-slate-50/50 p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{totalFares}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            fare segments
          </p>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="border border-border rounded-md overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 bg-slate-50 border-b border-border">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div
              key={d}
              className="py-2 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div
            key={wi}
            className="grid grid-cols-7 divide-x divide-border border-b border-border last:border-b-0"
          >
            {week.map((day, di) => {
              const isTrip = previewSet.has(day.toDateString());
              const isBeforeStart =
                validFrom && day < (parseLocalDate(validFrom) || new Date());
              return (
                <div
                  key={di}
                  className={cn(
                    "py-3 flex flex-col items-center gap-1 min-h-[52px]",
                    isBeforeStart && "bg-slate-50/70 opacity-40",
                  )}
                >
                  <span className="text-xs text-muted-foreground">
                    {day.getDate()}
                  </span>
                  {isTrip && !isBeforeStart && (
                    <div
                      className="size-2 rounded-full bg-primary"
                      title={`Trip at ${formatTime(departureTime)}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground">
        Each pink dot represents one auto-generated trip departing at{" "}
        <span className="font-semibold text-foreground">
          {formatTime(departureTime)}
        </span>
        . Trips are generated on publish and roll forward automatically.
      </p>
    </div>
  );
}

// ──────────────────────────────────────────────
// Schedule Card
// ──────────────────────────────────────────────

function ScheduleCard({
  schedule,
  onEdit,
  onDelete,
  onExtend,
}: {
  schedule: Schedule;
  onEdit: (s: Schedule) => void;
  onDelete: (s: Schedule) => void;
  onExtend: (s: Schedule) => void;
}) {
  const cal = schedule.calendar;
  const activeDays = cal
    ? DAYS.filter((d) => cal[d.key as keyof typeof cal]).map((d) => d.label)
    : [];

  return (
    <Card className="group border-border bg-card shadow-none hover:border-primary/30 hover:shadow-sm transition-all duration-200">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground truncate">
              {schedule.name ?? schedule.route?.name ?? "Unnamed Schedule"}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-muted-foreground">
                {schedule.route?.originTerminal?.cityRelation?.name ??
                  schedule.route?.originTerminal?.city}
              </span>
              <ArrowRight className="size-3 text-muted-foreground/40" />
              <span className="text-xs text-muted-foreground">
                {schedule.route?.destTerminal?.cityRelation?.name ??
                  schedule.route?.destTerminal?.city}
              </span>
            </div>
          </div>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
              schedule.isActive
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-slate-50 text-slate-500 border-slate-200",
            )}
          >
            {schedule.isActive ? "Active" : "Inactive"}
          </span>
        </div>

        <div className="flex items-center gap-3 pt-2.5 border-t border-border flex-wrap min-h-[38px]">
          <div className="flex items-center gap-1.5">
            <Clock className="size-3 text-muted-foreground/60" />
            <span className="text-[11px] font-semibold text-foreground">
              {formatTime(schedule.departureTime)}
            </span>
          </div>
          {activeDays.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {activeDays.map((d) => (
                <span
                  key={d}
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary"
                >
                  {d}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ml-auto shrink-0">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-[10px] text-muted-foreground hover:text-primary hover:bg-primary/5 font-semibold gap-1"
              onClick={() => onExtend(schedule)}
            >
              <RefreshCw className="size-3" />
              Extend
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted font-semibold gap-1"
              onClick={() => onEdit(schedule)}
            >
              <Pencil className="size-3" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/5 animate-none"
              onClick={() => onDelete(schedule)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
          {schedule._count?.trips !== undefined && (
            <span className="text-[11px] text-muted-foreground ml-auto group-hover:hidden">
              {schedule._count.trips} trips
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────────────────────────
// Main View
// ──────────────────────────────────────────────

export function OperatorSchedulesView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  // ── Data queries ──────────────────────────────
  const { data: schedules } = useSuspenseQuery(
    trpc.schedules.list.queryOptions(),
  );
  const { data: routesData } = useSuspenseQuery(
    trpc.routes.list.queryOptions(),
  );
  const { data: busesData } = useSuspenseQuery(
    trpc.fleet.getBuses.queryOptions(),
  );

  const routes = routesData ?? [];
  const buses = busesData?.buses ?? [];

  // ── Wizard open state ─────────────────────────
  const [wizardOpen, setWizardOpen] = useState(false);
  const [deletingSchedule, setDeletingSchedule] = useState<Schedule | null>(
    null,
  );

  useEffect(() => {
    if (searchParams && searchParams.get("action") === "new") {
      setWizardOpen(true);
    }
  }, [searchParams]);

  // ── Wizard state ──────────────────────────────
  const [step, setStep] = useState<WizardStep>("Route");
  const [maxStep, setMaxStep] = useState(0);
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [selectedRoute, setSelectedRoute] = useState<RouteDetail | null>(null);
  const [loadingRouteDetail, setLoadingRouteDetail] = useState(false);
  const [calConfig, setCalConfig] = useState<CalendarConfig>({
    days: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false,
    },
    departureTime: "08:00",
    validFrom: new Date().toISOString().slice(0, 10),
    validUntil: "",
    defaultBusId: "",
  });
  const [fares, setFares] = useState<FareDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  // ── Edit State ────────────────────────────────
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDepartureTime, setEditDepartureTime] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editCalConfig, setEditCalConfig] = useState<CalendarConfig>({
    days: {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false,
    },
    departureTime: "08:00",
    validFrom: "",
    validUntil: "",
    defaultBusId: "",
  });
  const [editFares, setEditFares] = useState<Fare[]>([]);
  const [editExceptions, setEditExceptions] = useState<
    Array<{
      id: string;
      date: Date;
      type: string;
      reason: string;
      notes: string | null;
    }>
  >([]);
  const [exceptionDate, setExceptionDate] = useState("");
  const [exceptionType, setExceptionType] = useState<
    "CANCELLED" | "EXTRA_SERVICE" | "MODIFIED"
  >("CANCELLED");
  const [exceptionReason, setExceptionReason] = useState("OPERATIONAL");
  const [exceptionNotes, setExceptionNotes] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [savingFareIds, setSavingFareIds] = useState<Set<string>>(new Set());
  const fareDebounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );

  // ── Extend State ──────────────────────────────
  const [extendingScheduleId, setExtendingScheduleId] = useState<string | null>(
    null,
  );

  // ── Mutations ─────────────────────────────────
  const createScheduleMutation = useMutation({
    ...trpc.schedules.create.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries(trpc.schedules.list.pathFilter());
    },
  });

  const deleteScheduleMutation = useMutation({
    ...trpc.schedules.delete.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries(trpc.schedules.list.pathFilter());
    },
  });

  const updateBasicMutation = useMutation({
    ...trpc.schedules.updateBasic.mutationOptions(),
  });

  const updateCalendarMutation = useMutation({
    ...trpc.schedules.updateCalendar.mutationOptions(),
  });

  const updateFareMutation = useMutation({
    ...trpc.schedules.updateFare.mutationOptions(),
  });

  const regenerateTripsMutation = useMutation({
    ...trpc.schedules.regenerateTrips.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries(trpc.schedules.list.pathFilter());
    },
  });

  const addExceptionMutation = useMutation({
    ...trpc.schedules.addException.mutationOptions(),
  });

  const removeExceptionMutation = useMutation({
    ...trpc.schedules.removeException.mutationOptions(),
  });

  // ── Edit & Extend Handlers ────────────────────
  const handleEditClick = async (schedule: Schedule) => {
    try {
      const detail = await queryClient.fetchQuery(
        trpc.schedules.get.queryOptions({ id: schedule.id }),
      );
      setEditingSchedule(detail as Schedule);
      setEditName(detail.name ?? "");
      setEditDepartureTime(detail.departureTime);
      setEditIsActive(detail.isActive);

      const cal = detail.calendar;
      setEditCalConfig({
        days: {
          monday: cal?.monday ?? false,
          tuesday: cal?.tuesday ?? false,
          wednesday: cal?.wednesday ?? false,
          thursday: cal?.thursday ?? false,
          friday: cal?.friday ?? false,
          saturday: cal?.saturday ?? false,
          sunday: cal?.sunday ?? false,
        },
        departureTime: detail.departureTime,
        validFrom: cal?.validFrom
          ? new Date(cal.validFrom).toISOString().slice(0, 10)
          : "",
        validUntil: cal?.validUntil
          ? new Date(cal.validUntil).toISOString().slice(0, 10)
          : "",
        defaultBusId: "",
      });
      setEditFares(detail.fares ?? []);
      setEditExceptions(detail.exceptions ?? []);
      setEditDrawerOpen(true);
    } catch {
      toast.error("Failed to load schedule details");
    }
  };

  const handleAddException = async () => {
    if (!editingSchedule || !exceptionDate) {
      toast.error("Select a date for the exception");
      return;
    }

    try {
      const created = await addExceptionMutation.mutateAsync({
        scheduleId: editingSchedule.id,
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
      });
      setEditExceptions((prev) => [...prev, created]);
      setExceptionDate("");
      setExceptionNotes("");
      toast.success("Service exception added");
      await queryClient.invalidateQueries(trpc.schedules.list.pathFilter());
    } catch (err: any) {
      toast.error(err.message || "Failed to add exception");
    }
  };

  const handleRemoveException = async (exceptionId: string) => {
    try {
      await removeExceptionMutation.mutateAsync({ exceptionId });
      setEditExceptions((prev) => prev.filter((e) => e.id !== exceptionId));
      toast.success("Service exception removed");
      await queryClient.invalidateQueries(trpc.schedules.list.pathFilter());
    } catch (err: any) {
      toast.error(err.message || "Failed to remove exception");
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchedule) return;
    setEditSaving(true);
    try {
      await updateBasicMutation.mutateAsync({
        id: editingSchedule.id,
        data: {
          name: editName.trim() || null,
          departureTime: editDepartureTime,
          isActive: editIsActive,
        },
      });

      if (editingSchedule.calendar) {
        await updateCalendarMutation.mutateAsync({
          id: editingSchedule.id,
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

      toast.success("Schedule updated successfully");
      await queryClient.invalidateQueries(trpc.schedules.list.pathFilter());
      setEditDrawerOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update schedule");
    } finally {
      setEditSaving(false);
    }
  };

  const handleFarePriceChange = (fareId: string, priceVal: string) => {
    if (!editingSchedule) return;
    const parsed = parseInt(priceVal, 10);
    const price = Number.isNaN(parsed) ? 0 : parsed;

    setEditFares((prev) =>
      prev.map((f) => (f.id === fareId ? { ...f, priceXOF: price } : f)),
    );

    const existingTimer = fareDebounceRef.current[fareId];
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    fareDebounceRef.current[fareId] = setTimeout(async () => {
      try {
        setSavingFareIds((prev) => new Set(prev).add(fareId));
        await updateFareMutation.mutateAsync({
          scheduleId: editingSchedule.id,
          fareId,
          data: { priceXOF: price },
        });
        queryClient.invalidateQueries(trpc.schedules.list.pathFilter());
      } catch (err: any) {
        toast.error(err.message || "Failed to update fare price");
      } finally {
        setSavingFareIds((prev) => {
          const next = new Set(prev);
          next.delete(fareId);
          return next;
        });
      }
    }, 500);
  };

  const handleExtendTrips = async (schedule: Schedule) => {
    setExtendingScheduleId(schedule.id);
    try {
      // Find an active bus for regeneration - use first active bus from fleet
      const activeBus = buses.find((b) => b.status === "ACTIVE");
      if (!activeBus) {
        toast.error("No active bus available to regenerate trips");
        return;
      }
      const res = await regenerateTripsMutation.mutateAsync({
        id: schedule.id,
        defaultBusId: activeBus.id,
      });
      toast.success(
        res?.message ||
          `Successfully generated ${res?.tripsCreated ?? 0} trips.`,
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to extend trips");
    } finally {
      setExtendingScheduleId(null);
    }
  };

  // When route is selected, fetch detail to get waypoints/stops
  useEffect(() => {
    if (!selectedRouteId) {
      setSelectedRoute(null);
      return;
    }
    setLoadingRouteDetail(true);
    queryClient
      .fetchQuery(trpc.routes.get.queryOptions({ id: selectedRouteId }))
      .then((data) => setSelectedRoute(data))
      .catch(() => toast.error("Failed to load route details"))
      .finally(() => setLoadingRouteDetail(false));
  }, [selectedRouteId]);

  // Build stop labels from selected route
  const stops: StopLabel[] = selectedRoute
      ? (() => {
        const origin: StopLabel = {
          order: 0,
          name: selectedRoute.originTerminal?.name ?? "Origin",
          city:
              selectedRoute.originTerminal?.cityRelation?.name ??
              selectedRoute.originTerminal?.city ??
              "",
        };

        const intermediate = (selectedRoute.waypoints ?? [])
            .slice()
            .sort((a, b) => a.stopOrder - b.stopOrder)
            .map((w, idx) => ({
              order: idx + 1,
              name: w.terminal?.name ?? "Stop",
              city: w.terminal?.cityRelation?.name ?? w.terminal?.city ?? "",
            }));

        const destination: StopLabel = {
          order: intermediate.length + 1,
          name: selectedRoute.destTerminal?.name ?? "Destination",
          city:
              selectedRoute.destTerminal?.cityRelation?.name ??
              selectedRoute.destTerminal?.city ??
              "",
        };

        return [origin, ...intermediate, destination];
      })()
      : [];

  function goToStep(s: WizardStep) {
    const idx = STEPS.indexOf(s);
    setMaxStep((prev) => Math.max(prev, idx));
    setStep(s);
  }

  function handleNext() {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) {
      goToStep(STEPS[idx + 1]!);
    }
  }

  function canProceed() {
    if (step === "Route") return !!selectedRouteId;
    if (step === "Calendar") {
      const hasDays = Object.values(calConfig.days).some(Boolean);
      return (
        hasDays &&
        !!calConfig.departureTime &&
        !!calConfig.validFrom &&
        !!calConfig.defaultBusId
      );
    }
    if (step === "Pricing") return true; // pricing is optional
    return true;
  }

  async function handlePublish() {
    if (!selectedRouteId || !calConfig.defaultBusId) return;
    setSaving(true);
    try {
      const result = await createScheduleMutation.mutateAsync({
        routeId: selectedRouteId,
        defaultBusId: calConfig.defaultBusId,
        departureTime: calConfig.departureTime,
        calendar: {
          monday: calConfig.days.monday,
          tuesday: calConfig.days.tuesday,
          wednesday: calConfig.days.wednesday,
          thursday: calConfig.days.thursday,
          friday: calConfig.days.friday,
          saturday: calConfig.days.saturday,
          sunday: calConfig.days.sunday,
          validFrom: calConfig.validFrom,
          ...(calConfig.validUntil ? { validUntil: calConfig.validUntil } : {}),
        },
        fares: fares
          .filter((f) => f.priceXOF > 0)
          .map((f) => ({
            type: "FIXED" as const,
            seatClass: "ECONOMY" as const,
            fromStopOrder: f.fromStopOrder,
            toStopOrder: f.toStopOrder,
            priceXOF: f.priceXOF,
          })),
      });
      setSuccessCount(result?._count?.trips ?? 0);
      resetWizard();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to publish schedule",
      );
    } finally {
      setSaving(false);
    }
  }

  function resetWizard() {
    setStep("Route");
    setMaxStep(0);
    setSelectedRouteId("");
    setSelectedRoute(null);
    setFares([]);
    setCalConfig({
      days: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false,
      },
      departureTime: "08:00",
      validFrom: new Date().toISOString().slice(0, 10),
      validUntil: "",
      defaultBusId: "",
    });
    setWizardOpen(false);
  }

  async function handleDeleteConfirm() {
    if (!deletingSchedule) return;
    try {
      await deleteScheduleMutation.mutateAsync({ id: deletingSchedule.id });
      toast.success("Schedule deleted");
      setDeletingSchedule(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete schedule",
      );
    }
  }

  // Wizard mode
  if (wizardOpen) {
    return (
      <div className="flex flex-col h-full">
        <WizardStepper
          current={step}
          onStepClick={goToStep}
          maxReached={maxStep}
        />

        <div className="flex-1 overflow-y-auto px-5 py-6">
          {step === "Route" && (
            <RoutePickerStep
              routes={routes}
              selectedId={selectedRouteId}
              onSelect={(id) => {
                setSelectedRouteId(id);
                setFares([]);
              }}
            />
          )}
          {step === "Calendar" && (
            <CalendarStep
              config={calConfig}
              buses={buses}
              onChange={setCalConfig}
            />
          )}
          {step === "Pricing" &&
            (loadingRouteDetail ? (
              <div className="flex items-center gap-2 py-10 justify-center">
                <Spinner className="size-4 text-primary" />
                <span className="text-sm text-muted-foreground">
                  Loading route stops…
                </span>
              </div>
            ) : (
              <PricingStep stops={stops} fares={fares} onChange={setFares} />
            ))}
          {step === "Preview" && (
            <PreviewStep
              days={calConfig.days}
              validFrom={calConfig.validFrom}
              departureTime={calConfig.departureTime}
              routeName={selectedRoute?.name ?? ""}
              fares={fares}
            />
          )}
        </div>

        <div className="border-t border-border px-5 py-4 flex items-center gap-3 shrink-0 bg-background">
          <Button variant="outline" onClick={resetWizard} disabled={saving}>
            Cancel
          </Button>
          <div className="flex-1" />
          {step !== "Route" && (
            <Button
              variant="ghost"
              onClick={() => {
                const idx = STEPS.indexOf(step);
                if (idx > 0) setStep(STEPS[idx - 1]!);
              }}
              disabled={saving}
            >
              Back
            </Button>
          )}
          {step !== "Preview" ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Continue →
            </Button>
          ) : (
            <Button onClick={handlePublish} disabled={saving}>
              {saving ? <Spinner className="size-4 mr-2" /> : null}
              {saving ? "Publishing…" : "Publish Schedule"}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // List mode
  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border shrink-0">
        <p className="text-sm font-semibold text-foreground">
          {schedules.length} schedule{schedules.length !== 1 ? "s" : ""}
        </p>
        <Button
          size="sm"
          className="h-8 text-xs"
          onClick={() => setWizardOpen(true)}
        >
          <Plus className="size-3.5 mr-1.5" />
          New Schedule
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {/* Success panel */}
        {successCount !== null && (
          <div className="border border-primary/20 bg-primary/5 rounded-md p-4 flex items-start gap-3">
            <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">
                Schedule published
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {successCount} trip{successCount !== 1 ? "s" : ""} generated for
                the next 14 days.
              </p>
              <div className="flex items-center gap-3 mt-3">
                <Link
                  href="/dashboard/operator/trips"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80"
                >
                  <Radio className="size-3.5" />
                  Open Dispatch Board →
                </Link>
                <button
                  onClick={() => setSuccessCount(null)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {schedules.length === 0 ? (
          <Empty className="py-16">
            <EmptyMedia>
              <CalendarClock className="size-10 text-muted-foreground/30" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No schedules yet</EmptyTitle>
              <EmptyDescription>
                A schedule turns a route into recurring trips. Create your first
                one to start accepting bookings.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button size="sm" onClick={() => setWizardOpen(true)}>
                <Plus className="size-3.5 mr-1.5" />
                Create Schedule
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {schedules.map((s) => (
              <ScheduleCard
                key={s.id}
                schedule={s}
                onEdit={handleEditClick}
                onDelete={setDeletingSchedule}
                onExtend={handleExtendTrips}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit schedule drawer */}
      <Drawer open={editDrawerOpen} onOpenChange={setEditDrawerOpen}>
        <DrawerContent className="max-h-[92vh] flex flex-col">
          <DrawerHeader className="border-b border-border py-4 shrink-0">
            <DrawerTitle className="text-base font-bold tracking-tight">
              Edit Operating Schedule:{" "}
              {editingSchedule?.name ??
                editingSchedule?.route?.name ??
                "Schedule"}
            </DrawerTitle>
            <DrawerDescription className="text-xs">
              Modify timing, recurrence calendar, and pricing tiers for this
              route.
            </DrawerDescription>
          </DrawerHeader>

          <form
            onSubmit={handleSaveEdit}
            className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0"
          >
            {/* Warning Banner */}
            <div className="border border-amber-200 bg-amber-50 rounded-md p-3.5 flex items-start gap-2.5 text-amber-800">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <p className="font-bold">Important Notice</p>
                <p className="mt-0.5">
                  Departure time and calendar updates will only apply to future
                  generated trips. Any trips already active on the Dispatch
                  Board will remain unmodified.
                </p>
              </div>
            </div>

            {/* Basic Info */}
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
                  <Input
                    id="edit-time"
                    value={editDepartureTime}
                    onChange={(e) => setEditDepartureTime(e.target.value)}
                    placeholder="e.g. 08:00"
                    className="h-9 text-xs shadow-none border-border font-mono"
                  />
                </div>
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
                    Allows automatic daily rolling trip extensions
                  </p>
                </div>
                <Switch
                  id="edit-active-toggle"
                  checked={editIsActive}
                  onCheckedChange={setEditIsActive}
                />
              </div>
            </div>

            {/* Calendar */}
            <div className="space-y-3.5">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border/60 pb-1">
                Recurrence Calendar
              </h3>
              <div className="space-y-3">
                <Label className="text-xs font-semibold">Runs on</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((d) => {
                    const active = editCalConfig.days[d.key];
                    return (
                      <button
                        key={d.key}
                        type="button"
                        onClick={() =>
                          setEditCalConfig({
                            ...editCalConfig,
                            days: { ...editCalConfig.days, [d.key]: !active },
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="edit-valid-from"
                    className="text-xs font-semibold"
                  >
                    Valid From *
                  </Label>
                  <Input
                    id="edit-valid-from"
                    type="date"
                    value={editCalConfig.validFrom}
                    onChange={(e) =>
                      setEditCalConfig({
                        ...editCalConfig,
                        validFrom: e.target.value,
                      })
                    }
                    className="h-9 text-xs shadow-none border-border"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="edit-valid-until"
                    className="text-xs font-semibold"
                  >
                    Valid Until (Optional)
                  </Label>
                  <Input
                    id="edit-valid-until"
                    type="date"
                    value={editCalConfig.validUntil ?? ""}
                    onChange={(e) =>
                      setEditCalConfig({
                        ...editCalConfig,
                        validUntil: e.target.value,
                      })
                    }
                    className="h-9 text-xs shadow-none border-border"
                  />
                </div>
              </div>
            </div>

            {/* Service Exceptions */}
            <div className="space-y-3.5">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border/60 pb-1">
                Service Exceptions
              </h3>
              {editExceptions.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No exceptions configured. Add a date to cancel or modify
                  service.
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
                          {exception.type}
                        </p>
                        <p className="text-muted-foreground">
                          {exception.reason.replaceAll("_", " ")}
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
                  <Input
                    type="date"
                    value={exceptionDate}
                    onChange={(e) => setExceptionDate(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Type</Label>
                  <select
                    value={exceptionType}
                    onChange={(e) =>
                      setExceptionType(
                        e.target.value as
                          | "CANCELLED"
                          | "EXTRA_SERVICE"
                          | "MODIFIED",
                      )
                    }
                    className="h-9 w-full rounded-md border border-border bg-background px-2 text-xs"
                  >
                    <option value="CANCELLED">Cancelled</option>
                    <option value="MODIFIED">Modified</option>
                    <option value="EXTRA_SERVICE">Extra service</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Reason</Label>
                  <select
                    value={exceptionReason}
                    onChange={(e) => setExceptionReason(e.target.value)}
                    className="h-9 w-full rounded-md border border-border bg-background px-2 text-xs"
                  >
                    <option value="OPERATIONAL">Operational</option>
                    <option value="HOLIDAY_NATIONAL">National holiday</option>
                    <option value="HOLIDAY_ISLAMIC">Islamic holiday</option>
                    <option value="HOLIDAY_CHRISTIAN">Christian holiday</option>
                    <option value="WEATHER">Weather</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="STRIKE">Strike</option>
                    <option value="OTHER">Other</option>
                  </select>
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

            {/* Fares Matrix */}
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
                      style={{ gridTemplateColumns: "1fr 1fr auto" }}
                    >
                      <span>From (Stop Order)</span>
                      <span>To (Stop Order)</span>
                      <span className="w-32 text-right">Price (FCFA)</span>
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
                          Stop {f.fromStopOrder}
                        </span>
                        <span className="text-xs font-semibold text-foreground">
                          Stop {f.toStopOrder}
                        </span>
                        <div className="w-32">
                          <Input
                            type="number"
                            min={0}
                            value={f.priceXOF}
                            onChange={(e) =>
                              handleFarePriceChange(f.id, e.target.value)
                            }
                            className="h-8 text-xs font-mono text-right"
                          />
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
              variant="outline"
              size="sm"
              className="h-8.5 text-xs font-semibold text-primary hover:bg-primary/5 hover:text-primary gap-1.5"
              onClick={() =>
                editingSchedule && handleExtendTrips(editingSchedule)
              }
              disabled={extendingScheduleId === editingSchedule?.id}
            >
              {extendingScheduleId === editingSchedule?.id ? (
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
                onClick={handleSaveEdit}
              >
                {editSaving && <Spinner className="size-3 mr-1.5" />}
                Save Changes
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Delete confirm */}
      <Dialog
        open={!!deletingSchedule}
        onOpenChange={(v) => !v && setDeletingSchedule(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="size-4" />
              Delete schedule
            </DialogTitle>
            <DialogDescription>
              This will remove the schedule and cancel all future trips that
              have no passenger bookings. Past and booked trips will be
              unaffected. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeletingSchedule(null)}
              disabled={deleteScheduleMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteScheduleMutation.isPending}
            >
              {deleteScheduleMutation.isPending ? (
                <Spinner className="size-4 mr-2" />
              ) : null}
              {deleteScheduleMutation.isPending
                ? "Deleting…"
                : "Delete Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
