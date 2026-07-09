"use client";

import { useEffect, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import { Checkbox } from "@moja/ui/components/ui/checkbox";
import { PhoneInput } from "@moja/ui/components/ui/phone-input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@moja/ui/components/ui/card";
import { Plus, Trash2, MapPin, Phone, User, Clock, Flag } from "lucide-react";
import { type LocationsStepInput } from "@moja/schemas";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@moja/ui/components/ui/combobox";

interface LocationsStepProps {
  initialData?: any;
  onSave: (data: LocationsStepInput) => Promise<boolean>;
  onBack: () => void;
  isSaving: boolean;
}

type LocationItem = {
  id: string;
  name: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  cityId: string;
  state: string;
  postalCode: string;
  country: string;
  latitude: string;
  longitude: string;
  phone: string;
  managerName: string;
  managerPhone: string;
  managerEmail: string;
  isPrimary: boolean;
  operatingHours: string;
  isActive: boolean;
};

export function LocationsStep({
  initialData,
  onSave,
  onBack,
  isSaving,
}: LocationsStepProps) {
  const trpc = useTRPC();
  const { data: cities } = useSuspenseQuery(
    trpc.routes.getCities.queryOptions(),
  );
  const [locations, setLocations] = useState<LocationItem[]>([
    {
      id: crypto.randomUUID(),
      name: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      cityId: "",
      state: "",
      postalCode: "",
      country: "Cote d'Ivoire",
      latitude: "",
      longitude: "",
      phone: "",
      managerName: "",
      managerPhone: "",
      managerEmail: "",
      isPrimary: true,
      operatingHours: "08:00-18:00",
      isActive: true,
    },
  ]);

  // Pre-fill form if initialData exists
  useEffect(() => {
    if (
      initialData?.company?.locations &&
      initialData.company.locations.length > 0
    ) {
      const mapped = initialData.company.locations.map((loc: any) => ({
        id: loc.id || crypto.randomUUID(),
        name: loc.name || "",
        addressLine1: loc.addressLine1 || "",
        addressLine2: loc.addressLine2 || "",
        city: loc.city || "",
        cityId: loc.cityId || "",
        state: loc.state || "",
        postalCode: loc.postalCode || "",
        country: loc.country || "Cote d'Ivoire",
        latitude: loc.latitude ? String(loc.latitude) : "",
        longitude: loc.longitude ? String(loc.longitude) : "",
        phone: loc.phone || "",
        managerName: loc.managerName || "",
        managerPhone: loc.managerPhone || "",
        managerEmail: loc.managerEmail || "",
        isPrimary: loc.isPrimary || false,
        operatingHours: loc.operatingHours?.hours || "08:00-18:00",
        isActive: loc.isActive !== undefined ? loc.isActive : true,
      }));
      setLocations(mapped);
    }
  }, [initialData]);

  const addLocation = () => {
    setLocations([
      ...locations,
      {
        id: crypto.randomUUID(),
        name: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        cityId: "",
        state: "",
        postalCode: "",
        country: "Cote d'Ivoire",
        latitude: "",
        longitude: "",
        phone: "",
        managerName: "",
        managerPhone: "",
        managerEmail: "",
        isPrimary: false,
        operatingHours: "08:00-18:00",
        isActive: true,
      },
    ]);
  };

  const removeLocation = (id: string) => {
    if (locations.length <= 1) {
      return;
    }
    const updated = locations.filter((loc) => loc.id !== id);
    // If we removed the primary, set the first remaining one as primary
    const firstItem = updated[0];
    if (firstItem && locations.find((loc) => loc.id === id)?.isPrimary) {
      firstItem.isPrimary = true;
    }
    setLocations(updated);
  };

  const updateLocationField = (
    id: string,
    field: keyof LocationItem,
    value: any,
  ) => {
    setLocations((prev) =>
      prev.map((loc) => {
        if (loc.id === id) {
          const nextLoc = { ...loc, [field]: value };
          if (field === "isPrimary" && value === true) {
            nextLoc.isPrimary = true;
          }
          return nextLoc;
        }
        // If another location was marked primary and this is marked primary, uncheck others
        if (field === "isPrimary" && value === true) {
          return { ...loc, isPrimary: false };
        }
        return loc;
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const incomplete = locations.some(
      (loc) => !loc.name || !loc.addressLine1 || !loc.city || !loc.phone,
    );
    if (incomplete) {
      return;
    }

    const payload: LocationsStepInput = {
      locations: locations.map((loc) => ({
        name: loc.name,
        addressLine1: loc.addressLine1,
        addressLine2: loc.addressLine2 || null,
        city: loc.city,
        cityId: loc.cityId || null,
        state: loc.state || null,
        postalCode: loc.postalCode || null,
        country: loc.country,
        latitude: loc.latitude ? Number(loc.latitude) : null,
        longitude: loc.longitude ? Number(loc.longitude) : null,
        phone: loc.phone,
        managerName: loc.managerName || null,
        managerPhone: loc.managerPhone || null,
        managerEmail: loc.managerEmail || null,
        isPrimary: loc.isPrimary,
        operatingHours: loc.operatingHours || null,
        isActive: loc.isActive,
      })),
    };

    await onSave(payload);
  };

  const canContinue = locations.every(
    (loc) => loc.name && loc.addressLine1 && loc.city && loc.phone,
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border-border rounded-md shadow-sm">
        <CardHeader className="border-b border-border pb-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">
                Depots & Stations
              </CardTitle>
              <CardDescription>
                Add the physical locations or bus terminals where your
                operations are based.
              </CardDescription>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addLocation}
            className="border-border text-xs rounded-md flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add Terminal
          </Button>
        </CardHeader>
        <CardContent className="pt-6 space-y-8">
          {locations.map((location, index) => (
            <div
              key={location.id}
              className={`p-4 border rounded-md relative ${
                location.isPrimary
                  ? "border-primary bg-primary/5"
                  : "border-border"
              }`}
            >
              {/* Header inside depot card */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">
                    Terminal #{index + 1}
                  </span>
                  {location.isPrimary && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/15 px-2 py-0.5 rounded">
                      <Flag className="w-3 h-3" /> Primary Depot
                    </span>
                  )}
                </div>

                {locations.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLocation(location.id)}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive rounded-md w-8 h-8"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Terminal Form Grid */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Terminal/Depot Name *
                    </Label>
                    <Input
                      value={location.name}
                      onChange={(e) =>
                        updateLocationField(location.id, "name", e.target.value)
                      }
                      placeholder="e.g. Gare Routière de Yopougon"
                      required
                      className="rounded-md border-border focus-visible:ring-primary focus-visible:border-primary"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Terminal Phone Number *
                    </Label>
                    <PhoneInput
                      value={location.phone}
                      onChange={(val: string | undefined) =>
                        updateLocationField(location.id, "phone", val || "")
                      }
                      placeholder="e.g. +225 07 00 00 00 00"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Address Line 1 *
                    </Label>
                    <Input
                      value={location.addressLine1}
                      onChange={(e) =>
                        updateLocationField(
                          location.id,
                          "addressLine1",
                          e.target.value,
                        )
                      }
                      placeholder="e.g. Boulevard principal, face à la mairie"
                      required
                      className="rounded-md border-border focus-visible:ring-primary focus-visible:border-primary"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      City *
                    </Label>
                    <Combobox
                      items={cities.map((c) => ({
                        value: c.id,
                        label: c.name,
                      }))}
                      value={location.cityId}
                      onValueChange={(val) => {
                        const cityName =
                          cities.find((c) => c.id === val)?.name || "";
                        updateLocationField(location.id, "cityId", val || "");
                        updateLocationField(location.id, "city", cityName);
                      }}
                    >
                      <ComboboxInput
                        placeholder="Select CI City…"
                        className="w-full text-sm"
                        value={location.city || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLocations((prev) => prev.map((loc) => {
                            if (loc.id !== location.id) return loc;
                            return { ...loc, city: val, cityId: "" };
                          }));
                        }}
                      />
                      <ComboboxContent>
                        <ComboboxEmpty>No city found.</ComboboxEmpty>
                        <ComboboxList>
                          {cities.map((c) => (
                            <ComboboxItem key={c.id} value={c.id}>
                              {c.name}
                            </ComboboxItem>
                          ))}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      State / District
                    </Label>
                    <Input
                      value={location.state}
                      onChange={(e) =>
                        updateLocationField(
                          location.id,
                          "state",
                          e.target.value,
                        )
                      }
                      placeholder="e.g. Lagunes"
                      className="rounded-md border-border focus-visible:ring-primary focus-visible:border-primary"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Operating Hours
                    </Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={location.operatingHours}
                        onChange={(e) =>
                          updateLocationField(
                            location.id,
                            "operatingHours",
                            e.target.value,
                          )
                        }
                        placeholder="e.g. 08:00-18:00"
                        className="pl-10 rounded-md border-border focus-visible:ring-primary focus-visible:border-primary"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <Checkbox
                      id={`primary-${location.id}`}
                      checked={location.isPrimary}
                      onCheckedChange={(checked) =>
                        updateLocationField(location.id, "isPrimary", !!checked)
                      }
                      disabled={location.isPrimary && locations.length === 1}
                    />
                    <Label
                      htmlFor={`primary-${location.id}`}
                      className="text-xs font-bold uppercase tracking-wider text-foreground cursor-pointer"
                    >
                      Set as Primary Location
                    </Label>
                  </div>
                </div>

                {/* Manager details */}
                <div className="pt-2 border-t border-border mt-4">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                    Station Manager Contacts
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Manager Name
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          value={location.managerName}
                          onChange={(e) =>
                            updateLocationField(
                              location.id,
                              "managerName",
                              e.target.value,
                            )
                          }
                          placeholder="e.g. Jean Kouassi"
                          className="pl-10 rounded-md border-border focus-visible:ring-primary focus-visible:border-primary"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Manager Phone
                      </Label>
                      <PhoneInput
                        value={location.managerPhone}
                        onChange={(val: string | undefined) =>
                          updateLocationField(
                            location.id,
                            "managerPhone",
                            val || "",
                          )
                        }
                        placeholder="Manager phone"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Manager Email
                      </Label>
                      <Input
                        type="email"
                        value={location.managerEmail}
                        onChange={(e) =>
                          updateLocationField(
                            location.id,
                            "managerEmail",
                            e.target.value,
                          )
                        }
                        placeholder="e.g. manager@company.com"
                        className="rounded-md border-border focus-visible:ring-primary focus-visible:border-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Sticky Bottom Action Bar container placeholder */}
      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isSaving}
          className="border-border hover:bg-slate-100 rounded-md px-6 py-2"
        >
          Back
        </Button>
        <Button
          type="submit"
          disabled={isSaving || !canContinue}
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-md px-6 py-2"
        >
          {isSaving ? "Saving..." : "Save & Continue"}
        </Button>
      </div>
    </form>
  );
}
