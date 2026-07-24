"use client";

import { Search, X } from "lucide-react";
import { Button } from "@moja/ui/components/ui/button";
import { DatePicker } from "@moja/ui/components/ui/date-picker";
import { Input } from "@moja/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";
import type { TripStatus } from "@moja/schemas";

const STATUS_OPTIONS: { value: TripStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All statuses" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "BOARDING", label: "Boarding" },
  { value: "DEPARTED", label: "Departed" },
  { value: "ARRIVED", label: "Arrived" },
  { value: "DELAYED", label: "Delayed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function TripsToolbar({
  status,
  onStatusChange,
  query,
  onQueryChange,
  scheduleLabel,
  onClearSchedule,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: {
  status: TripStatus | "ALL";
  onStatusChange: (value: TripStatus | "ALL") => void;
  query: string;
  onQueryChange: (value: string) => void;
  scheduleLabel?: string | null;
  onClearSchedule?: () => void;
  startDate?: string;
  endDate?: string;
  onStartDateChange?: (value: string) => void;
  onEndDateChange?: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search route, plate, gate…"
            className="h-9 pl-8 text-sm"
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => onStatusChange(v as TripStatus | "ALL")}
        >
          <SelectTrigger className="h-9 w-full sm:w-[180px] text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {onStartDateChange ? (
          <DatePicker
            value={startDate ?? ""}
            onChange={(date) => {
              if (date) {
                const yyyy = date.getFullYear();
                const mm = String(date.getMonth() + 1).padStart(2, "0");
                const dd = String(date.getDate()).padStart(2, "0");
                onStartDateChange(`${yyyy}-${mm}-${dd}`);
              } else {
                onStartDateChange("");
              }
            }}
            placeholder="From date"
            className="h-9 w-full sm:w-[150px] text-sm"
          />
        ) : null}
        {onEndDateChange ? (
          <DatePicker
            value={endDate ?? ""}
            onChange={(date) => {
              if (date) {
                const yyyy = date.getFullYear();
                const mm = String(date.getMonth() + 1).padStart(2, "0");
                const dd = String(date.getDate()).padStart(2, "0");
                onEndDateChange(`${yyyy}-${mm}-${dd}`);
              } else {
                onEndDateChange("");
              }
            }}
            placeholder="To date"
            className="h-9 w-full sm:w-[150px] text-sm"
          />
        ) : null}
      </div>
      {scheduleLabel ? (
        <div className="flex items-center gap-2 rounded-md border border-border bg-slate-50 px-3 py-1.5 text-xs">
          <span className="text-muted-foreground">Schedule:</span>
          <span className="font-semibold truncate max-w-[200px]">
            {scheduleLabel}
          </span>
          {onClearSchedule ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-6 shrink-0"
              onClick={onClearSchedule}
              aria-label="Clear schedule filter"
            >
              <X className="size-3.5" />
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
