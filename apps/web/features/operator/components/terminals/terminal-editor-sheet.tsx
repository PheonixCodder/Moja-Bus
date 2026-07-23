"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MapPin, Building, Shield, User, Phone, CheckCircle, Navigation } from "lucide-react";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import { Switch } from "@moja/ui/components/ui/switch";
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
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@moja/ui/components/ui/combobox";
import { useTRPC } from "@/trpc/client";

const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const DEFAULT_OPERATING_HOURS = DAYS_OF_WEEK.reduce((acc, day) => {
  acc[day] = { open: "06:00", close: "20:00", closed: false };
  return acc;
}, {} as Record<string, { open: string; close: string; closed: boolean }>);

interface TerminalEditorSheetProps {
  isOpen: boolean;
  onClose: () => void;
  editingLocation?: any;
  cities?: any[];
}

export function TerminalEditorSheet({
  isOpen,
  onClose,
  editingLocation,
  cities = [],
}: TerminalEditorSheetProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const createMutation = useMutation(
    trpc.terminals.create.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries(trpc.terminals.list.pathFilter()),
    }),
  );
  const updateMutation = useMutation(
    trpc.terminals.update.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries(trpc.terminals.list.pathFilter()),
    }),
  );

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Form inputs
  const [name, setName] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState("");
  const [cityId, setCityId] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [isTerminal, setIsTerminal] = useState(false);
  const [isPrimary, setIsPrimary] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [managerName, setManagerName] = useState("");
  const [managerPhone, setManagerPhone] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [operatingHours, setOperatingHours] = useState(DEFAULT_OPERATING_HOURS);

  useEffect(() => {
    if (editingLocation) {
      setName(editingLocation.name ?? "");
      setAddressLine1(editingLocation.addressLine1 ?? "");
      setAddressLine2(editingLocation.addressLine2 ?? "");
      setStateValue(editingLocation.state ?? "");
      setPostalCode(editingLocation.postalCode ?? "");
      setPhone(editingLocation.phone ?? "");
      setCityId(editingLocation.cityId ?? "");
      setLatitude(editingLocation.latitude ? String(editingLocation.latitude) : "");
      setLongitude(editingLocation.longitude ? String(editingLocation.longitude) : "");
      setIsTerminal(editingLocation.isTerminal ?? false);
      setIsPrimary(editingLocation.isPrimary ?? false);
      setIsActive(editingLocation.isActive ?? true);
      setManagerName(editingLocation.managerName ?? "");
      setManagerPhone(editingLocation.managerPhone ?? "");
      setManagerEmail(editingLocation.managerEmail ?? "");
      setOperatingHours(
        editingLocation.operatingHours
          ? typeof editingLocation.operatingHours === "string"
            ? JSON.parse(editingLocation.operatingHours)
            : editingLocation.operatingHours
          : DEFAULT_OPERATING_HOURS
      );
      setFormErrors({});
      setIsDirty(false);
    } else {
      setName("");
      setAddressLine1("");
      setAddressLine2("");
      setStateValue("");
      setPostalCode("");
      setPhone("");
      setCityId("");
      setLatitude("");
      setLongitude("");
      setIsTerminal(false);
      setIsPrimary(false);
      setIsActive(true);
      setManagerName("");
      setManagerPhone("");
      setManagerEmail("");
      setOperatingHours(DEFAULT_OPERATING_HOURS);
      setFormErrors({});
      setIsDirty(false);
    }
  }, [editingLocation, isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});

    const errors: Record<string, string> = {};
    if (!name.trim()) errors["name"] = "Name is required";
    if (!addressLine1.trim()) errors["addressLine1"] = "Address line 1 is required";
    if (!phone.trim()) errors["phone"] = "Phone number is required";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setSubmitting(false);
      return;
    }

    try {
      const payload: any = {
        name: name.trim(),
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim() || undefined,
        state: stateValue.trim() || undefined,
        postalCode: postalCode.trim() || undefined,
        phone: phone.trim(),
        cityId: cityId || undefined,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        isTerminal,
        isPrimary,
        isActive,
        managerName: managerName.trim() || undefined,
        managerPhone: managerPhone.trim() || undefined,
        managerEmail: managerEmail.trim() || undefined,
        operatingHours,
      };

      if (editingLocation) {
        await updateMutation.mutateAsync({
          id: editingLocation.id,
          data: payload,
        });
        toast.success("Location updated successfully");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Location created successfully");
      }
      setIsDirty(false);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to save location");
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
              <MapPin className="size-5 text-primary" />
              {editingLocation ? "Edit Location" : "Add Location"}
            </DrawerTitle>
            <DrawerDescription>
              Configure passenger terminal or depot properties, manager contacts, and operating hours.
            </DrawerDescription>
          </DrawerHeader>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider">
                  Location Name *
                </Label>
                <Input
                  id="name"
                  placeholder="e.g. Abidjan Central Terminal"
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

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wider">
                  Contact Phone *
                </Label>
                <Input
                  id="phone"
                  placeholder="e.g. +225 07 00 00 00 00"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setIsDirty(true);
                  }}
                  className={formErrors["phone"] ? "border-destructive" : ""}
                />
                {formErrors["phone"] && (
                  <p className="text-xs text-destructive">{formErrors["phone"]}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="addressLine1" className="text-xs font-semibold uppercase tracking-wider">
                  Address Line 1 *
                </Label>
                <Input
                  id="addressLine1"
                  placeholder="Street address or location details"
                  value={addressLine1}
                  onChange={(e) => {
                    setAddressLine1(e.target.value);
                    setIsDirty(true);
                  }}
                  className={formErrors["addressLine1"] ? "border-destructive" : ""}
                />
                {formErrors["addressLine1"] && (
                  <p className="text-xs text-destructive">{formErrors["addressLine1"]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cityId" className="text-xs font-semibold uppercase tracking-wider">
                  City
                </Label>
                <select
                  id="cityId"
                  value={cityId}
                  onChange={(e) => {
                    setCityId(e.target.value);
                    setIsDirty(true);
                  }}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select city...</option>
                  {cities.map((city: any) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude" className="text-xs font-semibold uppercase tracking-wider">
                  Latitude
                </Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  placeholder="e.g. 5.359952"
                  value={latitude}
                  onChange={(e) => {
                    setLatitude(e.target.value);
                    setIsDirty(true);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="longitude" className="text-xs font-semibold uppercase tracking-wider">
                  Longitude
                </Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  placeholder="e.g. -4.008256"
                  value={longitude}
                  onChange={(e) => {
                    setLongitude(e.target.value);
                    setIsDirty(true);
                  }}
                />
              </div>
            </div>

            <div className="rounded-lg border border-border p-4 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Location Role & Status
              </h4>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Passenger Terminal</Label>
                  <p className="text-xs text-muted-foreground">
                    Mark as a bookable passenger terminal for departure and arrival routes.
                  </p>
                </div>
                <Switch
                  checked={isTerminal}
                  onCheckedChange={(v) => {
                    setIsTerminal(v);
                    setIsDirty(true);
                  }}
                />
              </div>

              <div className="flex items-center justify-between border-t border-border pt-3">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Primary Hub</Label>
                  <p className="text-xs text-muted-foreground">
                    Set as company primary operational headquarters.
                  </p>
                </div>
                <Switch
                  checked={isPrimary}
                  onCheckedChange={(v) => {
                    setIsPrimary(v);
                    setIsDirty(true);
                  }}
                />
              </div>

              <div className="flex items-center justify-between border-t border-border pt-3">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Active Status</Label>
                  <p className="text-xs text-muted-foreground">
                    Enable or disable operations at this location.
                  </p>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={(v) => {
                    setIsActive(v);
                    setIsDirty(true);
                  }}
                />
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
                {editingLocation ? "Save Changes" : "Create Location"}
              </Button>
            </DrawerFooter>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
