"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";

import { cn } from "#lib/utils";
import { Button } from "#components/ui/button";
import { Calendar } from "#components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "#components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#components/ui/select";

export interface DateTimePickerProps {
  value?: Date | string | null | undefined;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick date & time",
  className,
  disabled = false,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);

  const dateValue = React.useMemo(() => {
    if (!value) return undefined;
    if (value instanceof Date) return value;
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  }, [value]);

  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(dateValue);

  React.useEffect(() => {
    setSelectedDate(dateValue);
  }, [dateValue]);

  const hourStr = selectedDate ? String(selectedDate.getHours()).padStart(2, "0") : "09";
  const minuteStr = selectedDate ? String(selectedDate.getMinutes()).padStart(2, "0") : "00";

  const handleDateSelect = (newDate: Date | undefined) => {
    if (!newDate) {
      setSelectedDate(undefined);
      onChange?.(undefined);
      return;
    }

    const updated = new Date(newDate);
    if (selectedDate) {
      updated.setHours(selectedDate.getHours(), selectedDate.getMinutes());
    } else {
      updated.setHours(9, 0);
    }
    setSelectedDate(updated);
    onChange?.(updated);
  };

  const handleTimeChange = (type: "hour" | "minute", val: string) => {
    const base = selectedDate ? new Date(selectedDate) : new Date();
    if (type === "hour") {
      base.setHours(Number(val));
    } else {
      base.setMinutes(Number(val));
    }
    setSelectedDate(base);
    onChange?.(base);
  };

  const hoursList = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const minutesList = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal bg-background h-10 px-3",
              !selectedDate && "text-muted-foreground",
              className
            )}
          />
        }
      >
        <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-60" />
        <span className="truncate">
          {selectedDate ? format(selectedDate, "PPP 'at' p") : placeholder}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-2 border-b">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
          />
        </div>
        <div className="p-3 bg-muted/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <Clock className="size-3.5" /> Time:
          </div>
          <div className="flex items-center gap-2">
            <Select value={hourStr} onValueChange={(val) => handleTimeChange("hour", val ?? "09")}>
              <SelectTrigger className="h-8 w-20 text-xs">
                <SelectValue placeholder="HH" />
              </SelectTrigger>
              <SelectContent className="max-h-48">
                {hoursList.map((h) => (
                  <SelectItem key={h} value={h} className="text-xs">
                    {h}:00
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={minuteStr} onValueChange={(val) => handleTimeChange("minute", val ?? "00")}>
              <SelectTrigger className="h-8 w-20 text-xs">
                <SelectValue placeholder="MM" />
              </SelectTrigger>
              <SelectContent className="max-h-48">
                {minutesList.map((m) => (
                  <SelectItem key={m} value={m} className="text-xs">
                    :{m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
