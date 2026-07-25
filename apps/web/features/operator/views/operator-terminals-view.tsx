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
import { useTranslations } from "next-intl";

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
  const t = useTranslations("operatorDashboard.terminals");
  const tc = useTranslations("common");

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
      toast.success(t("toast.locationUpdated", { type: !currentVal ? "Passenger Terminal" : "Depot / Operations" }));
    } catch (err: any) {
      toast.error(err.message || t("toast.updateFailed"));
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!locationToDelete) return;
    try {
      await deleteMutation.mutateAsync({ id: locationToDelete.id });
      toast.success(t("toast.locationDeleted"));
      setDeleteConfirmOpen(false);
      setLocationToDelete(null);
    } catch (err: any) {
      toast.error(err.message || t("toast.deleteFailed"));
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("pageTitle")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("pageDescription")}
          </p>
        </div>
        <Button onClick={handleAddNew} className="shrink-0">
          <Plus className="mr-2 size-4" />
          {t("addLocation")}
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label={t("kpi.totalLocations")} value={stats.total} icon={Building} />
        <StatCard label={t("kpi.passengerTerminals")} value={stats.terminals} icon={MapPin} />
        <StatCard label={t("kpi.depotsOffices")} value={stats.depots} icon={Navigation} />
        <StatCard label={t("kpi.activeSites")} value={stats.active} icon={CheckCircle} />
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
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
              {type === "ALL" ? t("allLocations") : type === "TERMINAL" ? t("terminals") : t("depots")}
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
            <DialogTitle>{t("deleteLocation")}</DialogTitle>
            <DialogDescription>
              {t("deleteConfirm", { name: locationToDelete?.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              {tc("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              {t("deleteLocation")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
