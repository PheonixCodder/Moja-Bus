"use client";

import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, Ticket, Users } from "lucide-react";
import { useTRPC } from "@/trpc/client";

const STATS = [
  {
    key: "upcomingTripsCount" as const,
    label: "Upcoming",
    icon: Calendar,
    color: "text-primary",
  },
  {
    key: "pendingPaymentsCount" as const,
    label: "Pending",
    icon: Clock,
    color: "text-amber-500",
  },
  {
    key: "digitalTicketsCount" as const,
    label: "Total tickets",
    icon: Ticket,
    color: "text-foreground",
  },
  {
    key: "savedContactsCount" as const,
    label: "Contacts",
    icon: Users,
    color: "text-foreground",
  },
] as const;

export function BookingKpiStrip() {
  const trpc = useTRPC();
  const { data } = useQuery(trpc.passenger.getDashboardStats.queryOptions());

  return (
    <div className="border-b">
      <div className="grid grid-cols-2 divide-x divide-y md:grid-cols-4 md:divide-y-0">
        {STATS.map(({ key, label, icon: Icon, color }) => {
          const value = data?.[key] ?? 0;
          const isPending = key === "pendingPaymentsCount" && value > 0;

          return (
            <div key={key} className="flex flex-col gap-1 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">{label}</span>
                <Icon className={`size-3.5 ${color}`} />
              </div>
              <div className="flex items-end gap-1.5">
                <span className="text-2xl leading-none tabular-nums tracking-tight">
                  {value}
                </span>
                {isPending && (
                  <span className="mb-0.5 size-2 animate-pulse rounded-full bg-amber-500" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
