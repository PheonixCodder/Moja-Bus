"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { useQueryState } from "nuqs";
import { tripAuditSearchParams } from "@/features/admin/lib/search-params";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@moja/ui/components/ui/tabs";
import { Suspense } from "react";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { TripAuditHeader } from "@/features/admin/components/trip-audit-header";
import { TripAuditKpiCards } from "@/features/admin/components/trip-audit-kpi-cards";
import { TripAuditTimeline } from "@/features/admin/components/trip-audit-timeline";
import { TripAuditManifest } from "@/features/admin/components/trip-audit-manifest";
import { TripAuditOccupancy } from "@/features/admin/components/trip-audit-occupancy";
import { TripAuditReviews } from "@/features/admin/components/trip-audit-reviews";
import { Map, Users, Bus, Star } from "lucide-react";

function TabFallback() {
  return (
    <div className="flex items-center justify-center py-24">
      <Spinner className="size-8" />
    </div>
  );
}

export function AdminTripAuditView({ tripId }: { tripId: string }) {
  const [tab, setTab] = useQueryState("tab", tripAuditSearchParams.tab);

  return (
    <div className="flex flex-col gap-6">
      {/* Header card */}
      <TripAuditHeader tripId={tripId} />

      {/* KPI cards */}
      <TripAuditKpiCards tripId={tripId} />

      {/* Tabs */}
      <Tabs value={tab} className={"flex flex-col"} onValueChange={(v) => setTab(v)}>
        <TabsList className="w-full sm:w-max p-1 h-auto bg-muted/60 backdrop-blur-md border border-border/50 rounded-full shadow-sm flex items-center overflow-x-auto no-scrollbar">
          <TabsTrigger 
            value="overview" 
            id="trip-audit-tab-overview"
            className="rounded-full px-5 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=inactive]:hover:bg-muted/80 flex items-center gap-2"
          >
            <Map className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="manifest" 
            id="trip-audit-tab-manifest"
            className="rounded-full px-5 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=inactive]:hover:bg-muted/80 flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Manifest
          </TabsTrigger>
          <TabsTrigger 
            value="occupancy" 
            id="trip-audit-tab-occupancy"
            className="rounded-full px-5 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=inactive]:hover:bg-muted/80 flex items-center gap-2"
          >
            <Bus className="h-4 w-4" />
            Occupancy
          </TabsTrigger>
          <TabsTrigger 
            value="reviews" 
            id="trip-audit-tab-reviews"
            className="rounded-full px-5 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=inactive]:hover:bg-muted/80 flex items-center gap-2"
          >
            <Star className="h-4 w-4" />
            Reviews
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Suspense fallback={<TabFallback />}>
            <TripAuditTimeline tripId={tripId} />
          </Suspense>
        </TabsContent>

        <TabsContent value="manifest" className="mt-4">
          <Suspense fallback={<TabFallback />}>
            <TripAuditManifest tripId={tripId} />
          </Suspense>
        </TabsContent>

        <TabsContent value="occupancy" className="mt-4">
          <Suspense fallback={<TabFallback />}>
            <TripAuditOccupancy tripId={tripId} />
          </Suspense>
        </TabsContent>

        <TabsContent value="reviews" className="mt-4">
          <Suspense fallback={<TabFallback />}>
            <TripAuditReviews tripId={tripId} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
