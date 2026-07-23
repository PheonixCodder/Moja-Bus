"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Plus, Map as MapIcon, ArrowRight, GripVertical, X, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { Badge } from "@moja/ui/components/ui/badge";
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
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface WaypointDraft {
  id: string;
  terminalId: string;
  terminal: any;
  offsetMinutes: number;
  dwellMinutes: number;
  allowPickup: boolean;
  allowDropoff: boolean;
  distanceFromOriginKm?: number | undefined;
}

interface RouteEditorSheetProps {
  isOpen: boolean;
  onClose: () => void;
  editingRoute?: any;
  terminals: any[];
}

export function RouteEditorSheet({
  isOpen,
  onClose,
  editingRoute,
  terminals = [],
}: RouteEditorSheetProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const createMutation = useMutation(
    trpc.routes.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.routes.list.pathFilter());
      },
    }),
  );

  const updateMutation = useMutation(
    trpc.routes.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.routes.list.pathFilter());
      },
    }),
  );

  const [name, setName] = useState("");
  const [originTerminalId, setOriginTerminalId] = useState("");
  const [destTerminalId, setDestTerminalId] = useState("");
  const [distanceKm, setDistanceKm] = useState("");
  const [estimatedDurationMin, setEstimatedDurationMin] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "DRAFT" | "SUSPENDED">("ACTIVE");
  const [waypoints, setWaypoints] = useState<WaypointDraft[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (editingRoute) {
      setName(editingRoute.name ?? "");
      setOriginTerminalId(editingRoute.originTerminalId ?? "");
      setDestTerminalId(editingRoute.destTerminalId ?? "");
      setDistanceKm(editingRoute.distanceKm ? String(editingRoute.distanceKm) : "");
      setEstimatedDurationMin(
        editingRoute.estimatedMinutes ? String(editingRoute.estimatedMinutes) : "",
      );
      setStatus(editingRoute.status ?? "ACTIVE");
      if (editingRoute.waypoints) {
        setWaypoints(
          editingRoute.waypoints.map((w: any) => ({
            id: w.id || crypto.randomUUID(),
            terminalId: w.terminalId,
            terminal: w.terminal,
            offsetMinutes: w.arrivalOffsetMinutes ?? 0,
            dwellMinutes: Math.max(0, (w.departureOffsetMinutes ?? 0) - (w.arrivalOffsetMinutes ?? 0)),
            allowPickup: w.isPickup ?? true,
            allowDropoff: w.isDropoff ?? true,
            distanceFromOriginKm: w.distanceFromOriginKm ?? undefined,
          })),
        );
      } else {
        setWaypoints([]);
      }
      setIsDirty(false);
    } else {
      setName("");
      setOriginTerminalId("");
      setDestTerminalId("");
      setDistanceKm("");
      setEstimatedDurationMin("");
      setStatus("ACTIVE");
      setWaypoints([]);
      setIsDirty(false);
    }
  }, [editingRoute, isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});

    const errors: Record<string, string> = {};
    if (!name.trim()) errors["name"] = "Route name is required";
    if (!originTerminalId) errors["origin"] = "Origin terminal is required";
    if (!destTerminalId) errors["dest"] = "Destination terminal is required";
    if (originTerminalId === destTerminalId && originTerminalId) {
      errors["dest"] = "Destination must be different from origin";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setSubmitting(false);
      return;
    }

    try {
      const payload: any = {
        name: name.trim(),
        originTerminalId,
        destTerminalId,
        distanceKm: distanceKm ? parseFloat(distanceKm) : undefined,
        estimatedDurationMin: estimatedDurationMin ? parseInt(estimatedDurationMin, 10) : undefined,
        status,
        waypoints: waypoints.map((w, idx) => ({
          terminalId: w.terminalId,
          offsetMinutes: w.offsetMinutes,
          dwellMinutes: w.dwellMinutes,
          allowPickup: w.allowPickup,
          allowDropoff: w.allowDropoff,
          distanceFromOriginKm: w.distanceFromOriginKm,
        })),
      };

      if (editingRoute) {
        await updateMutation.mutateAsync({
          id: editingRoute.id,
          data: payload,
        });
        toast.success("Route updated successfully");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Route created successfully");
      }
      setIsDirty(false);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to save route");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent
        className="max-h-[90vh]"
        onPointerDownOutside={(e) => {
          if (isDirty && !window.confirm("You have unsaved changes. Discard changes?")) {
            e.preventDefault();
          }
        }}
      >
        <div className="mx-auto w-full max-w-3xl overflow-y-auto p-6 space-y-6">
          <DrawerHeader className="px-0">
            <DrawerTitle className="text-xl font-bold flex items-center gap-2">
              <MapIcon className="size-5 text-primary" />
              {editingRoute ? "Edit Route" : "Create Route"}
            </DrawerTitle>
            <DrawerDescription>
              Configure route terminals, intermediate waypoints, distance, and estimated duration.
            </DrawerDescription>
          </DrawerHeader>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="routeName" className="text-xs font-semibold uppercase tracking-wider">
                Route Name *
              </Label>
              <Input
                id="routeName"
                placeholder="e.g. Abidjan Express (Abidjan → Yamoussoukro)"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setIsDirty(true);
                }}
                className={formErrors["name"] ? "border-destructive" : ""}
              />
              {formErrors["name"] && (
                <p className="text-xs text-destructive">{formErrors["name"]}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="originTerminal" className="text-xs font-semibold uppercase tracking-wider">
                  Origin Terminal *
                </Label>
                <select
                  id="originTerminal"
                  value={originTerminalId}
                  onChange={(e) => {
                    setOriginTerminalId(e.target.value);
                    setIsDirty(true);
                  }}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select origin terminal...</option>
                  {terminals.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.cityRelation?.name ?? t.city})
                    </option>
                  ))}
                </select>
                {formErrors["origin"] && (
                  <p className="text-xs text-destructive">{formErrors["origin"]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="destTerminal" className="text-xs font-semibold uppercase tracking-wider">
                  Destination Terminal *
                </Label>
                <select
                  id="destTerminal"
                  value={destTerminalId}
                  onChange={(e) => {
                    setDestTerminalId(e.target.value);
                    setIsDirty(true);
                  }}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select destination terminal...</option>
                  {terminals.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.cityRelation?.name ?? t.city})
                    </option>
                  ))}
                </select>
                {formErrors["dest"] && (
                  <p className="text-xs text-destructive">{formErrors["dest"]}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="distanceKm" className="text-xs font-semibold uppercase tracking-wider">
                  Distance (km)
                </Label>
                <Input
                  id="distanceKm"
                  type="number"
                  step="0.1"
                  placeholder="e.g. 240.5"
                  value={distanceKm}
                  onChange={(e) => {
                    setDistanceKm(e.target.value);
                    setIsDirty(true);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedDurationMin" className="text-xs font-semibold uppercase tracking-wider">
                  Estimated Duration (minutes)
                </Label>
                <Input
                  id="estimatedDurationMin"
                  type="number"
                  placeholder="e.g. 180"
                  value={estimatedDurationMin}
                  onChange={(e) => {
                    setEstimatedDurationMin(e.target.value);
                    setIsDirty(true);
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider">
                Status
              </Label>
              <div className="flex items-center gap-2">
                {(["ACTIVE", "DRAFT", "SUSPENDED"] as const).map((s) => (
                  <Button
                    key={s}
                    type="button"
                    variant={status === s ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setStatus(s);
                      setIsDirty(true);
                    }}
                    className="text-xs font-semibold uppercase tracking-wider"
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>

            <DrawerFooter className="px-0 pt-4 flex-row justify-end gap-3">
              <DrawerClose asChild>
                <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                  Cancel
                </Button>
              </DrawerClose>
              <Button type="submit" disabled={submitting}>
                {submitting && <Spinner className="mr-2 size-4" />}
                {editingRoute ? "Save Changes" : "Create Route"}
              </Button>
            </DrawerFooter>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
