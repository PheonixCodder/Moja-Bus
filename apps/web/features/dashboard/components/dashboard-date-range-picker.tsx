"use client";

import { Button } from "@moja/ui/components/ui/button";
import { Calendar } from "@moja/ui/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@moja/ui/components/ui/popover";
import { cn } from "@moja/ui/lib/utils";
import {
  format,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
} from "date-fns";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useQueryStates } from "nuqs";
import { dashboardParsers } from "@/features/dashboard/lib/dashboard-search-params";

export function DashboardDateRangePicker() {
  const t = useTranslations("passengerDashboard.tickets");
  const [{ from, to }, setParams] = useQueryStates(dashboardParsers, {
    shallow: false,
  });

  const setPreset = (start: Date) => {
    setParams({ from: start, to: new Date() });
  };

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className={cn(
              "h-8 w-[240px] justify-start text-left text-xs font-normal text-foreground",
              !from && "text-muted-foreground",
            )}
          />
        }
      >
        <CalendarIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
        {from && to ? (
          <>
            {format(from, "dd MMM yyyy")} - {format(to, "dd MMM yyyy")}
          </>
        ) : (
          <span>{t("chartPickRange")}</span>
        )}
        <ChevronDown className="ml-auto h-3.5 w-3.5 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="flex flex-col sm:flex-row">
          <div className="flex flex-col gap-1 p-3 border-b sm:border-b-0 sm:border-r min-w-[150px]">
            <Button
              variant="ghost"
              className="justify-start text-sm font-normal"
              onClick={() => setPreset(startOfMonth(subMonths(new Date(), 5)))}
            >
              {t("chartPresets.last6Months")}
            </Button>
            <Button
              variant="ghost"
              className="justify-start text-sm font-normal"
              onClick={() => setPreset(subDays(new Date(), 29))}
            >
              {t("chartPresets.last30Days")}
            </Button>
            <Button
              variant="ghost"
              className="justify-start text-sm font-normal"
              onClick={() => setPreset(startOfMonth(new Date()))}
            >
              {t("chartPresets.thisMonth")}
            </Button>
            <Button
              variant="ghost"
              className="justify-start text-sm font-normal"
              onClick={() => setPreset(startOfYear(new Date()))}
            >
              {t("chartPresets.thisYear")}
            </Button>
          </div>
          <Calendar
            mode="range"
            defaultMonth={to}
            selected={{ from, to }}
            onSelect={(range) => {
              if (range?.from) {
                setParams({ from: range.from, to: range.to ?? range.from });
              }
            }}
            numberOfMonths={2}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
