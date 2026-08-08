"use client";

import * as React from "react";
import { Clock } from "lucide-react";

import { cn } from "#lib/utils";
import { Button } from "#components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "#components/ui/popover";

export interface TimePickerProps {
  value?: string; // Expects "HH:mm" e.g. "08:30" or "14:15"
  onChange?: (time: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  stepMinutes?: number; // e.g. 5, 15, 30
}

export function TimePicker({
  value = "08:00",
  onChange,
  placeholder = "Select time",
  className,
  disabled = false,
  stepMinutes = 5,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Parse HH and mm
  const { hour, minute } = React.useMemo(() => {
    if (!value || !value.includes(":")) {
      return { hour: "08", minute: "00" };
    }
    const [h, m] = value.split(":");
    return {
      hour: (h ?? "08").padStart(2, "0"),
      minute: (m ?? "00").padStart(2, "0"),
    };
  }, [value]);

  const hoursList = React.useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  }, []);

  const minutesList = React.useMemo(() => {
    const list: string[] = [];
    for (let i = 0; i < 60; i += stepMinutes) {
      list.push(String(i).padStart(2, "0"));
    }
    return list;
  }, [stepMinutes]);

  const handleHourChange = (newHour: string) => {
    const updated = `${newHour}:${minute}`;
    onChange?.(updated);
  };

  const handleMinuteChange = (newMinute: string) => {
    const updated = `${hour}:${newMinute}`;
    onChange?.(updated);
  };

  // Quick preset times for common schedules
  const presets = ["06:00", "07:30", "08:00", "09:00", "12:00", "14:00", "16:30", "18:00", "20:00"];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal bg-background h-10 px-3",
              !value && "text-muted-foreground",
              className
            )}
          />
        }
      >
        <Clock className="mr-2 h-4 w-4 shrink-0 opacity-60" />
        <span className="truncate tabular-nums font-mono text-sm">
          {value || placeholder}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-3">
          <div className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
            Select Time
          </div>
          <div className="grid grid-cols-2 gap-2">
             <div className="space-y-1">
               <span className="text-[11px] text-muted-foreground">Hours</span>
               <div className="max-h-48 overflow-y-auto">
                 {hoursList.map((h) => {
                   const selected = h === hour;
                   return (
                     <button
                       key={h}
                       type="button"
                       role="option"
                       aria-selected={selected}
                       onClick={() => handleHourChange(h)}
                       className={cn(
                         "w-full h-9 px-2 text-left text-sm font-mono rounded-md border transition-colors",
                         selected
                           ? "bg-primary text-primary-foreground border-primary"
                           : "bg-background hover:bg-muted border-input",
                       )}
                     >
                       {h}
                     </button>
                   );
                 })}
               </div>
             </div>
             <div className="space-y-1">
               <span className="text-[11px] text-muted-foreground">Minutes</span>
               <div className="max-h-48 overflow-y-auto">
                 {minutesList.map((m) => {
                   const selected = m === minute;
                   return (
                     <button
                       key={m}
                       type="button"
                       role="option"
                       aria-selected={selected}
                       onClick={() => handleMinuteChange(m)}
                       className={cn(
                         "w-full h-9 px-2 text-left text-sm font-mono rounded-md border transition-colors",
                         selected
                           ? "bg-primary text-primary-foreground border-primary"
                           : "bg-background hover:bg-muted border-input",
                       )}
                     >
                       {m}
                     </button>
                   );
                 })}
               </div>
             </div>
           </div>

          <div className="pt-2 border-t">
            <span className="text-[11px] font-medium text-muted-foreground block mb-1.5">
              Popular Departure Times
            </span>
            <div className="flex flex-wrap gap-1">
              {presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    onChange?.(p);
                    setOpen(false);
                  }}
                  className={cn(
                    "text-xs px-2 py-1 rounded-md border font-mono transition-colors",
                    value === p
                      ? "bg-primary text-primary-foreground border-primary font-bold"
                      : "bg-muted/50 hover:bg-muted text-muted-foreground"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
