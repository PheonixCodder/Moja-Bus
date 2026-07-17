"use client";

import { useQueryStates } from "nuqs";
import { dispatchSearchParams } from "../lib/search-params";
import { format, subDays, addDays } from "date-fns";
import { CalendarIcon, Filter, X } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { cn } from "@moja/ui/lib/utils";

import { Button } from "@moja/ui/components/ui/button";
import { Calendar } from "@moja/ui/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@moja/ui/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@moja/ui/components/ui/combobox";
import { Badge } from "@moja/ui/components/ui/badge";
import { useState } from "react";
type DateRange = { from?: Date | undefined; to?: Date | undefined };

export function DispatchFilterBar() {
  const trpc = useTRPC();
  const [{ status, companyId, from, to }, setParams] = useQueryStates(
    dispatchSearchParams,
    { shallow: false }
  );
  
  const { data: companies } = useSuspenseQuery(
    trpc.public.listOperators.queryOptions()
  );

  const [date, setDate] = useState<DateRange | undefined>({
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
  });

  const [popoverOpen, setPopoverOpen] = useState(false);

  const handleApplyDate = (range: DateRange | undefined) => {
    setParams({
      from: range?.from ? format(range.from, "yyyy-MM-dd") : null,
      to: range?.to ? format(range.to, "yyyy-MM-dd") : null,
    });
    setPopoverOpen(false);
  };

  const handlePreset = (preset: "today" | "yesterday" | "last7" | "all") => {
    const today = new Date();
    if (preset === "today") {
      setDate({ from: today, to: today });
      handleApplyDate({ from: today, to: today });
    } else if (preset === "yesterday") {
      const yesterday = subDays(today, 1);
      setDate({ from: yesterday, to: yesterday });
      handleApplyDate({ from: yesterday, to: yesterday });
    } else if (preset === "last7") {
      const last7 = subDays(today, 7);
      setDate({ from: last7, to: today });
      handleApplyDate({ from: last7, to: today });
    } else if (preset === "all") {
      setDate(undefined);
      handleApplyDate(undefined);
    }
  };

  const selectedCompany = companies.find((c) => c.id === companyId);

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="w-full sm:w-64">
        <Combobox
          items={[
            { label: "All Operators", value: "ALL" },
            ...companies.map((c) => ({ label: c.name, value: c.id })),
          ]}
          value={companyId || "ALL"}
          onValueChange={(val) => {
            if (val) setParams({ companyId: val === "ALL" ? null : val });
          }}
        >
          <ComboboxInput
            placeholder="Filter by operator..."
            className="w-full h-9 bg-bg-base"
            value={selectedCompany?.name ?? "All Operators"}
          />
          <ComboboxContent>
            <ComboboxEmpty>No operator found.</ComboboxEmpty>
            <ComboboxList>
              <ComboboxItem value="ALL">All Operators</ComboboxItem>
              {companies.map((c) => (
                <ComboboxItem key={c.id} value={c.id}>
                  {c.name}
                </ComboboxItem>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>

      <Select
        value={status || "ACTIVE"}
        onValueChange={(val) => {
          if (val) setParams({ status: val });
        }}
      >
        <SelectTrigger className="w-full sm:w-44 bg-bg-base h-9">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ACTIVE">Active (Default)</SelectItem>
          <SelectItem value="ALL">All Statuses</SelectItem>
          <SelectItem value="SCHEDULED">Scheduled Only</SelectItem>
          <SelectItem value="BOARDING">Boarding Only</SelectItem>
          <SelectItem value="DEPARTED">Departed Only</SelectItem>
          <SelectItem value="DELAYED">Delayed Only</SelectItem>
          <SelectItem value="ARRIVED">Arrived Only</SelectItem>
          <SelectItem value="CANCELLED">Cancelled Only</SelectItem>
        </SelectContent>
      </Select>

      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger
          className={cn(
            "inline-flex items-center justify-start text-left font-normal bg-bg-base h-9 border border-input rounded-md px-3 text-sm shadow-sm hover:bg-accent hover:text-accent-foreground cursor-pointer w-full sm:w-[280px]",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to && date.from.getTime() !== date.to.getTime() ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>All time</span>
            )}
            {(from || to) && (
              <Badge
                variant="secondary"
                className="ml-auto rounded-sm px-1 font-normal lg:hidden"
              >
                Filtered
              </Badge>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex p-3 border-b border-border gap-2 overflow-x-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePreset("today")}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePreset("yesterday")}
            >
              Yesterday
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePreset("last7")}
            >
              Last 7 Days
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePreset("all")}
            >
              All Time
            </Button>
          </div>
          <Calendar
            {...({
              initialFocus: true,
              mode: "range",
              defaultMonth: date?.from,
              selected: date,
              onSelect: (range: any) => setDate(range),
              numberOfMonths: 2,
            } as any)}
          />
          <div className="flex justify-end p-3 border-t border-border">
            <Button size="sm" onClick={() => handleApplyDate(date)}>
              Apply Range
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {(from || to || (status !== "ACTIVE" && status !== "ALL") || (companyId && companyId !== "ALL")) && (
        <Button
          variant="ghost"
          className="h-9 px-2 text-text-muted hover:text-text-primary"
          onClick={() => {
            setParams({
              from: null,
              to: null,
              companyId: null,
              status: "ACTIVE",
            });
            setDate(undefined);
          }}
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
