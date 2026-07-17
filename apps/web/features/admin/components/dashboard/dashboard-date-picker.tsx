"use client";

import { useQueryStates } from "nuqs";
import { dashboardSearchParams } from "../../lib/search-params";
import { Calendar } from "@moja/ui/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@moja/ui/components/ui/popover";
import { Button } from "@moja/ui/components/ui/button";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { cn } from "@moja/ui/lib/utils";
import { format, subDays } from "date-fns";

export function DashboardDatePicker() {
  const [{ from, to }, setParams] = useQueryStates(dashboardSearchParams, {
    shallow: false,
  });

  const setPreset = (days: number) => {
    setParams({
      from: subDays(new Date(), days).toISOString(),
      to: new Date().toISOString(),
    });
  };

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className={cn(
              "w-[260px] justify-start text-left font-normal",
              !from && "text-muted-foreground"
            )}
          />
        }
      >
        <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
        {from ? (
          to ? (
            <>
              {format(new Date(from), "dd MMM, y")} —{" "}
              {format(new Date(to), "dd MMM, y")}
            </>
          ) : (
            format(new Date(from), "dd MMM, y")
          )
        ) : (
          <span>Pick a date range</span>
        )}
        <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="flex flex-col sm:flex-row">
          <div className="flex flex-col gap-1 p-3 border-b sm:border-b-0 sm:border-r">
            <Button
              variant="ghost"
              size="sm"
              className="justify-start text-sm"
              onClick={() => setPreset(6)}
            >
              Last 7 days
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="justify-start text-sm"
              onClick={() => setPreset(29)}
            >
              Last 30 days
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="justify-start text-sm"
              onClick={() => setPreset(89)}
            >
              Last 90 days
            </Button>
          </div>
          <Calendar
            mode="range"
            defaultMonth={new Date(to)}
            selected={{
              from: new Date(from),
              to: new Date(to),
            }}
            onSelect={(range) => {
              if (range?.from) {
                setParams({
                  from: range.from.toISOString(),
                  to: range.to ? range.to.toISOString() : range.from.toISOString(),
                });
              }
            }}
            numberOfMonths={2}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
