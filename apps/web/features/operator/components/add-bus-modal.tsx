"use client";

import { useEffect, useState } from "react";
import { BusFront, Layers, Plus, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@moja/ui/components/ui/drawer";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { Textarea } from "@moja/ui/components/ui/textarea";
import { cn } from "@moja/ui/lib/utils";

import { useTRPC } from "@/trpc/client";
import {
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { RouterOutputs } from "@/trpc/client";

type Bus = RouterOutputs["fleet"]["getBuses"]["buses"][number];
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@moja/ui/components/ui/combobox";
import { LayoutBuilderSheet } from "@/features/operator/components/layout-builder-sheet";

// ──────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────

interface AddBusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingBus?: Bus | null;
  onSuccess: () => void;
}

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────

const currentYear = new Date().getFullYear();
const yearOptions = Array.from(
  { length: currentYear - 1989 },
  (_, i) => currentYear - i,
);

type BusStatus = "ACTIVE" | "MAINTENANCE" | "INACTIVE" | "RETIRED";

export function AddBusModal({
  open,
  onOpenChange,
  editingBus,
  onSuccess,
}: AddBusModalProps) {
  const isEditing = !!editingBus;

  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { data: busTypes } = useSuspenseQuery(
    trpc.fleet.getBusTypes.queryOptions(),
  );
  const { data: layouts } = useSuspenseQuery(
    trpc.fleet.getLayoutTemplates.queryOptions(),
  );

  const createMutation = useMutation(trpc.fleet.createBus.mutationOptions());
  const updateMutation = useMutation(trpc.fleet.updateBus.mutationOptions());

  // Form fields
  const [plateNumber, setPlateNumber] = useState("");
  const [internalName, setInternalName] = useState("");
  const [manufactureYear, setManufactureYear] = useState<string>("");
  const [busTypeId, setBusTypeId] = useState<string>("");
  const [seatLayoutId, setSeatLayoutId] = useState<string>("");
  const [status, setStatus] = useState<BusStatus>("ACTIVE");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Layout builder
  const [builderOpen, setBuilderOpen] = useState(false);

  // Sync form when editing bus changes
  useEffect(() => {
    if (!open) {
      createMutation.reset();
      updateMutation.reset();
    }

    if (editingBus) {
      setPlateNumber(editingBus.registrationPlate);
      setInternalName(editingBus.internalName ?? "");
      setManufactureYear(editingBus.manufactureYear?.toString() ?? "");
      setBusTypeId(editingBus.busType.id);
      setSeatLayoutId(editingBus.layoutTemplateId);
      setStatus(editingBus.status);
      setNotes(editingBus.notes ?? "");
    } else {
      setPlateNumber("");
      setInternalName("");
      setManufactureYear("");
      setBusTypeId("");
      setSeatLayoutId("");
      setStatus("ACTIVE");
      setNotes("");
    }
    setErrors({});
  }, [editingBus, open]);

  // Group layouts: platform defaults (companyId null) vs. operator custom
  const platformLayouts = layouts.filter((l) => !l.companyId);
  const customLayouts = layouts.filter((l) => !!l.companyId);

  // Filter by selected busType when one is chosen
  const filteredPlatform = busTypeId
    ? platformLayouts.filter((l) => l.busTypeId === busTypeId)
    : platformLayouts;
  const filteredCustom = busTypeId
    ? customLayouts.filter((l) => l.busTypeId === busTypeId)
    : customLayouts;

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!plateNumber.trim() || plateNumber.trim().length < 4) {
      newErrors["plateNumber"] = "Registration plate is required (min 4 chars)";
    }
    if (!isEditing && !busTypeId) {
      newErrors["busTypeId"] = "Please select a vehicle type";
    }
    if (!isEditing && !seatLayoutId) {
      newErrors["seatLayoutId"] = "Please select a seat configuration";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    if (isEditing && editingBus) {
      updateMutation.mutate(
        {
          id: editingBus.id,
          data: {
            registrationPlate: plateNumber.trim().toUpperCase(),
            internalName: internalName.trim() ? internalName.trim() : null,
            ...(manufactureYear ? { manufactureYear: parseInt(manufactureYear, 10) } : { manufactureYear: null }),
            notes: notes.trim() ? notes.trim() : null,
            status,
          },
        },
        {
          onSuccess: () => {
            toast.success("Vehicle updated successfully");
            onSuccess();
            onOpenChange(false);
          },
          onError: (err) => {
            toast.error(err.message || "Unexpected error");
          },
        },
      );
    } else {
      createMutation.mutate(
        {
          registrationPlate: plateNumber.trim().toUpperCase(),
          busTypeId,
          layoutTemplateId: seatLayoutId,
          ...(internalName.trim() ? { internalName: internalName.trim() } : {}),
          ...(manufactureYear
            ? { manufactureYear: parseInt(manufactureYear, 10) }
            : {}),
          ...(notes.trim() ? { notes: notes.trim() } : {}),
        },
        {
          onSuccess: () => {
            toast.success("Vehicle added to the fleet!");
            onSuccess();
            onOpenChange(false);
          },
          onError: (err) => {
            toast.error(err.message || "Unexpected error");
          },
        },
      );
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange} modal={false} direction="right">
        <DrawerContent className="bg-background border-l border-border w-full sm:max-w-lg flex flex-col">
          <DrawerHeader className="border-b border-border pb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                <BusFront className="size-4.5 text-primary" />
              </div>
              <div>
                <DrawerTitle className="text-base font-semibold text-foreground">
                  {isEditing ? "Edit vehicle" : "Add vehicle"}
                </DrawerTitle>
                <DrawerDescription className="text-xs text-muted-foreground mt-0.5">
                  {isEditing
                    ? "Update the details of this vehicle."
                    : "Fill in the details to register a new vehicle."}
                </DrawerDescription>
              </div>
            </div>
            <DrawerClose
              aria-label="Close"
              className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="size-4" />
            </DrawerClose>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto">
            <form id="bus-form" onSubmit={handleSubmit} className="space-y-5 p-5">
              {/* Plate Number */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="plateNumber"
                  className="text-xs font-semibold text-foreground/80"
                >
                  Registration plate *
                </Label>
                <Input
                  id="plateNumber"
                  placeholder="e.g. 1234AB01"
                  className="h-9 text-sm bg-card border-border font-mono uppercase"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                />
                {errors["plateNumber"] && (
                  <p className="text-xs text-destructive">{errors["plateNumber"]}</p>
                )}
              </div>

              {/* Internal Name */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="internalName"
                  className="text-xs font-semibold text-foreground/80"
                >
                  Internal name{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  id="internalName"
                  placeholder='e.g. "Bus Alpha", "VIP-07"'
                  className="h-9 text-sm bg-card border-border"
                  value={internalName}
                  onChange={(e) => setInternalName(e.target.value)}
                />
              </div>

              {/* Manufacture Year */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground/80">
                  Manufacture year
                </Label>
                <Combobox
                  items={yearOptions.map((y) => ({
                    value: y.toString(),
                    label: y.toString(),
                  }))}
                  value={manufactureYear}
                  onValueChange={(v) => { if (v !== null) setManufactureYear(v); }}
                >
                  <ComboboxInput placeholder="Select a year..." className="w-full" />
                  <ComboboxContent>
                    <ComboboxEmpty>No year found.</ComboboxEmpty>
                    <ComboboxList>
                      {yearOptions.map((y) => (
                        <ComboboxItem key={y} value={y.toString()}>
                          {y}
                        </ComboboxItem>
                      ))}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>

              {/* Bus Type */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground/80">
                  Vehicle type *
                </Label>
                <Combobox
                  items={busTypes.map((bt) => ({
                    value: bt.id,
                    label: bt.name,
                  }))}
                  value={busTypeId}
                  onValueChange={(v) => {
                    if (v !== null) {
                      setBusTypeId(v);
                      // Reset layout selection when type changes
                      setSeatLayoutId("");
                    }
                  }}
                  disabled={isEditing}
                >
                  <ComboboxInput
                    placeholder="Select vehicle type..."
                    className="w-full"
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>No vehicle type found.</ComboboxEmpty>
                    <ComboboxList>
                      {busTypes.map((bt) => (
                        <ComboboxItem key={bt.id} value={bt.id}>
                          <div className="flex flex-col">
                            <span>{bt.name}</span>
                            {"description" in bt && bt.description && (
                              <span className="text-xs text-muted-foreground">
                                {bt.description as string}
                              </span>
                            )}
                          </div>
                        </ComboboxItem>
                      ))}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
                {errors["busTypeId"] && (
                  <p className="text-xs text-destructive">{errors["busTypeId"]}</p>
                )}
                {isEditing && (
                  <p className="text-[11px] text-muted-foreground">
                    Vehicle type can&apos;t be changed after creation.
                  </p>
                )}
              </div>

              {/* Seat Layout — Grouped picker */}
              {!isEditing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-foreground/80">
                      Seat configuration *
                    </Label>
                    {busTypeId && (
                      <button
                        type="button"
                        onClick={() => setBuilderOpen(true)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors"
                      >
                        <Plus className="size-3" />
                        Create new layout
                      </button>
                    )}
                  </div>

                  {/* Hint when no bus type selected */}
                  {!busTypeId && (
                    <p className="text-xs text-muted-foreground">
                      Select a vehicle type first to see compatible layouts.
                    </p>
                  )}

                  {busTypeId && (
                    <div className="space-y-3">
                      {/* Custom layouts section */}
                      {filteredCustom.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <Layers className="size-3 text-primary" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                              My layouts
                            </span>
                          </div>
                          <div className="grid grid-cols-1 gap-1.5">
                            {filteredCustom.map((layout) => (
                              <LayoutRadioCard
                                key={layout.id}
                                layout={layout}
                                selected={seatLayoutId === layout.id}
                                onSelect={() => setSeatLayoutId(layout.id)}
                                isCustom
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Platform defaults section */}
                      {filteredPlatform.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="size-3 text-muted-foreground" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              Platform defaults
                            </span>
                          </div>
                          <div className="grid grid-cols-1 gap-1.5">
                            {filteredPlatform.map((layout) => (
                              <LayoutRadioCard
                                key={layout.id}
                                layout={layout}
                                selected={seatLayoutId === layout.id}
                                onSelect={() => setSeatLayoutId(layout.id)}
                                isCustom={false}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* No layouts for this type */}
                      {filteredPlatform.length === 0 && filteredCustom.length === 0 && (
                        <div className="rounded-lg border border-dashed border-border p-4 text-center">
                          <p className="text-xs text-muted-foreground">
                            No layouts available for this vehicle type.
                          </p>
                          <button
                            type="button"
                            onClick={() => setBuilderOpen(true)}
                            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                          >
                            <Plus className="size-3.5" />
                            Create a custom layout
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {errors["seatLayoutId"] && (
                    <p className="text-xs text-destructive">{errors["seatLayoutId"]}</p>
                  )}
                </div>
              )}

              {/* Status (editing only) */}
              {isEditing && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground/80">
                    Status
                  </Label>
                  <Combobox
                    items={[
                      { value: "ACTIVE", label: "Active" },
                      { value: "MAINTENANCE", label: "Maintenance" },
                      { value: "INACTIVE", label: "Inactive" },
                    ]}
                    value={status}
                    onValueChange={(v) => setStatus((v ?? "ACTIVE") as BusStatus)}
                  >
                    <ComboboxInput placeholder="Select status..." className="w-full" />
                    <ComboboxContent>
                      <ComboboxEmpty>No status found.</ComboboxEmpty>
                      <ComboboxList>
                        <ComboboxItem value="ACTIVE">Active</ComboboxItem>
                        <ComboboxItem value="MAINTENANCE">Maintenance</ComboboxItem>
                        <ComboboxItem value="INACTIVE">Inactive</ComboboxItem>
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="notes"
                  className="text-xs font-semibold text-foreground/80"
                >
                  Notes{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Additional details about this vehicle..."
                  className="text-sm bg-card border-border resize-none min-h-[72px]"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </form>
          </div>

          <DrawerFooter className="border-t border-border pt-4 gap-2 shrink-0">
            <Button
              type="submit"
              form="bus-form"
              disabled={isPending}
              className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm"
            >
              {isPending && <Spinner className="size-4 mr-2" />}
              {isEditing ? "Save changes" : "Add vehicle"}
            </Button>
            <DrawerClose asChild>
              <Button
                variant="ghost"
                className="h-9 text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Layout builder — opens on top of the add bus drawer */}
      <LayoutBuilderSheet
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        busTypes={busTypes}
        onSuccess={(newLayoutId) => {
          // Invalidate layouts and auto-select the new one
          queryClient.invalidateQueries(trpc.fleet.getLayoutTemplates.pathFilter());
          setSeatLayoutId(newLayoutId);
        }}
      />
    </>
  );
}

// ──────────────────────────────────────────────
// Layout Radio Card
// ──────────────────────────────────────────────

interface LayoutRadioCardProps {
  layout: { id: string; name: string; rows: number; columns: number; totalSeats: number };
  selected: boolean;
  onSelect: () => void;
  isCustom: boolean;
}

function LayoutRadioCard({ layout, selected, onSelect, isCustom }: LayoutRadioCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex items-center gap-3 rounded-lg border p-3 text-left transition-all duration-150",
        selected
          ? "border-primary/50 bg-primary/5 shadow-sm"
          : "border-border bg-card hover:border-foreground/20 hover:bg-muted/50",
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all",
          selected ? "border-primary bg-primary" : "border-border",
        )}
      >
        {selected && <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <p
            className={cn(
              "text-[13px] font-semibold truncate",
              selected ? "text-primary" : "text-foreground",
            )}
          >
            {layout.name}
          </p>
          {isCustom && (
            <span className="shrink-0 inline-flex items-center gap-0.5 rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary uppercase tracking-wide">
              Custom
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {layout.rows} rows × {layout.columns} columns —{" "}
          <strong className="text-foreground/80 font-medium">
            {layout.totalSeats} seats
          </strong>
        </p>
      </div>
    </button>
  );
}
