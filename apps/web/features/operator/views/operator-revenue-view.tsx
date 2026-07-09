"use client";

import { useQueryStates } from "nuqs";
import { revenueParamsSchema } from "../lib/revenue-params";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { format, subDays } from "date-fns";
import { fr } from "date-fns/locale";

import { Calendar } from "@moja/ui/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@moja/ui/components/ui/popover";
import { Button } from "@moja/ui/components/ui/button";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { cn } from "@moja/ui/lib/utils";

import { RevenueKpiCards } from "../components/revenue/revenue-kpi-cards";
import { RevenueChart } from "../components/revenue/revenue-chart";
import { TopRoutesTable } from "../components/revenue/top-routes-table";
import { RevenueLedgerTable } from "../components/revenue/revenue-ledger-table";

export function OperatorRevenueView() {
  const trpc = useTRPC();
  const [{ from, to }, setParams] = useQueryStates(revenueParamsSchema, {
    shallow: false,
  });

  const { data } = useSuspenseQuery(
    trpc.operator.getRevenueAnalytics.queryOptions({ from, to })
  );

  const setPreset = (days: number) => {
    setParams({
      from: subDays(new Date(), days).toISOString(),
      to: new Date().toISOString(),
    });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold font-display tracking-tight text-slate-900">
            Revenue & Earnings
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
            Track your earnings and transactions over time.
          </p>
        </div>

        <Popover>
          <PopoverTrigger 
            render={
              <Button
                variant="outline"
                className={cn(
                  "w-[280px] justify-start text-left font-normal",
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
          <PopoverContent className="w-auto p-0" align="end">
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
      </div>

      <RevenueKpiCards kpis={data.kpis} />
      <RevenueChart timeSeries={data.timeSeries} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TopRoutesTable topRoutes={data.topRoutes} />
        <RevenueLedgerTable recentLedger={data.recentLedger} />
      </div>
    </div>
  );
}
