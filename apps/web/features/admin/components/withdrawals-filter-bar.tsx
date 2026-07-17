"use client";

import { useQueryStates } from "nuqs";
import { withdrawalsSearchParams } from "../lib/search-params";
import { format, subDays } from "date-fns";
import { fr } from "date-fns/locale";

import { Calendar } from "@moja/ui/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@moja/ui/components/ui/popover";
import { Button } from "@moja/ui/components/ui/button";
import { CalendarIcon, ChevronDown, ListFilter } from "lucide-react";
import { cn } from "@moja/ui/lib/utils";
import { Badge } from "@moja/ui/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";

export function WithdrawalsFilterBar({ total }: { total: number }) {
  const [{ status, from, to }, setParams] = useQueryStates(
    withdrawalsSearchParams,
    { shallow: false }
  );

  const setPreset = (days: number | null) => {
    setParams({
      page: 1,
      from: days ? subDays(new Date(), days).toISOString() : "",
      to: days ? new Date().toISOString() : "",
    });
  };

  const handleStatusChange = (value: string | null) => {
    if (value) {
      setParams({
        status: value,
        page: 1,
      });
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-border rounded-xl bg-bg-base shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 border border-border/60 rounded-md bg-bg-muted text-sm font-medium">
          <ListFilter className="size-4 text-text-muted" />
          <span>Filters</span>
        </div>

        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="POSTED">Pending (Posted)</SelectItem>
              <SelectItem value="CREATED">Created</SelectItem>
              <SelectItem value="SETTLED">Settled</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
              <SelectItem value="REVERSED">Reversed</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                className={cn(
                  "w-[280px] h-9 justify-start text-left font-normal",
                  !from && "text-muted-foreground"
                )}
              />
            }
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {from ? (
              to ? (
                <>
                  {format(new Date(from), "dd MMM, y", { locale: fr })} -{" "}
                  {format(new Date(to), "dd MMM, y", { locale: fr })}
                </>
              ) : (
                format(new Date(from), "dd MMM, y", { locale: fr })
              )
            ) : (
              <span>Pick a date range</span>
            )}
            <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="flex flex-col sm:flex-row">
              <div className="flex flex-col gap-2 p-3 border-b sm:border-b-0 sm:border-r">
                <Button
                  variant="ghost"
                  className="justify-start text-sm"
                  onClick={() => setPreset(6)}
                >
                  Last 7 days
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start text-sm"
                  onClick={() => setPreset(29)}
                >
                  Last 30 days
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start text-sm"
                  onClick={() => setPreset(89)}
                >
                  Last 90 days
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start text-sm"
                  onClick={() => setPreset(null)}
                >
                  All time
                </Button>
              </div>
              <Calendar
                mode="range"
                defaultMonth={to ? new Date(to) : new Date()}
                selected={{
                  from: from ? new Date(from) : undefined,
                  to: to ? new Date(to) : undefined,
                }}
                onSelect={(range) => {
                  setParams({
                    page: 1,
                    from: range?.from ? range.from.toISOString() : "",
                    to: range?.to
                      ? range.to.toISOString()
                      : range?.from
                        ? range.from.toISOString()
                        : "",
                  });
                }}
                numberOfMonths={2}
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-text-muted">Total matching</span>
        <Badge variant="secondary" className="px-2.5 py-0.5 rounded-full font-semibold">
          {total}
        </Badge>
      </div>
    </div>
  );
}
