"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Plus, Map as MapIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
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
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@moja/ui/components/ui/combobox";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RouterOutputs } from "@/trpc/client";
import {
  SortableWaypoint,
  type WaypointDraft,
} from "./sortable-waypoint";

type Terminal = RouterOutputs["terminals"]["list"][number];
type RouteType = RouterOutputs["routes"]["list"][number];

const RouteMapPreview = dynamic(
  () => import("@/features/operator/components/route-map-preview"),
  { ssr: false, loading: () => <MapSkeleton /> },
);

function formatOffset(minutes: number): string {
  if (minutes === 0) return "Origin";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `+${m}m`;
  if (m === 0) return `+${h}h`;
  return `+${h}h ${m}m`;
}

function MapSkeleton() {
  return (
    <div className="h-full w-full bg-slate-100 animate-pulse rounded-r-lg flex items-center justify-center">
      <div className="text-center space-y-2">
        <MapIcon className="size-8 text-slate-300 mx-auto" />
        <p className="text-xs text-slate-400">Loading map…</p>
      </div>
    </div>
  );
}

interface RouteFormDrawerProps {
  open: boolean;
  onClose: () => void;
  terminals: Terminal[];
  editingRouteId?: string | null;
  onCreated?: (route: RouteType) => void;
  onUpdated?: (route: RouteType) => void;
}

export function RouteFormDrawer({
  open,
  onClose,
  terminals,
  editingRouteId,
  onCreated,
  onUpdated,
}: RouteFormDrawerProps) {
  const [name, setName] = useState("");
  const [originId, setOriginId] = useState("");
  const [destId, setDestId] = useState("");
  const [distanceKm, setDistanceKm] = useState("");
  const [estimatedDurationInput, setEstimatedDurationInput] = useState("");
  const [waypoints, setWaypoints] = useState<WaypointDraft[]>([]);
  const [addingStop, setAddingStop] = useState(false);
  const [newStopId, setNewStopId] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const originTerminal = terminals.find((t) => t.id === originId);
  const destTerminal = terminals.find((t) => t.id === destId);

  const allStops: WaypointDraft[] = [
    ...(originTerminal
      ? [
          {
            id: "__origin__",
            terminalId: originId,
            terminal: originTerminal,
            offsetMinutes: 0,
            dwellMinutes: 0,
            distanceFromOriginKm: 0,
            allowPickup: true,
            allowDropoff: false,
          },
        ]
      : []),
    ...waypoints,
    ...(destTerminal
      ? [
          {
            id: "__dest__",
            terminalId: destId,
            terminal: destTerminal,
            offsetMinutes:
              waypoints.length > 0
                ? waypoints[waypoints.length - 1]!.offsetMinutes +
                  (waypoints[waypoints.length - 1]!.dwellMinutes ?? 15) +
                  45
                : parseInt(estimatedDurationInput, 10) || 60,
            dwellMinutes: 0,
            distanceFromOriginKm: distanceKm ? parseFloat(distanceKm) : null,
            allowPickup: false,
            allowDropoff: true,
          },
        ]
      : []),
  ];

  const intermediateOptions = terminals.filter(
    (t) =>
      t.id !== originId &&
      t.id !== destId &&
      !waypoints.find((w) => w.terminalId === t.id),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setWaypoints((prev) => {
        const oldIndex = prev.findIndex((w) => w.id === active.id);
        const newIndex = prev.findIndex((w) => w.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }

  function addIntermediateStop() {
    if (!newStopId) return;
    const terminal = terminals.find((t) => t.id === newStopId);
    if (!terminal) return;

    const lastWp = waypoints.length > 0 ? waypoints[waypoints.length - 1] : null;
    const lastOffset = lastWp ? lastWp.offsetMinutes + (lastWp.dwellMinutes ?? 15) : 30;

    setWaypoints((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        terminalId: newStopId,
        terminal,
        offsetMinutes: lastOffset + 30,
        dwellMinutes: 15,
        distanceFromOriginKm: null,
        allowPickup: true,
        allowDropoff: true,
      },
    ]);
    setNewStopId("");
    setAddingStop(false);
  }

  function removeWaypoint(id: string) {
    setWaypoints((prev) => prev.filter((w) => w.id !== id));
  }

  function updateWaypoint(id: string, updates: Partial<WaypointDraft>) {
    setWaypoints((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...updates } : w)),
    );
  }

  const computedDuration =
    waypoints.length > 0
      ? waypoints[waypoints.length - 1]!.offsetMinutes +
        (waypoints[waypoints.length - 1]!.dwellMinutes ?? 15) +
        45
      : undefined;

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const createMutation = useMutation(trpc.routes.create.mutationOptions());
  const updateMutation = useMutation(trpc.routes.update.mutationOptions());
  const isEditing = Boolean(editingRouteId);

  const { data: editingRoute } = useQuery({
    ...trpc.routes.get.queryOptions({ id: editingRouteId ?? "" }),
    enabled: open && Boolean(editingRouteId),
  });

  useEffect(() => {
    if (!open || !editingRoute) {
      if (!open) resetForm();
      return;
    }

    setName(editingRoute.name);
    setOriginId(editingRoute.originTerminalId);
    setDestId(editingRoute.destTerminalId);
    setDistanceKm(editingRoute.distanceKm?.toString() ?? "");
    setEstimatedDurationInput(editingRoute.estimatedMinutes?.toString() ?? "");
    setWaypoints(
      (editingRoute.waypoints ?? []).map((wp) => ({
        id: wp.id,
        terminalId: wp.terminalId,
        terminal: wp.terminal as Terminal,
        offsetMinutes: wp.arrivalOffsetMinutes,
        dwellMinutes: wp.departureOffsetMinutes
          ? Math.max(1, wp.departureOffsetMinutes - wp.arrivalOffsetMinutes)
          : 15,
        distanceFromOriginKm: wp.distanceFromOriginKm ?? null,
        allowPickup: wp.isPickup,
        allowDropoff: wp.isDropoff,
      })),
    );
  }, [open, editingRoute]);

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Route name is required");
      return;
    }
    if (!originId) {
      toast.error("Select an origin terminal");
      return;
    }
    if (!destId) {
      toast.error("Select a destination terminal");
      return;
    }
    if (originId === destId) {
      toast.error("Origin and destination must be different");
      return;
    }

    const finalDuration =
      parseInt(estimatedDurationInput, 10) || computedDuration || null;

    const payload: any = {
      name: name.trim(),
      originTerminalId: originId,
      destTerminalId: destId,
      waypoints: waypoints.map((w, i) => ({
        terminalId: w.terminalId,
        stopOrder: i + 1,
        offsetMinutes: w.offsetMinutes,
        dwellMinutes: w.dwellMinutes ?? 15,
        distanceFromOriginKm: w.distanceFromOriginKm ?? null,
        allowPickup: w.allowPickup,
        allowDropoff: w.allowDropoff,
      })),
    };
    if (distanceKm) payload.distanceKm = parseFloat(distanceKm);
    if (finalDuration) payload.estimatedDurationMin = finalDuration;

    if (isEditing && editingRouteId) {
      updateMutation.mutate(
        { id: editingRouteId, data: payload },
        {
          onSuccess: (res: any) => {
            const updatedRoute = res.route ?? res;
            toast.success(`Route "${updatedRoute.name}" updated`);
            if (onUpdated) onUpdated(updatedRoute);
            resetForm();
            queryClient.invalidateQueries(trpc.routes.list.pathFilter());
            onClose();
          },
          onError: (err) => {
            toast.error(err.message || "Failed to update route");
          },
        },
      );
      return;
    }

    createMutation.mutate(payload, {
      onSuccess: (route) => {
        toast.success(`Route "${route.name}" created`);
        if (onCreated) onCreated(route as any);
        resetForm();
        queryClient.invalidateQueries(trpc.routes.list.pathFilter());
        onClose();
      },
      onError: (err) => {
        toast.error(err.message || "Failed to create route");
      },
    });
  }

  function resetForm() {
    setName("");
    setOriginId("");
    setDestId("");
    setDistanceKm("");
    setEstimatedDurationInput("");
    setWaypoints([]);
    setAddingStop(false);
    setNewStopId("");
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  const mapTerminals = allStops
    .map((s) => s.terminal)
    .filter((t) => t && t.latitude != null && t.longitude != null);

  const displayDuration =
    parseInt(estimatedDurationInput, 10) || computedDuration;

  return (
    <Drawer
      open={open}
      onOpenChange={(v) => !v && handleClose()}
      direction="right"
    >
      <DrawerContent className="!inset-y-0 !right-0 !left-auto !w-full !max-w-2xl flex flex-col">
        <DrawerHeader className="border-b border-border px-5 py-4 shrink-0">
          <DrawerTitle className="text-base font-bold">
            {isEditing ? "Edit Route" : "Create New Route"}
          </DrawerTitle>
          <DrawerDescription className="text-xs text-muted-foreground">
            {isEditing
              ? "Update the origin, destination, intermediate stops, and timings."
              : "Define the origin, destination, intermediate stops, and timings."}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: Form */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
            {/* Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Route name *</Label>
              <Input
                placeholder="e.g. Abidjan – Bouaké Express"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-sm"
              />
            </div>

            {/* Origin */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Origin terminal *</Label>
              <div className="w-full">
                <Combobox
                  items={terminals
                    .filter((t) => t.id !== destId)
                    .map((t) => ({
                      value: t.id,
                      label: `${t.name} — ${t.cityRelation?.name ?? t.city}`,
                    }))}
                  value={originId}
                  onValueChange={(val) => setOriginId(val || "")}
                >
                  <ComboboxInput
                    placeholder="Select origin terminal…"
                    className="w-full text-sm"
                    value={
                      originId
                        ? (() => {
                            const t = terminals.find((x) => x.id === originId);
                            return t
                              ? `${t.name} — ${t.cityRelation?.name ?? t.city}`
                              : "";
                          })()
                        : ""
                    }
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>No terminal found.</ComboboxEmpty>
                    <ComboboxList>
                      {terminals
                        .filter((t) => t.id !== destId)
                        .map((t) => (
                          <ComboboxItem key={t.id} value={t.id}>
                            {t.name} — {t.cityRelation?.name ?? t.city}
                          </ComboboxItem>
                        ))}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>
            </div>

            {/* Destination */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Destination terminal *
              </Label>
              <div className="w-full">
                <Combobox
                  items={terminals
                    .filter((t) => t.id !== originId)
                    .map((t) => ({
                      value: t.id,
                      label: `${t.name} — ${t.cityRelation?.name ?? t.city}`,
                    }))}
                  value={destId}
                  onValueChange={(val) => setDestId(val || "")}
                >
                  <ComboboxInput
                    placeholder="Select destination terminal…"
                    className="w-full text-sm"
                    value={
                      destId
                        ? (() => {
                            const t = terminals.find((x) => x.id === destId);
                            return t
                              ? `${t.name} — ${t.cityRelation?.name ?? t.city}`
                              : "";
                          })()
                        : ""
                    }
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>No terminal found.</ComboboxEmpty>
                    <ComboboxList>
                      {terminals
                        .filter((t) => t.id !== originId)
                        .map((t) => (
                          <ComboboxItem key={t.id} value={t.id}>
                            {t.name} — {t.cityRelation?.name ?? t.city}
                          </ComboboxItem>
                        ))}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>
            </div>

            {/* Distance & Duration Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Total distance (km)
                </Label>
                <Input
                  type="number"
                  min={0}
                  step={0.1}
                  placeholder="e.g. 350"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(e.target.value)}
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Est. duration (minutes)
                </Label>
                <Input
                  type="number"
                  min={1}
                  placeholder={computedDuration ? `Auto (~${computedDuration}m)` : "e.g. 240"}
                  value={estimatedDurationInput}
                  onChange={(e) => setEstimatedDurationInput(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>

            {/* Stop Sequence */}
            {(originId || destId) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Stop sequence &amp; timings</Label>
                  {displayDuration && (
                    <span className="text-[11px] font-medium text-primary">
                      ~{formatOffset(displayDuration)} total duration
                    </span>
                  )}
                </div>

                <div className="border border-border rounded-lg p-3.5 bg-slate-50/50 space-y-2">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={waypoints.map((w) => w.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {allStops.map((stop, index) => (
                        <SortableWaypoint
                          key={stop.id}
                          waypoint={stop}
                          index={index}
                          isOrigin={stop.id === "__origin__"}
                          isDest={stop.id === "__dest__"}
                          onRemove={removeWaypoint}
                          onUpdate={updateWaypoint}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>

                  {/* Add intermediate stop */}
                  {originId && destId && (
                    <div className="pt-2">
                      {addingStop ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <Combobox
                              items={intermediateOptions.map((t) => ({
                                value: t.id,
                                label: `${t.name} — ${t.cityRelation?.name ?? t.city}`,
                              }))}
                              value={newStopId}
                              onValueChange={(val) => setNewStopId(val || "")}
                            >
                              <ComboboxInput
                                placeholder="Select a terminal…"
                                className="h-8 text-xs w-full"
                                value={
                                  newStopId
                                    ? (() => {
                                        const t = intermediateOptions.find(
                                          (x) => x.id === newStopId,
                                        );
                                        return t
                                          ? `${t.name} — ${t.cityRelation?.name ?? t.city}`
                                          : "";
                                      })()
                                    : ""
                                }
                              />
                              <ComboboxContent>
                                <ComboboxEmpty>
                                  No terminal found.
                                </ComboboxEmpty>
                                <ComboboxList>
                                  {intermediateOptions.map((t) => (
                                    <ComboboxItem
                                      key={t.id}
                                      value={t.id}
                                      className="text-xs"
                                    >
                                      {t.name} —{" "}
                                      {t.cityRelation?.name ?? t.city}
                                    </ComboboxItem>
                                  ))}
                                </ComboboxList>
                              </ComboboxContent>
                            </Combobox>
                          </div>
                          <Button
                            size="sm"
                            className="h-8 text-xs"
                            onClick={addIntermediateStop}
                            disabled={!newStopId}
                          >
                            Add
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-xs"
                            onClick={() => {
                              setAddingStop(false);
                              setNewStopId("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs w-full border-dashed"
                          onClick={() => setAddingStop(true)}
                        >
                          <Plus className="size-3 mr-1.5" />
                          Add intermediate stop
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: Map Preview */}
          <div className="hidden lg:flex w-56 shrink-0 border-l border-border overflow-hidden">
            <RouteMapPreview terminals={mapTerminals} />
          </div>
        </div>

        <DrawerFooter className="border-t border-border px-5 py-4 shrink-0 flex-row gap-2">
          <DrawerClose asChild>
            <Button variant="outline" className="flex-1" onClick={handleClose}>
              Cancel
            </Button>
          </DrawerClose>
          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={
              createMutation.isPending ||
              updateMutation.isPending ||
              !name ||
              !originId ||
              !destId
            }
          >
            {createMutation.isPending || updateMutation.isPending ? (
              <Spinner className="size-4 mr-2" />
            ) : null}
            {createMutation.isPending || updateMutation.isPending
              ? "Saving…"
              : isEditing
                ? "Save Changes"
                : "Create Route"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
