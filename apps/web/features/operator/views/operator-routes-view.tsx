"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Map as MapIcon,
  ArrowRight,
  GripVertical,
  X,
  Clock,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertCircle,
  CalendarClock,
  Route,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@moja/ui/lib/utils";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { Card, CardContent } from "@moja/ui/components/ui/card";
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
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@moja/ui/components/ui/combobox";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@moja/ui/components/ui/empty";

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
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { useTRPC } from "@/trpc/client";
import {
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { RouterOutputs } from "@/trpc/client";

type RouteType = RouterOutputs["routes"]["list"][number];
type Terminal = RouterOutputs["terminals"]["list"][number];

// Leaflet loaded only on client (no SSR)
const RouteMapPreview = dynamic(
  () => import("@/features/operator/components/route-map-preview"),
  { ssr: false, loading: () => <MapSkeleton /> },
);

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

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

// ──────────────────────────────────────────────
// Waypoint types
// ──────────────────────────────────────────────

interface WaypointDraft {
  id: string; // local uuid for dnd
  terminalId: string;
  terminal: Terminal;
  offsetMinutes: number;
  allowPickup: boolean;
  allowDropoff: boolean;
}

// ──────────────────────────────────────────────
// Route Card
// ──────────────────────────────────────────────

interface RouteCardProps {
  route: RouteType;
  onDelete: (route: RouteType) => void;
}

function RouteCard({ route, onDelete }: RouteCardProps) {
  const stopCount = route._count?.waypoints ?? 0;

  return (
    <Card className="group border-border bg-card shadow-none hover:border-primary/30 hover:shadow-sm transition-all duration-200">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground truncate">
              {route.name}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs text-muted-foreground truncate">
                {route.originTerminal?.cityRelation?.name ??
                  route.originTerminal?.city ??
                  "—"}
              </span>
              <ArrowRight className="size-3 shrink-0 text-muted-foreground/40" />
              <span className="text-xs text-muted-foreground truncate">
                {route.destTerminal?.cityRelation?.name ??
                  route.destTerminal?.city ??
                  "—"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(route)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1 border-t border-border">
          <div className="flex items-center gap-1.5">
            <div className="size-1.5 rounded-full bg-primary/60" />
            <span className="text-[11px] text-muted-foreground">
              {stopCount + 2} stops
            </span>
          </div>
          {route.estimatedMinutes && (
            <div className="flex items-center gap-1.5">
              <Clock className="size-3 text-muted-foreground/60" />
              <span className="text-[11px] text-muted-foreground">
                {formatOffset(route.estimatedMinutes)}
              </span>
            </div>
          )}
          {route.distanceKm && (
            <span className="text-[11px] text-muted-foreground ml-auto">
              {route.distanceKm} km
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────────────────────────
// Sortable Waypoint Row
// ──────────────────────────────────────────────

interface SortableWaypointProps {
  waypoint: WaypointDraft;
  index: number;
  isOrigin: boolean;
  isDest: boolean;
  onRemove: (id: string) => void;
  onOffsetChange: (id: string, minutes: number) => void;
}

function SortableWaypoint({
  waypoint,
  index,
  isOrigin,
  isDest,
  onRemove,
  onOffsetChange,
}: SortableWaypointProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: waypoint.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [editingOffset, setEditingOffset] = useState(false);
  const [offsetInput, setOffsetInput] = useState(
    waypoint.offsetMinutes.toString(),
  );

  function commitOffset() {
    const parsed = parseInt(offsetInput, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      onOffsetChange(waypoint.id, parsed);
    } else {
      setOffsetInput(waypoint.offsetMinutes.toString());
    }
    setEditingOffset(false);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-stretch gap-0 transition-opacity",
        isDragging && "opacity-50",
      )}
    >
      {/* Timeline column */}
      <div className="flex flex-col items-center w-8 shrink-0">
        <div
          className={cn(
            "size-3 rounded-full border-2 mt-1 shrink-0",
            isOrigin || isDest
              ? "border-primary bg-primary"
              : "border-primary/50 bg-background",
          )}
        />
        {!isDest && <div className="w-px flex-1 bg-border min-h-[2rem]" />}
      </div>

      {/* Content */}
      <div className="flex-1 pb-4">
        <div className="flex items-start gap-2">
          {/* Drag handle — only on intermediary stops */}
          {!isOrigin && !isDest && (
            <button
              {...attributes}
              {...listeners}
              className="mt-0.5 text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing"
              aria-label="Reorder stop"
            >
              <GripVertical className="size-4" />
            </button>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground leading-tight">
              {waypoint.terminal.name}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {waypoint.terminal.cityRelation?.name ?? waypoint.terminal.city}
            </p>

            {/* Offset badge / editor */}
            {!isOrigin && (
              <div className="mt-1.5">
                {editingOffset ? (
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      min={0}
                      className="h-6 w-24 text-xs px-1.5"
                      value={offsetInput}
                      onChange={(e) => setOffsetInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitOffset();
                        if (e.key === "Escape") setEditingOffset(false);
                      }}
                      autoFocus
                    />
                    <span className="text-[11px] text-muted-foreground">
                      min from origin
                    </span>
                    <button
                      onClick={commitOffset}
                      className="text-primary hover:text-primary/80"
                    >
                      <CheckCircle2 className="size-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setOffsetInput(waypoint.offsetMinutes.toString());
                      setEditingOffset(true);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary/80 hover:text-primary group/offset"
                  >
                    <Clock className="size-3" />
                    {formatOffset(waypoint.offsetMinutes)}
                    <Pencil className="size-2.5 opacity-0 group-hover/offset:opacity-100 transition-opacity" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Remove button for intermediate stops */}
          {!isOrigin && !isDest && (
            <button
              onClick={() => onRemove(waypoint.id)}
              className="mt-0.5 text-muted-foreground/40 hover:text-destructive transition-colors"
              aria-label="Remove stop"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Route Form Drawer
// ──────────────────────────────────────────────

interface RouteFormDrawerProps {
  open: boolean;
  onClose: () => void;
  terminals: Terminal[];
  onCreated: (route: RouteType) => void;
}

function RouteFormDrawer({
  open,
  onClose,
  terminals,
  onCreated,
}: RouteFormDrawerProps) {
  const [name, setName] = useState("");
  const [originId, setOriginId] = useState("");
  const [destId, setDestId] = useState("");
  const [distanceKm, setDistanceKm] = useState("");
  const [waypoints, setWaypoints] = useState<WaypointDraft[]>([]);
  const [addingStop, setAddingStop] = useState(false);
  const [newStopId, setNewStopId] = useState("");
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const originTerminal = terminals.find((t) => t.id === originId);
  const destTerminal = terminals.find((t) => t.id === destId);

  // Build ordered waypoints list for preview: origin + intermediaries + dest
  const allStops: WaypointDraft[] = [
    ...(originTerminal
      ? [
          {
            id: "__origin__",
            terminalId: originId,
            terminal: originTerminal,
            offsetMinutes: 0,
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
            offsetMinutes: 0,
            allowPickup: false,
            allowDropoff: true,
          },
        ]
      : []),
  ];

  // Available terminals for intermediate stops (exclude origin & dest)
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

    // Default offset: last waypoint + 60 min, or 60 min from origin
    const lastOffset =
      waypoints.length > 0 ? waypoints[waypoints.length - 1]!.offsetMinutes : 0;
    setWaypoints((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        terminalId: newStopId,
        terminal,
        offsetMinutes: lastOffset + 60,
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

  function updateOffset(id: string, minutes: number) {
    setWaypoints((prev) =>
      prev.map((w) => (w.id === id ? { ...w, offsetMinutes: minutes } : w)),
    );
  }

  // Estimate total duration from last waypoint offset
  const estimatedDuration =
    waypoints.length > 0
      ? waypoints[waypoints.length - 1]!.offsetMinutes + 60
      : undefined;

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const createMutation = useMutation(trpc.routes.create.mutationOptions());

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

    const payload: any = {
      name: name.trim(),
      originTerminalId: originId,
      destTerminalId: destId,
      waypoints: waypoints.map((w, i) => ({
        terminalId: w.terminalId,
        stopOrder: i + 1,
        offsetMinutes: w.offsetMinutes,
        allowPickup: w.allowPickup,
        allowDropoff: w.allowDropoff,
      })),
    };
    if (distanceKm) payload.distanceKm = parseFloat(distanceKm);
    if (estimatedDuration) payload.estimatedDurationMin = estimatedDuration;

    createMutation.mutate(payload, {
      onSuccess: (route) => {
        toast.success(`Route "${route.name}" created`);
        onCreated(route as any);
        resetForm();
        queryClient.invalidateQueries(trpc.routes.list.pathFilter());
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
    setWaypoints([]);
    setAddingStop(false);
    setNewStopId("");
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  // Terminals for map preview
  const mapTerminals = allStops
    .map((s) => s.terminal)
    .filter((t) => t.latitude && t.longitude);

  return (
    <Drawer
      open={open}
      onOpenChange={(v) => !v && handleClose()}
      direction="right"
    >
      <DrawerContent className="!inset-y-0 !right-0 !left-auto !w-full !max-w-2xl flex flex-col">
        <DrawerHeader className="border-b border-border px-5 py-4 shrink-0">
          <DrawerTitle className="text-base font-bold">
            Create New Route
          </DrawerTitle>
          <DrawerDescription className="text-xs text-muted-foreground">
            Define the origin, destination, and intermediate stops.
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

            {/* Distance (optional) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">
                Total distance (km) — optional
              </Label>
              <Input
                type="number"
                min={0}
                placeholder="e.g. 350"
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value)}
                className="text-sm"
              />
            </div>

            {/* Stop Sequence */}
            {(originId || destId) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Stop sequence</Label>
                  {estimatedDuration && (
                    <span className="text-[11px] text-muted-foreground">
                      ~{formatOffset(estimatedDuration)} total
                    </span>
                  )}
                </div>

                <div className="border border-border rounded-md p-4 bg-slate-50/50">
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
                          onOffsetChange={updateOffset}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>

                  {/* Add intermediate stop */}
                  {originId && destId && (
                    <div className="mt-2">
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
            disabled={createMutation.isPending || !name || !originId || !destId}
          >
            {createMutation.isPending ? (
              <Spinner className="size-4 mr-2" />
            ) : null}
            {createMutation.isPending ? "Saving…" : "Create Route"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

// ──────────────────────────────────────────────
// Delete Confirm Dialog
// ──────────────────────────────────────────────

function DeleteRouteDialog({
  route,
  open,
  onClose,
  onDeleted,
}: {
  route: RouteType | null;
  open: boolean;
  onClose: () => void;
  onDeleted: (id: string) => void;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const deleteMutation = useMutation(trpc.routes.delete.mutationOptions());

  function handleDelete() {
    if (!route) return;
    deleteMutation.mutate(
      { id: route.id },
      {
        onSuccess: () => {
          toast.success(`Route "${route.name}" deleted`);
          onDeleted(route.id);
          onClose();
          queryClient.invalidateQueries(trpc.routes.list.pathFilter());
        },
        onError: (err) => {
          toast.error(err.message || "Failed to delete route");
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="size-4" />
            Delete route
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">
              "{route?.name}"
            </span>
            ? This will also remove all associated schedules and trips. This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <Spinner className="size-4 mr-2" />
            ) : null}
            {deleteMutation.isPending ? "Deleting…" : "Delete Route"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────────────────────────────────
// Success Panel
// ──────────────────────────────────────────────

function SuccessPanel({
  route,
  onDismiss,
}: {
  route: RouteType | null;
  onDismiss: () => void;
}) {
  if (!route) return null;
  return (
    <div className="border border-primary/20 bg-primary/5 rounded-md p-4 flex items-start gap-3">
      <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground">Route created</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          <span className="font-medium">{route.name}</span> is ready. Create a
          schedule to start generating trips.
        </p>
        <div className="flex items-center gap-3 mt-3">
          <a
            href="/dashboard/operator/schedules"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80"
          >
            <CalendarClock className="size-3.5" />
            Create Schedule →
          </a>
          <button
            onClick={onDismiss}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main View
// ──────────────────────────────────────────────

export function OperatorRoutesView() {
  const searchParams = useSearchParams();
  const trpc = useTRPC();
  const { data: routesData } = useSuspenseQuery(
    trpc.routes.list.queryOptions(),
  );
  const { data: terminalsData } = useSuspenseQuery(
    trpc.terminals.list.queryOptions(),
  );

  const [routes, setRoutes] = useState<RouteType[]>([]);
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deletingRoute, setDeletingRoute] = useState<RouteType | null>(null);
  const [successRoute, setSuccessRoute] = useState<RouteType | null>(null);

  // Sync state with suspense queries
  useEffect(() => {
    setRoutes(routesData);
    setTerminals(terminalsData);
  }, [routesData, terminalsData]);

  useEffect(() => {
    if (searchParams && searchParams.get("action") === "new") {
      setDrawerOpen(true);
    }
  }, [searchParams]);

  function handleCreated(route: RouteType) {
    setRoutes((prev) => [route, ...prev]);
    setSuccessRoute(route);
    setDrawerOpen(false);
  }

  function handleDeleted(id: string) {
    setRoutes((prev) => prev.filter((r) => r.id !== id));
    if (successRoute?.id === id) setSuccessRoute(null);
  }

  const filteredRoutes = routes.filter(
    (r) =>
      !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.originTerminal?.cityRelation?.name
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      r.destTerminal?.cityRelation?.name
        ?.toLowerCase()
        .includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <Input
            placeholder="Search routes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <Button
          size="sm"
          className="h-8 text-xs"
          onClick={() => setDrawerOpen(true)}
        >
          <Plus className="size-3.5 mr-1.5" />
          New Route
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {/* Success panel */}
        <SuccessPanel
          route={successRoute}
          onDismiss={() => setSuccessRoute(null)}
        />

        {/* Route list */}
        {filteredRoutes.length === 0 ? (
          routes.length === 0 ? (
            <Empty className="py-16">
              <EmptyMedia>
                <Route className="size-10 text-muted-foreground/30" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>No routes yet</EmptyTitle>
                <EmptyDescription>
                  Create your first intercity route to start building schedules.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button size="sm" onClick={() => setDrawerOpen(true)}>
                  <Plus className="size-3.5 mr-1.5" />
                  Create Route
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <Empty className="py-16">
              <EmptyMedia>
                <MapIcon className="size-10 text-muted-foreground/30" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>No routes match</EmptyTitle>
                <EmptyDescription>
                  Try a different route name, origin, or destination.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRoutes.map((route) => (
              <RouteCard
                key={route.id}
                route={route}
                onDelete={setDeletingRoute}
              />
            ))}
          </div>
        )}
      </div>

      {/* Drawer */}
      <RouteFormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        terminals={terminals}
        onCreated={handleCreated}
      />

      {/* Delete dialog */}
      <DeleteRouteDialog
        route={deletingRoute}
        open={!!deletingRoute}
        onClose={() => setDeletingRoute(null)}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
