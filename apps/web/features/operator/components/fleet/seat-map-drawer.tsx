"use client";

import { Suspense } from "react";
import { LayoutGrid } from "lucide-react";
import { Button } from "@moja/ui/components/ui/button";
import { Spinner } from "@moja/ui/components/ui/spinner";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@moja/ui/components/ui/drawer";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SeatMapPreview } from "@/features/operator/components/seat-map-preview";

interface SeatMapDrawerProps {
  busId: string | null;
  busTitle?: { plate: string; layout: string } | null;
  onClose: () => void;
}

export function SeatMapDrawer({
  busId,
  busTitle,
  onClose,
}: SeatMapDrawerProps) {
  return (
    <Drawer
      open={!!busId}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      direction="right"
    >
      <DrawerContent className="bg-background border-l border-border sm:max-w-xl w-full">
        <DrawerHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
              <LayoutGrid className="size-4 text-primary" />
            </div>
            <div>
              <DrawerTitle className="text-base font-semibold text-foreground">
                Seat map
              </DrawerTitle>
              <DrawerDescription className="text-xs text-muted-foreground">
                {busTitle
                  ? `${busTitle.plate} — ${busTitle.layout}`
                  : "Loading..."}
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {busId ? (
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-12">
                  <Spinner className="size-6 text-primary" />
                </div>
              }
            >
              <SeatMapFetcher key={busId} busId={busId} />
            </Suspense>
          ) : null}
        </div>

        <DrawerFooter className="border-t border-border pt-4">
          <DrawerClose asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-muted-foreground hover:text-foreground"
              onClick={onClose}
            >
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function SeatMapFetcher({ busId }: { busId: string }) {
  const trpc = useTRPC();
  const { data: seatMapBus } = useSuspenseQuery(
    trpc.fleet.getBusDetails.queryOptions({ id: busId }),
  );

  if (!seatMapBus || !seatMapBus.seats) return null;

  return (
    <>
      <div className="mb-4 rounded-lg border border-primary/15 bg-primary/5 px-4 py-3">
        <p className="text-xs text-primary font-semibold">
          Interactive mode active
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Click on a passenger seat to mark it out of service or reactivate it.
        </p>
      </div>
      <SeatMapPreview
        busId={seatMapBus.id}
        seats={seatMapBus.seats}
        rows={seatMapBus.layoutTemplate.rows}
        columns={seatMapBus.layoutTemplate.columns}
        interactive
      />
    </>
  );
}
