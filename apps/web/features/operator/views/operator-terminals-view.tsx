"use client";

import { useState, useMemo } from "react";
import {
  useSuspenseQueries,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useQueryState, parseAsString, parseAsBoolean } from "nuqs";
import { Plus, Search, Building, MapPin, CheckCircle, Navigation } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@moja/ui/components/ui/dialog";
import { useTRPC } from "@/trpc/client";
import { TerminalsTable } from "@/features/operator/components/terminals/terminals-table";
import { TerminalEditorSheet } from "@/features/operator/components/terminals/terminal-editor-sheet";
import { StatCard } from "@/features/operator/components/stat-card";

export function OperatorTerminalsView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [{ data: locations }, { data: cities }] = useSuspenseQueries({
    queries: [
      trpc.terminals.list.queryOptions(),
      trpc.routes.getCities.queryOptions(),
    ],
  });

  const [search, setSearch] = useQueryState("search", parseAsString.withDefault(""));
  const [typeFilter, setTypeFilter] = useQueryState("typeFilter", parseAsString.withDefault("ALL"));
  const [drawerOpen, setDrawerOpen] = useQueryState("drawer", parseAsBoolean.withDefault(false));

  const [editingLocation, setEditingLocation] = useState<any>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<any>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

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

  const filteredLocations = useMemo(() => {
    if (!locations) return [];
    return locations.filter((loc: any) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        loc.name.toLowerCase().includes(q) ||
        loc.addressLine1.toLowerCase().includes(q) ||
        (loc.cityRelation?.name && loc.cityRelation.name.toLowerCase().includes(q));

      const matchesType =
        typeFilter === "ALL" ||
        (typeFilter === "TERMINAL" && loc.isTerminal) ||
        (typeFilter === "DEPOT" && !loc.isTerminal);

      return matchesSearch && matchesType;
    });
  }, [locations, search, typeFilter]);

  const stats = useMemo(() => {
    const list = locations ?? [];
    return {
      total: list.length,
      terminals: list.filter((l: any) => l.isTerminal).length,
      depots: list.filter((l: any) => !l.isTerminal).length,
      active: list.filter((l: any) => l.isActive).length,
    };
  }, [locations]);

  const handleEdit = (loc: any) => {
    setEditingLocation(loc);
    setDrawerOpen(true);
  };

  const handleAddNew = () => {
    setEditingLocation(null);
    setDrawerOpen(true);
  };

  const handleToggleTerminal = async (loc: any, currentVal: boolean) => {
    setTogglingId(loc.id);
    try {
      await updateMutation.mutateAsync({
        id: loc.id,
        data: { isTerminal: !currentVal },
      });
      toast.success(
        `Location updated to ${!currentVal ? "Passenger Terminal" : "Depot / Operations"}`,
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to update terminal status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!locationToDelete) return;
    try {
      await deleteMutation.mutateAsync({ id: locationToDelete.id });
      toast.success("Location deleted successfully");
      setDeleteConfirmOpen(false);
      setLocationToDelete(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete location");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Terminals & Locations
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage passenger terminals, regional depots, operating hours, and location hubs.
          </p>
        </div>
        <Button onClick={handleAddNew} className="shrink-0">
          <Plus className="mr-2 size-4" />
          Add Location
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Locations" value={stats.total} icon={Building} />
        <StatCard label="Passenger Terminals" value={stats.terminals} icon={MapPin} />
        <StatCard label="Depots / Offices" value={stats.depots} icon={Navigation} />
        <StatCard label="Active Sites" value={stats.active} icon={CheckCircle} />
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search location name or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "TERMINAL", "DEPOT"].map((type) => (
            <Button
              key={type}
              variant={typeFilter === type ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter(type)}
              className="text-xs uppercase tracking-wider font-semibold"
            >
              {type === "ALL" ? "All Locations" : type === "TERMINAL" ? "Terminals" : "Depots"}
            </Button>
          ))}
        </div>
      </div>

      <TerminalsTable
        locations={filteredLocations}
        onEdit={handleEdit}
        onToggleTerminal={handleToggleTerminal}
        onDelete={(loc) => {
          setLocationToDelete(loc);
          setDeleteConfirmOpen(true);
        }}
        togglingId={togglingId}
      />

      <TerminalEditorSheet
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingLocation(null);
        }}
        editingLocation={editingLocation}
        cities={cities ?? []}
      />

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Location</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold text-foreground">{locationToDelete?.name}</span>? This action cannot be undone if no active routes depend on it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete Location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
