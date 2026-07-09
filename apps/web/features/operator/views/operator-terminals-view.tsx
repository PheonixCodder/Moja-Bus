"use client";

import { useCallback, useEffect, useState } from "react";
import {
  useSuspenseQuery,
  useMutation,
  useQueryClient,
  useQuery,
} from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import {
  MapPin,
  Plus,
  Search,
  Pencil,
  Trash2,
  RefreshCw,
  Building,
  Navigation,
  CheckCircle,
  Phone,
  User,
  Shield,
  Layers,
  Map,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@moja/ui/lib/utils";

import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Card, CardContent } from "@moja/ui/components/ui/card";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { Label } from "@moja/ui/components/ui/label";
import { Switch } from "@moja/ui/components/ui/switch";
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

export function OperatorTerminalsView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Data queries
  const { data: locations } = useSuspenseQuery(
    trpc.terminals.list.queryOptions(),
  );
  const { data: cities } = useSuspenseQuery(
    trpc.routes.getCities.queryOptions(),
  );

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  // Mutations
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
  const deleteMutation = useMutation(
    trpc.terminals.delete.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries(trpc.terminals.list.pathFilter()),
    }),
  );

  // Form State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<any>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Form inputs
  const [name, setName] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
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

  // Delete State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  // Open add drawer automatically if query param action=new is present
  useEffect(() => {
    if (searchParams.get("action") === "new") {
      resetForm();
      setDrawerOpen(true);
      router.replace(window.location.pathname);
    }
  }, [searchParams, router]);

  const resetForm = () => {
    setName("");
    setAddressLine1("");
    setAddressLine2("");
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
    setEditingLocation(null);
  };

  const handleEditClick = (loc: any) => {
    setEditingLocation(loc);
    setName(loc.name);
    setAddressLine1(loc.addressLine1);
    setAddressLine2(loc.addressLine2 ?? "");
    setPhone(loc.phone);
    setCityId(loc.cityId ?? "");
    setLatitude(loc.latitude ? String(loc.latitude) : "");
    setLongitude(loc.longitude ? String(loc.longitude) : "");
    setIsTerminal(loc.isTerminal);
    setIsPrimary(loc.isPrimary);
    setIsActive(loc.isActive);
    setManagerName(loc.managerName ?? "");
    setManagerPhone(loc.managerPhone ?? "");
    setManagerEmail(loc.managerEmail ?? "");
    setOperatingHours(
      loc.operatingHours
        ? (typeof loc.operatingHours === "string"
            ? JSON.parse(loc.operatingHours)
            : loc.operatingHours)
        : DEFAULT_OPERATING_HOURS
    );
    setFormErrors({});
    setDrawerOpen(true);
  };

  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleToggleTerminal = async (loc: any, currentVal: boolean) => {
    setTogglingId(loc.id);
    try {
      await updateMutation.mutateAsync({
        id: loc.id,
        data: { isTerminal: !currentVal },
      });
      toast.success(
        `Location successfully ${!currentVal ? "promoted to Passenger Terminal" : "converted back to Depot"}`,
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle terminal status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});

    const errors: Record<string, string> = {};
    if (!name.trim()) errors["name"] = "Name is required";
    if (!addressLine1.trim())
      errors["addressLine1"] = "Address line 1 is required";
    if (!phone.trim()) errors["phone"] = "Phone number is required";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setSubmitting(false);
      return;
    }

    const payload = {
      name,
      addressLine1,
      addressLine2: addressLine2.trim() || null,
      phone,
      cityId: cityId || null,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      isTerminal,
      isPrimary,
      isActive,
      managerName: managerName.trim() || null,
      managerPhone: managerPhone.trim() || null,
      managerEmail: managerEmail.trim() || null,
      operatingHours,
    };

    try {
      if (editingLocation) {
        await updateMutation.mutateAsync({
          id: editingLocation.id,
          data: payload,
        });
        toast.success("Location updated successfully");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Location added successfully");
      }
      setDrawerOpen(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.message || "Failed to save location");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (loc: any) => {
    setLocationToDelete(loc);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!locationToDelete) return;
    setDeleting(true);
    try {
      await deleteMutation.mutateAsync({ id: locationToDelete.id });
      toast.success("Location deleted successfully");
      setDeleteConfirmOpen(false);
      setLocationToDelete(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete location");
    } finally {
      setDeleting(false);
    }
  };

  // Filter Locations
  const filteredLocations = locations.filter((loc) => {
    const query = search.toLowerCase();
    const matchesSearch =
      loc.name.toLowerCase().includes(query) ||
      loc.addressLine1.toLowerCase().includes(query) ||
      (loc.cityRelation?.name ?? loc.city ?? "").toLowerCase().includes(query);

    if (typeFilter === "TERMINAL") return matchesSearch && loc.isTerminal;
    if (typeFilter === "DEPOT") return matchesSearch && !loc.isTerminal;
    return matchesSearch;
  });

  // Calculate statistics
  const totalCount = locations.length;
  const terminalCount = locations.filter((l) => l.isTerminal).length;
  const primaryName =
    locations.find((l) => l.isPrimary)?.name || "Not Configured";
  const linkedToCityCount = locations.filter((l) => l.cityId).length;



  return (
    <div className="flex flex-col flex-1 min-h-0 bg-bg-base">
      {/* Top Header Panel */}
      <div className="border-b border-border bg-card px-6 py-5 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold font-display tracking-tight text-foreground flex items-center gap-2">
              <Map className="size-5.5 text-primary" />
              Terminal & Station Depot Management
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add and configure your bookable passenger stations, departure
              gates, and garages.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="h-8.5 text-xs font-semibold"
              onClick={() => {
                resetForm();
                setDrawerOpen(true);
              }}
            >
              <Plus className="size-4 mr-1.5" />
              Add Location
            </Button>
          </div>
        </div>

        {/* Stats segment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          <StatCard
            label="Total Locations"
            value={totalCount}
            icon={Building}
            iconClassName="bg-primary/5 text-primary"
            sub="Terminals and garages"
          />
          <StatCard
            label="Active Terminals"
            value={terminalCount}
            icon={CheckCircle}
            iconClassName="bg-emerald-500/10 text-emerald-500"
            sub="Bookable passenger stops"
          />
          <StatCard
            label="Linked to City"
            value={`${linkedToCityCount} / ${totalCount}`}
            icon={Navigation}
            iconClassName="bg-blue-500/10 text-blue-500"
            sub="Coordinates & maps ready"
          />
          <StatCard
            label="Primary Location"
            value={primaryName === "Not Configured" ? "None" : primaryName}
            icon={Shield}
            iconClassName="bg-amber-500/10 text-amber-500"
            sub="Default corporate depot"
          />
        </div>
      </div>

      {/* Main Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border bg-card px-6 py-3.5 gap-3.5 shrink-0">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by terminal name, address, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 shadow-none text-xs bg-bg-base border-border"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-semibold">
              Type:
            </span>
            <Combobox
              items={[
                { value: "ALL", label: "All Locations" },
                { value: "TERMINAL", label: "Passenger Terminals" },
                { value: "DEPOT", label: "Depots & Garages" },
              ]}
              value={typeFilter}
              onValueChange={(val) => setTypeFilter(val ?? "ALL")}
            >
              <ComboboxInput
                placeholder="All Types"
                className="w-[160px] h-8.5 text-xs bg-bg-base border-border"
                value={
                  typeFilter === "ALL"
                    ? "All Locations"
                    : typeFilter === "TERMINAL"
                      ? "Passenger Terminals"
                      : typeFilter === "DEPOT"
                        ? "Depots & Garages"
                        : ""
                }
              />
              <ComboboxContent>
                <ComboboxEmpty>No location type found.</ComboboxEmpty>
                <ComboboxList>
                  <ComboboxItem value="ALL">All Locations</ComboboxItem>
                  <ComboboxItem value="TERMINAL">
                    Passenger Terminals
                  </ComboboxItem>
                  <ComboboxItem value="DEPOT">Depots & Garages</ComboboxItem>
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
        </div>
      </div>

      {/* Locations Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredLocations.length === 0 ? (
          <Empty className="py-16">
            <EmptyMedia>
              <MapPin className="size-12 text-muted-foreground/30" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No locations found</EmptyTitle>
              <EmptyDescription>
                {search || typeFilter !== "ALL"
                  ? "No locations match your search criteria. Try modifying your filters."
                  : "Add your first operating terminal or station depot to get started."}
              </EmptyDescription>
            </EmptyHeader>
            {!search && typeFilter === "ALL" && (
              <EmptyContent>
                <Button
                  size="sm"
                  onClick={() => {
                    resetForm();
                    setDrawerOpen(true);
                  }}
                >
                  <Plus className="size-4 mr-1.5" />
                  Add First Location
                </Button>
              </EmptyContent>
            )}
          </Empty>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLocations.map((loc) => (
              <Card
                key={loc.id}
                className="group border-border bg-card shadow-none hover:border-primary/30 hover:shadow-sm transition-all duration-200"
              >
                <CardContent className="p-4.5 space-y-4">
                  {/* Top Row: Name + Terminal Pill */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/15 mt-0.5">
                        <MapPin className="size-4.5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground tracking-tight truncate">
                          {loc.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {loc.addressLine1}
                          {loc.addressLine2 ? `, ${loc.addressLine2}` : ""}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Attributes Section */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded bg-muted/40 px-2.5 py-1.5">
                      <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">
                        City / Region
                      </p>
                      <p className="text-xs font-semibold text-foreground/90 truncate mt-0.5">
                        {loc.cityRelation?.name ?? loc.city ?? "Unlinked Depot"}
                      </p>
                    </div>
                    <div className="rounded bg-muted/40 px-2.5 py-1.5">
                      <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">
                        Contact Phone
                      </p>
                      <p className="text-xs font-mono font-semibold text-foreground/90 truncate mt-0.5">
                        {loc.phone}
                      </p>
                    </div>
                  </div>

                  {/* Promotion & Status Indicators */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                    {/* Primary Badge */}
                    {loc.isPrimary && (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                        Primary Depot
                      </span>
                    )}

                    {/* Mode Pill Toggle button */}
                    <button
                      onClick={() => handleToggleTerminal(loc, loc.isTerminal)}
                      disabled={togglingId === loc.id}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded border px-2.5 py-0.5 text-[10px] font-bold transition-all duration-150 cursor-pointer",
                        loc.isTerminal
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100",
                        togglingId === loc.id && "opacity-50 cursor-not-allowed",
                      )}
                    >
                      {togglingId === loc.id ? (
                        <Spinner className="size-2.5" />
                      ) : (
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            loc.isTerminal
                              ? "bg-emerald-500 animate-pulse"
                              : "bg-slate-400",
                          )}
                        />
                      )}
                      {loc.isTerminal
                        ? "Passenger Terminal"
                        : "Promote to Terminal"}
                    </button>

                    {/* Active State Indicator */}
                    {!loc.isActive && (
                      <span className="inline-flex items-center gap-1 rounded bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                        Disabled
                      </span>
                    )}
                  </div>

                  {/* Card Actions Drawer */}
                  <div className="flex items-center justify-between pt-1 border-t border-border/60 -mx-4 px-4 pt-3 mt-1.5">
                    <span className="text-[10px] text-muted-foreground font-medium">
                      ID:{" "}
                      <span className="font-mono">{loc.id.slice(0, 8)}</span>
                    </span>

                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted font-bold"
                        onClick={() => handleEditClick(loc)}
                      >
                        <Pencil className="size-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                        onClick={() => handleDeleteClick(loc)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Drawer: Add/Edit Form */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="max-h-[92vh] flex flex-col">
          <DrawerHeader className="border-b border-border py-4 shrink-0">
            <DrawerTitle className="text-base font-bold tracking-tight">
              {editingLocation
                ? `Edit Location: ${editingLocation.name}`
                : "Create New Location Depot"}
            </DrawerTitle>
            <DrawerDescription className="text-xs">
              Add address details, link terminal stops to canonical cities, and
              configure passenger permissions.
            </DrawerDescription>
          </DrawerHeader>

          <form
            onSubmit={handleSave}
            className="flex-1 overflow-y-auto p-6 space-y-5 min-h-0"
          >
            {/* Location Info */}
            <div className="space-y-3.5">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border/60 pb-1">
                Location Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-semibold">
                    Depot/Terminal Name{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Yopougon Station Nord"
                    className={cn(
                      "h-9 text-xs shadow-none border-border",
                      formErrors["name"] &&
                        "border-destructive focus-visible:ring-destructive",
                    )}
                  />
                  {formErrors["name"] && (
                    <p className="text-[10px] font-medium text-destructive">
                      {formErrors["name"]}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-semibold">
                    Contact Phone Number{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +225 07000000"
                    className={cn(
                      "h-9 text-xs shadow-none border-border",
                      formErrors["phone"] &&
                        "border-destructive focus-visible:ring-destructive",
                    )}
                  />
                  {formErrors["phone"] && (
                    <p className="text-[10px] font-medium text-destructive">
                      {formErrors["phone"]}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="addressLine1" className="text-xs font-semibold">
                  Street Address Line 1{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="addressLine1"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="e.g. Boulevard principal face à la gare"
                  className={cn(
                    "h-9 text-xs shadow-none border-border",
                    formErrors["addressLine1"] &&
                      "border-destructive focus-visible:ring-destructive",
                  )}
                />
                {formErrors["addressLine1"] && (
                  <p className="text-[10px] font-medium text-destructive">
                    {formErrors["addressLine1"]}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="addressLine2" className="text-xs font-semibold">
                  Street Address Line 2 (Optional)
                </Label>
                <Input
                  id="addressLine2"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="e.g. Bureau B-14, 2ème étage"
                  className="h-9 text-xs shadow-none border-border"
                />
              </div>
            </div>

            {/* City Link */}
            <div className="space-y-3.5 pt-1">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border/60 pb-1">
                Canonical City Association
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5 sm:col-span-1">
                  <Label htmlFor="cityId" className="text-xs font-semibold">
                    Linked City
                  </Label>
                  <Combobox
                    items={cities.map((city) => ({
                      value: city.id,
                      label: city.name,
                    }))}
                    value={cityId}
                    onValueChange={(val) => setCityId(val ?? "")}
                  >
                    <ComboboxInput
                      placeholder="Select CI City"
                      className="w-full text-xs h-9"
                      value={
                        cityId
                          ? cities.find((city) => city.id === cityId)?.name ||
                            ""
                          : ""
                      }
                    />
                    <ComboboxContent>
                      <ComboboxEmpty>No city found.</ComboboxEmpty>
                      <ComboboxList>
                        {cities.map((city) => (
                          <ComboboxItem key={city.id} value={city.id}>
                            {city.name}
                          </ComboboxItem>
                        ))}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                  <p className="text-[10px] text-muted-foreground">
                    Required to make this terminal discoverable in route plans.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="latitude" className="text-xs font-semibold">
                    Latitude Coordinates (Optional)
                  </Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="e.g. 5.3600"
                    className="h-9 text-xs shadow-none border-border"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="longitude" className="text-xs font-semibold">
                    Longitude Coordinates (Optional)
                  </Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="e.g. -4.0083"
                    className="h-9 text-xs shadow-none border-border"
                  />
                </div>
              </div>
            </div>

            {/* Settings toggles */}
            <div className="space-y-3.5 pt-1">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border/60 pb-1">
                Depot Settings & Promotion
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-1">
                <div className="flex items-center justify-between rounded-md border border-border bg-muted/20 p-3">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="isTerminal-toggle"
                      className="text-xs font-semibold text-foreground"
                    >
                      Passenger Terminal
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                      Enable ticket booking stops
                    </p>
                  </div>
                  <Switch
                    id="isTerminal-toggle"
                    checked={isTerminal}
                    onCheckedChange={setIsTerminal}
                  />
                </div>

                <div className="flex items-center justify-between rounded-md border border-border bg-muted/20 p-3">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="isPrimary-toggle"
                      className="text-xs font-semibold text-foreground"
                    >
                      Primary Depot
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                      Main company headquarters
                    </p>
                  </div>
                  <Switch
                    id="isPrimary-toggle"
                    checked={isPrimary}
                    onCheckedChange={setIsPrimary}
                  />
                </div>

                <div className="flex items-center justify-between rounded-md border border-border bg-muted/20 p-3">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="isActive-toggle"
                      className="text-xs font-semibold text-foreground"
                    >
                      Status Active
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                      Allow active operations
                    </p>
                  </div>
                  <Switch
                    id="isActive-toggle"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                </div>
              </div>
            </div>

            {/* Operating Hours */}
            <div className="space-y-3.5 pt-1">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border/60 pb-1">
                Operating Hours
              </h3>
              <div className="space-y-2">
                {DAYS_OF_WEEK.map((day) => (
                  <div
                    key={day}
                    className="flex items-center gap-4 rounded-md border border-border bg-card p-3"
                  >
                    <div className="w-24 shrink-0">
                      <Label className="text-xs font-semibold capitalize text-foreground">
                        {day}
                      </Label>
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={operatingHours[day]?.open || ""}
                          onChange={(e) =>
                            setOperatingHours({
                              ...operatingHours,
                              [day]: { ...operatingHours[day], open: e.target.value },
                            })
                          }
                          disabled={operatingHours[day]?.closed}
                          className="h-8 w-28 text-xs shadow-none border-border"
                        />
                        <span className="text-muted-foreground text-xs font-medium">to</span>
                        <Input
                          type="time"
                          value={operatingHours[day]?.close || ""}
                          onChange={(e) =>
                            setOperatingHours({
                              ...operatingHours,
                              [day]: { ...operatingHours[day], close: e.target.value },
                            })
                          }
                          disabled={operatingHours[day]?.closed}
                          className="h-8 w-28 text-xs shadow-none border-border"
                        />
                      </div>
                      <div className="flex items-center gap-2 ml-auto">
                        <Switch
                          id={`closed-${day}`}
                          checked={operatingHours[day]?.closed || false}
                          onCheckedChange={(checked) =>
                            setOperatingHours({
                              ...operatingHours,
                              [day]: { ...operatingHours[day], closed: checked },
                            })
                          }
                        />
                        <Label
                          htmlFor={`closed-${day}`}
                          className="text-[10px] text-muted-foreground cursor-pointer"
                        >
                          Closed
                        </Label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Manager Contact */}
            <div className="space-y-3.5 pt-1">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border/60 pb-1">
                Station Manager Contact (Optional)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="managerName"
                    className="text-xs font-semibold"
                  >
                    Manager Full Name
                  </Label>
                  <Input
                    id="managerName"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    placeholder="e.g. Koffi Kouadio"
                    className="h-9 text-xs shadow-none border-border"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="managerPhone"
                    className="text-xs font-semibold"
                  >
                    Manager Phone
                  </Label>
                  <Input
                    id="managerPhone"
                    value={managerPhone}
                    onChange={(e) => setManagerPhone(e.target.value)}
                    placeholder="e.g. +225 05000000"
                    className="h-9 text-xs shadow-none border-border"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="managerEmail"
                    className="text-xs font-semibold"
                  >
                    Manager Email
                  </Label>
                  <Input
                    id="managerEmail"
                    type="email"
                    value={managerEmail}
                    onChange={(e) => setManagerEmail(e.target.value)}
                    placeholder="e.g. manager@moja.com"
                    className="h-9 text-xs shadow-none border-border"
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="hidden" />
          </form>

          <DrawerFooter className="border-t border-border py-4 shrink-0 flex-row justify-end gap-2 bg-card">
            <DrawerClose asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8.5 text-xs font-semibold"
              >
                Cancel
              </Button>
            </DrawerClose>
            <Button
              size="sm"
              disabled={submitting}
              className="h-8.5 text-xs font-semibold"
              onClick={handleSave}
            >
              {submitting && <Spinner className="size-3 mr-1.5" />}
              {editingLocation ? "Save Changes" : "Create Location"}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-foreground">
              Confirm Location Deletion
            </DialogTitle>
            <DialogDescription className="text-xs mt-1.5 leading-relaxed">
              Are you sure you want to permanently delete location{" "}
              <strong className="text-foreground">
                "{locationToDelete?.name}"
              </strong>
              ? This will remove all depot coordinates. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 mt-4">
            <Button
              size="sm"
              variant="outline"
              disabled={deleting}
              onClick={() => {
                setDeleteConfirmOpen(false);
                setLocationToDelete(null);
              }}
              className="h-8.5 text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={deleting}
              onClick={confirmDelete}
              className="h-8.5 text-xs font-semibold"
            >
              {deleting && <Spinner className="size-3 mr-1.5" />}
              Delete Location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
