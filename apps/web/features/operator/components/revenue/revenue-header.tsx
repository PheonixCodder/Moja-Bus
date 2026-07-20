"use client";

import { useQueryStates } from "nuqs";
import { revenueParsers } from "../../lib/revenue-search-params";
import { format, subDays, startOfMonth, startOfYear } from "date-fns";

import { Calendar } from "@moja/ui/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@moja/ui/components/ui/popover";
import { Button } from "@moja/ui/components/ui/button";
import { CalendarIcon, ChevronDown, Download } from "lucide-react";
import { cn } from "@moja/ui/lib/utils";

export function RevenueHeader() {
  const [{ from, to }, setParams] = useQueryStates(revenueParsers, {
    shallow: false,
  });

  const setPreset = (start: Date) => {
    setParams({
      from: start,
      to: new Date(),
    });
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold font-display tracking-tight text-slate-900">
          Financial Workspace
        </h1>
        <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
          Manage your earnings, pending escrow, and transactions.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Popover>
          <PopoverTrigger 
            render={
              <Button
                variant="outline"
                className={cn(
                  "w-[260px] justify-start text-left font-normal bg-white",
                  !from && "text-muted-foreground"
                )}
              />
            }
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {from ? (
              to ? (
                <>
                  {format(from, "dd MMM yyyy")} - {format(to, "dd MMM yyyy")}
                </>
              ) : (
                format(from, "dd MMM yyyy")
              )
            ) : (
              <span>Pick a date range</span>
            )}
            <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <div className="flex flex-col sm:flex-row">
              <div className="flex flex-col gap-1 p-3 border-b sm:border-b-0 sm:border-r min-w-[140px]">
                <Button
                  variant="ghost"
                  className="justify-start text-sm font-normal"
                  onClick={() => setPreset(new Date())}
                >
                  Today
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start text-sm font-normal"
                  onClick={() => setPreset(subDays(new Date(), 6))}
                >
                  Last 7 days
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start text-sm font-normal"
                  onClick={() => setPreset(startOfMonth(new Date()))}
                >
                  This Month
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start text-sm font-normal"
                  onClick={() => setPreset(startOfYear(new Date()))}
                >
                  Year to Date
                </Button>
              </div>
              <Calendar
                mode="range"
                defaultMonth={to}
                selected={{
                  from,
                  to,
                }}
                onSelect={(range) => {
                  if (range?.from) {
                    setParams({
                      from: range.from,
                      to: range.to ?? range.from,
                    });
                  }
                }}
                numberOfMonths={2}
              />
            </div>
          </PopoverContent>
        </Popover>

        <Button variant="outline" className="bg-white">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>
    </div>
  );
}
