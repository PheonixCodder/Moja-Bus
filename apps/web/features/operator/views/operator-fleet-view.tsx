"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  BusFront,
  Plus,
  Search,
  Pencil,
  Trash2,
  LayoutGrid,
  RefreshCw,
  Activity,
  Wrench,
  Armchair,
  Archive,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@moja/ui/lib/utils";

import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Card, CardContent } from "@moja/ui/components/ui/card";
import { Spinner } from "@moja/ui/components/ui/spinner";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from "@moja/ui/components/ui/empty";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@moja/ui/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@moja/ui/components/ui/drawer";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@moja/ui/components/ui/combobox";

import type { RouterOutputs } from "@/trpc/client";
import { useTRPC } from "@/trpc/client";
import {
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { AddBusModal } from "@/features/operator/components/add-bus-modal";
import { SeatMapPreview } from "@/features/operator/components/seat-map-preview";

type Bus = RouterOutputs["fleet"]["getBuses"]["buses"][number];
type FleetStats = RouterOutputs["fleet"]["getBuses"]["stats"];

// ──────────────────────────────────────────────
// Status config — colors pulled only from chart tokens / muted
// ──────────────────────────────────────────────

const STATUS_CONFIG = {
  ACTIVE: {
    label: "Active",
    className: "bg-chart-2/10 text-chart-2 border-chart-2/20",
    dot: "bg-chart-2",
  },
  MAINTENANCE: {
    label: "Maintenance",
    className: "bg-chart-4/10 text-chart-4 border-chart-4/20",
    dot: "bg-chart-4",
  },
  INACTIVE: {
    label: "Inactive",
    className: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground",
  },
  RETIRED: {
    label: "Retired",
    className: "bg-muted/50 text-muted-foreground/70 border-border/50",
    dot: "bg-muted-foreground/50",
  },
} as const;

// ──────────────────────────────────────────────
// KPI Card
// ──────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  iconClassName?: string;
  sub?: string;
}

function StatCard({
  label,
  value,
  icon: Icon,
  iconClassName,
  sub,
}: StatCardProps) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardContent className="p-4 flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10",
            iconClassName,
          )}
        >
          <Icon className="size-4 text-primary" />
        </div>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────────────────────────
// Bus Card
// ──────────────────────────────────────────────

interface BusCardProps {
  bus: Bus;
  onEdit: (bus: Bus) => void;
  onDelete: (bus: Bus) => void;
  onViewMap: (bus: Bus) => void;
}

function BusCard({ bus, onEdit, onDelete, onViewMap }: BusCardProps) {
  const status = STATUS_CONFIG[bus.status];

  return (
    <Card className="group/bus-card border-border bg-card shadow-none hover:border-primary/30 hover:shadow-sm transition-all duration-200">
      <CardContent className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/15">
              <BusFront className="size-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-mono text-sm font-bold text-foreground tracking-wider truncate">
                {bus.registrationPlate}
              </p>
              {bus.internalName && (
                <p className="text-[11px] text-muted-foreground truncate">
                  {bus.internalName}
                </p>
              )}
            </div>
          </div>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
              status.className,
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
            {status.label}
          </span>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md bg-muted/50 px-2.5 py-1.5">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
              Type
            </p>
            <p className="text-xs font-medium text-foreground/90 truncate mt-0.5">
              {bus.busType.name}
            </p>
          </div>
          <div className="rounded-md bg-muted/50 px-2.5 py-1.5">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
              Configuration
            </p>
            <p className="text-xs font-medium text-foreground/90 truncate mt-0.5">
              {bus.layoutTemplate.name}
            </p>
          </div>
        </div>

        {bus.notes && (
          <div className="rounded-md bg-amber-50/60 border border-amber-200/60 px-2.5 py-1.5">
            <p className="text-[10px] text-amber-700 font-semibold uppercase tracking-wider">Notes</p>
            <p className="text-xs text-amber-800/90 mt-0.5 line-clamp-2">{bus.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-border/60 -mx-4 px-4 pt-3">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Armchair className="size-3.5" />
            <span>
              <strong className="text-foreground/80 font-semibold">
                {bus.layoutTemplate.totalSeats}
              </strong>{" "}
              seats
            </span>
            {bus.manufactureYear && (
              <span className="text-muted-foreground/70">
                · {bus.manufactureYear}
              </span>
            )}
          </span>

          <div className="flex items-center gap-0.5 opacity-0 group-hover/bus-card:opacity-100 transition-opacity duration-150">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-[11px] text-muted-foreground hover:text-primary hover:bg-primary/5"
              onClick={() => onViewMap(bus)}
            >
              <LayoutGrid className="size-3.5 mr-1" />
              Plan
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={() => onEdit(bus)}
            >
              <Pencil className="size-3.5 mr-1" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
              onClick={() => onDelete(bus)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────────────────────────
// Main Fleet View
// ──────────────────────────────────────────────

export function OperatorFleetView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { data } = useSuspenseQuery(trpc.fleet.getBuses.queryOptions());
  const buses = data.buses;
  const stats = data.stats;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);

  useEffect(() => {
    if (searchParams && searchParams.get("action") === "new") {
      setAddModalOpen(true);
      router.replace(window.location.pathname);
    }
  }, [searchParams, router]);
  const [editingBus, setEditingBus] = useState<Bus | null>(null);
  const [deletingBus, setDeletingBus] = useState<Bus | null>(null);

  const deleteBusMutation = useMutation(trpc.fleet.deleteBus.mutationOptions());

  // Seat map drawer
  const [seatMapBusId, setSeatMapBusId] = useState<string | null>(null);
  const [seatMapBusTitle, setSeatMapBusTitle] = useState<{
    plate: string;
    layout: string;
  } | null>(null);

  // Filtered buses — guard against non-array state during hydration
  const filteredBuses = buses.filter((bus) => {
    const matchSearch =
      !search ||
      bus.registrationPlate.toLowerCase().includes(search.toLowerCase()) ||
      bus.internalName?.toLowerCase().includes(search.toLowerCase()) ||
      bus.busType?.name.toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === "ALL" || bus.status === statusFilter;

    return matchSearch && matchStatus;
  });

  function handleDelete() {
    if (!deletingBus) return;
    const plate = deletingBus.registrationPlate;
    deleteBusMutation.mutate(
      { id: deletingBus.id },
      {
        onSuccess: () => {
          toast.success(`Bus ${plate} deleted`);
          queryClient.invalidateQueries(trpc.fleet.getBuses.pathFilter());
          setDeletingBus(null);
        },
        onError: (err) => {
          toast.error(err.message || "Failed to delete vehicle");
        },
      }
    );
  }

  function handleViewMap(bus: Bus) {
    setSeatMapBusTitle({
      plate: bus.registrationPlate,
      layout: bus.layoutTemplate.name,
    });
    setSeatMapBusId(bus.id);
  }

  // ────────── Render ──────────

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background">
      {/* ── Page Header ── */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground">
              Fleet management
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {stats?.total ?? 0} vehicle{(stats?.total ?? 0) !== 1 ? "s" : ""}{" "}
              registered
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="h-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs gap-1.5"
              onClick={() => {
                setEditingBus(null);
                setAddModalOpen(true);
              }}
            >
              <Plus className="size-4" />
              Add vehicle
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {/* ── KPI Stats ── */}
        {stats && (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <StatCard
              label="Total vehicles"
              value={stats.total}
              icon={BusFront}
            />
            <StatCard
              label="Active"
              value={stats.active}
              icon={Activity}
              iconClassName="bg-chart-2/10 [&>svg]:text-chart-2"
            />
            <StatCard
              label="Maintenance"
              value={stats.maintenance}
              icon={Wrench}
              iconClassName="bg-chart-4/10 [&>svg]:text-chart-4"
            />
            <StatCard
              label="Retired"
              value={stats.retired}
              icon={Archive}
              iconClassName="bg-muted [&>svg]:text-muted-foreground"
            />
            <StatCard
              label="Total capacity"
              value={stats.totalSeats}
              icon={Armchair}
              sub="passenger seats"
            />
          </div>
        )}

        {/* ── Search & Filter ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by plate, name, model..."
                className="pl-8 h-8 text-xs bg-card border-border"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="fleet-status-filter" className="sr-only">Fleet status</label>
              <Combobox
              items={[
                { value: "ALL", label: "All statuses" },
                { value: "ACTIVE", label: "Active" },
                { value: "MAINTENANCE", label: "Maintenance" },
                { value: "INACTIVE", label: "Inactive" },
                { value: "RETIRED", label: "Retired" },
              ]}
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v ?? "ALL")}
            >
              <ComboboxInput
                id="fleet-status-filter"
                placeholder="Select status..."
                className="h-8 text-xs bg-card border-border w-full sm:w-[160px]"
                value={
                  statusFilter === "ALL"
                    ? "All statuses"
                    : statusFilter === "ACTIVE"
                      ? "Active"
                      : statusFilter === "MAINTENANCE"
                        ? "Maintenance"
                        : statusFilter === "INACTIVE"
                          ? "Inactive"
                          : statusFilter === "RETIRED"
                            ? "Retired"
                            : ""
                }
              />
              <ComboboxContent className="bg-popover border-border text-xs">
                <ComboboxEmpty>No status found.</ComboboxEmpty>
                <ComboboxList>
                  <ComboboxItem value="ALL">All statuses</ComboboxItem>
                  <ComboboxItem value="ACTIVE">Active</ComboboxItem>
                  <ComboboxItem value="MAINTENANCE">Maintenance</ComboboxItem>
                  <ComboboxItem value="INACTIVE">Inactive</ComboboxItem>
                  <ComboboxItem value="RETIRED">Retired</ComboboxItem>
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            </div>
          </div>
          {(search || statusFilter !== "ALL") && (
            <span className="text-xs text-muted-foreground shrink-0">
              {filteredBuses.length} result
              {filteredBuses.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* ── Bus Grid ── */}
        {filteredBuses.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Empty className="border border-dashed border-border">
              <EmptyMedia variant="icon">
                <BusFront />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>
                  {search || statusFilter !== "ALL"
                    ? "No results found"
                    : "Empty fleet"}
                </EmptyTitle>
                <EmptyDescription>
                  {search || statusFilter !== "ALL"
                    ? "Try adjusting your search or filters."
                    : "Add your first vehicle to start managing your fleet."}
                </EmptyDescription>
              </EmptyHeader>
              {!search && statusFilter === "ALL" && (
                <EmptyContent>
                  <Button
                    size="sm"
                    className="h-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs gap-1.5"
                    onClick={() => {
                      setEditingBus(null);
                      setAddModalOpen(true);
                    }}
                  >
                    <Plus className="size-4" />
                    Add vehicle
                  </Button>
                </EmptyContent>
              )}
            </Empty>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredBuses.map((bus) => (
              <BusCard
                key={bus.id}
                bus={bus}
                onEdit={(b) => {
                  setEditingBus(b);
                  setAddModalOpen(true);
                }}
                onDelete={setDeletingBus}
                onViewMap={handleViewMap}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Add / Edit Drawer ── */}
      <AddBusModal
        open={addModalOpen}
        onOpenChange={(o) => {
          setAddModalOpen(o);
          if (!o) setEditingBus(null);
        }}
        editingBus={editingBus}
        onSuccess={() => {
          queryClient.invalidateQueries(trpc.fleet.getBuses.pathFilter());
        }}
      />

      {/* ── Delete Confirm Dialog ── */}
      <Dialog
        open={!!deletingBus}
        onOpenChange={(o) => !o && setDeletingBus(null)}
      >
        <DialogContent className="sm:max-w-sm bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground text-base">
              Delete vehicle?
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              The vehicle{" "}
              <strong className="text-foreground font-mono">
                {deletingBus?.registrationPlate}
              </strong>{" "}
              will be permanently removed from your fleet. This action is
              irreversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 sm:flex-row">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 h-8 text-muted-foreground"
              onClick={() => setDeletingBus(null)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="flex-1 h-8 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold"
              onClick={handleDelete}
              disabled={deleteBusMutation.isPending}
            >
              {deleteBusMutation.isPending ? (
                <Spinner className="size-3.5 mr-1.5" />
              ) : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Seat Map Drawer ── */}
      <Drawer
        open={!!seatMapBusId}
        onOpenChange={(o) => {
          if (!o) {
            setSeatMapBusId(null);
            setSeatMapBusTitle(null);
          }
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
                  {seatMapBusTitle
                    ? `${seatMapBusTitle.plate} — ${seatMapBusTitle.layout}`
                    : "Loading..."}
                </DrawerDescription>
              </div>
            </div>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto p-4">
            {seatMapBusId ? (
              <Suspense
                fallback={
                  <div className="flex items-center justify-center py-12">
                    <Spinner className="size-6" />
                  </div>
                }
              >
                <SeatMapFetcher key={seatMapBusId} busId={seatMapBusId} />
              </Suspense>
            ) : null}
          </div>

          <DrawerFooter className="border-t border-border pt-4">
            <DrawerClose asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-muted-foreground hover:text-foreground"
              >
                Close
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

// Separate component to handle suspense query fetching for the drawer
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
