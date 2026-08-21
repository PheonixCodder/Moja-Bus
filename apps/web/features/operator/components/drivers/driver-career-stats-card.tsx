"use client";

import { Star, ShieldCheck, Route, Award } from "lucide-react";
import { cn } from "@moja/ui/lib/utils";

interface DriverCareerStatsProps {
  averageRating: number;
  totalReviews: number;
  totalTripsCompleted: number;
  totalDistanceKm: number;
  safetyScore: number;
  className?: string;
}

export function DriverCareerStatsCard({
  averageRating,
  totalReviews,
  totalTripsCompleted,
  totalDistanceKm,
  safetyScore,
  className,
}: DriverCareerStatsProps) {
  const stats = [
    {
      label: "Rating",
      value: averageRating.toFixed(1),
      subtext: `${totalReviews} reviews`,
      icon: Star,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "Completed Trips",
      value: totalTripsCompleted.toLocaleString(),
      subtext: "Lifetime journeys",
      icon: Route,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Distance Driven",
      value: `${Math.round(totalDistanceKm).toLocaleString()} km`,
      subtext: "Total logged",
      icon: Award,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "Safety Score",
      value: `${safetyScore}/100`,
      subtext: "Compliance index",
      icon: ShieldCheck,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
    },
  ];

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card text-card-foreground shadow-sm"
          >
            <div className={cn("p-2.5 rounded-lg shrink-0", stat.bgColor)}>
              <Icon className={cn("size-5", stat.color)} />
            </div>
            <div className="min-w-0">
              <div className="text-xl font-bold tracking-tight">{stat.value}</div>
              <div className="text-xs text-muted-foreground truncate">{stat.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
