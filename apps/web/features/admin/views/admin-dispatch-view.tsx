"use client";

import { Button } from "@moja/ui/components/ui/button";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { cn } from "@moja/ui/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Suspense, useState } from "react";
import { useTRPC } from "@/trpc/client";
import { DispatchFilterBar } from "../components/dispatch-filter-bar";
import { DispatchTripDrawer } from "../components/dispatch-trip-drawer";
import { DispatchTripList } from "../components/dispatch-trip-list";

export function AdminDispatchView() {
  const t = useTranslations("adminDashboard.adminDispatchView");
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const handleRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries(
      trpc.admin.listDispatchTrips.pathFilter(),
    );
    setRefreshing(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="gap-2 h-9"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
          {t("refresh")}
        </Button>
      </div>

      <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
        <Suspense
          fallback={
            <div className="flex justify-center p-4">
              <Spinner className="size-6" />
            </div>
          }
        >
          <DispatchFilterBar />
        </Suspense>
      </div>

      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center p-20 border border-border rounded-xl bg-card border-dashed">
            <Spinner className="size-8" />
            <p className="text-sm text-muted-foreground mt-4 animate-pulse">
              {t("loadingDispatchBoard")}
            </p>
          </div>
        }
      >
        <DispatchTripList onOpenTrip={setSelectedTripId} />
      </Suspense>

      <DispatchTripDrawer
        tripId={selectedTripId}
        open={!!selectedTripId}
        onClose={() => setSelectedTripId(null)}
      />
    </div>
  );
}
