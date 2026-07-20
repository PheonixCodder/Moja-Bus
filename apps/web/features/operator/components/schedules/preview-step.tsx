"use client";

import { cn } from "@moja/ui/lib/utils";
import { getCandidateDepartureDates } from "@/lib/schedule-trip-window";
import {
  formatTime,
  parseLocalDate,
  type DayKey,
} from "@/features/operator/lib/schedules/schedule-search-params";
import type { FareDraft } from "@/features/operator/lib/schedules/types";

export function PreviewStep({
  days,
  validFrom,
  validUntil,
  departureTime,
  routeName,
  fares,
}: {
  days: Record<DayKey, boolean>;
  validFrom: string;
  validUntil: string;
  departureTime: string;
  routeName: string;
  fares: FareDraft[];
}) {
  const validFromDate = parseLocalDate(validFrom) ?? new Date();
  const candidates = getCandidateDepartureDates({
    departureTime: departureTime || "08:00",
    calendar: {
      monday: days.monday,
      tuesday: days.tuesday,
      wednesday: days.wednesday,
      thursday: days.thursday,
      friday: days.friday,
      saturday: days.saturday,
      sunday: days.sunday,
      validFrom: validFromDate,
      validUntil: validUntil ? parseLocalDate(validUntil) ?? null : null,
    },
    daysCount: 14,
  });

  const previewSet = new Set(
    candidates.map((c) => c.calendarDay.toDateString()),
  );

  const start = new Date();
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

  const totalFares = fares.filter((f) => f.priceXOF > 0).length;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-bold text-foreground">Review & preview</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Confirm everything looks right before publishing. Preview matches the
          next 14 calendar days from today.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-md border border-border bg-slate-50/50 p-3 text-center">
          <p className="text-2xl font-bold text-primary">{candidates.length}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            trips in next 14 days
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

      <div
        className="border border-border rounded-md overflow-hidden"
        role="grid"
        aria-label="Schedule preview calendar"
        aria-readonly="true"
      >
        <div
          className="grid grid-cols-7 bg-slate-50 border-b border-border"
          role="row"
        >
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div
              key={d}
              role="columnheader"
              aria-label={d}
              className="py-2 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              {d}
            </div>
          ))}
        </div>

        {weeks.map((week, wi) => (
          <div
            key={wi}
            role="row"
            className="grid grid-cols-7 divide-x divide-border border-b border-border last:border-b-0"
          >
            {week.map((day, di) => {
              const isTrip = previewSet.has(day.toDateString());
              const dateLabel = day.toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
              });
              return (
                <div
                  key={di}
                  role="gridcell"
                  aria-label={
                    isTrip
                      ? `${dateLabel}: trip at ${formatTime(departureTime)}`
                      : dateLabel
                  }
                  className={cn(
                    "py-3 flex flex-col items-center gap-1 min-h-[52px]",
                  )}
                >
                  <span className="text-xs text-muted-foreground">
                    {day.getDate()}
                  </span>
                  {isTrip && (
                    <div
                      className="size-2 rounded-full bg-primary"
                      role="presentation"
                      aria-hidden="true"
                    />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground">
        Each marker represents one auto-generated trip departing at{" "}
        <span className="font-semibold text-foreground">
          {formatTime(departureTime)}
        </span>
        . Trips are generated on publish and extended daily by the rolling
        generate-trips job while the schedule is active.
      </p>
    </div>
  );
}
