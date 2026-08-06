"use client";

import { Button } from "@moja/ui/components/ui/button";
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
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@moja/ui/components/ui/drawer";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import { Spinner } from "@moja/ui/components/ui/spinner";
import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQueries,
} from "@tanstack/react-query";
import {
  Building,
  CheckCircle,
  Link2,
  MapPin,
  Navigation,
  Plus,
  Search,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { parseAsBoolean, parseAsString, useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { StatCard } from "@/features/operator/components/stat-card";
import { TerminalEditorSheet } from "@/features/operator/components/terminals/terminal-editor-sheet";
import { TerminalsTable } from "@/features/operator/components/terminals/terminals-table";
import { formatLocationLabel } from "@/lib/format-location-label";
import { useTRPC } from "@/trpc/client";

const FILTERS = ["ALL", "TERMINAL", "DEPOT", "CAPTURE"] as const;

export function OperatorTerminalsView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [{ data: locations }, { data: cities }] = useSuspenseQueries({
    queries: [
      trpc.terminals.list.queryOptions(),
      trpc.routes.getCities.queryOptions(),
    ],
  });

  const [search, setSearch] = useQueryState(
    "search",
    parseAsString.withDefault(""),
  );
  const [typeFilter, setTypeFilter] = useQueryState(
    "typeFilter",
    parseAsString.withDefault("ALL"),
  );
  const [drawerOpen, setDrawerOpen] = useQueryState(
    "drawer",
    parseAsBoolean.withDefault(false),
  );

  const [editingLocation, setEditingLocation] = useState<any>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<any>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [resolvingCapture, setResolvingCapture] = useState<any>(null);
  const [resolvingSubmitting, setResolvingSubmitting] = useState(false);
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
  const approveMutation = useMutation(
    trpc.captures.approveCapture.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries(trpc.terminals.list.pathFilter()),
    }),
  );
  const rejectMutation = useMutation(
    trpc.captures.rejectCapture.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries(trpc.terminals.list.pathFilter()),
    }),
  );

  const resolvedLabelQuery = useQuery(
    trpc.locations.getGeoPlaceLabel.queryOptions(
      resolvingCapture?.resolvedCityId
        ? {
            cityId: resolvingCapture.resolvedCityId,
            municipalityId:
              resolvingCapture.resolvedMunicipalityId ?? undefined,
            quarterId: resolvingCapture.resolvedQuarterId ?? undefined,
          }
        : skipToken,
    ),
  );

  const filteredLocations = useMemo(() => {
    if (!locations) return [];
    return locations.filter((loc: any) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        loc.name.toLowerCase().includes(q) ||
        loc.addressLine1.toLowerCase().includes(q) ||
        loc.cityRelation?.name?.toLowerCase().includes(q);

      const isCapturePending =
        loc.geoCaptureStatus != null && loc.geoCaptureStatus !== "COMPLETE";
      const matchesType =
        typeFilter === "ALL" ||
        (typeFilter === "TERMINAL" && loc.isTerminal) ||
        (typeFilter === "DEPOT" && !loc.isTerminal) ||
        (typeFilter === "CAPTURE" && isCapturePending);

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
      pending: list.filter(
        (l: any) =>
          l.geoCaptureStatus != null && l.geoCaptureStatus !== "COMPLETE",
      ).length,
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
        t("toast.locationUpdated", {
          type: !currentVal ? "Passenger Terminal" : "Depot / Operations",
        }),
      );
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

  const handleApproveCapture = async () => {
    if (!resolvingCapture) return;
    if (!window.confirm(t("resolve.approveConfirm"))) return;
    setResolvingSubmitting(true);
    try {
      await approveMutation.mutateAsync({ captureId: resolvingCapture.id });
      toast.success(t("resolve.approved"));
      setResolvingCapture(null);
    } catch (err: any) {
      toast.error(err.message || t("resolve.approveFailed"));
    } finally {
      setResolvingSubmitting(false);
    }
  };

  const handleRejectCapture = async () => {
    if (!resolvingCapture) return;
    if (!window.confirm(t("resolve.rejectConfirm"))) return;
    setResolvingSubmitting(true);
    try {
      await rejectMutation.mutateAsync({ captureId: resolvingCapture.id });
      toast.success(t("resolve.rejected"));
      setResolvingCapture(null);
    } catch (err: any) {
      toast.error(err.message || t("resolve.rejectFailed"));
    } finally {
      setResolvingSubmitting(false);
    }
  };

  const resolvedLabel = resolvedLabelQuery.data;

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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          label={t("kpi.totalLocations")}
          value={stats.total}
          icon={Building}
        />
        <StatCard
          label={t("kpi.passengerTerminals")}
          value={stats.terminals}
          icon={MapPin}
        />
        <StatCard
          label={t("kpi.depotsOffices")}
          value={stats.depots}
          icon={Navigation}
        />
        <StatCard
          label={t("kpi.activeSites")}
          value={stats.active}
          icon={CheckCircle}
        />
        <StatCard
          label={t("kpi.pendingCaptures")}
          value={stats.pending}
          icon={Link2}
        />
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
          {FILTERS.map((type) => (
            <Button
              key={type}
              variant={typeFilter === type ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter(type)}
              className="text-xs uppercase tracking-wider font-semibold"
            >
              {type === "ALL"
                ? t("allLocations")
                : type === "TERMINAL"
                  ? t("terminals")
                  : type === "DEPOT"
                    ? t("depots")
                    : `${t("capture.pendingFilter")} (${stats.pending})`}
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
        onResolveCapture={(loc) => {
          const capture = loc.captures?.[0];
          setResolvingCapture(
            capture ? { ...capture, locationName: loc.name } : null,
          );
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
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              {tc("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              {t("deleteLocation")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Drawer
        open={!!resolvingCapture}
        onOpenChange={(open) => {
          if (!open && !resolvingSubmitting) setResolvingCapture(null);
        }}
      >
        <DrawerContent className="max-h-[90vh]">
          <div className="mx-auto w-full max-w-2xl overflow-y-auto p-6 space-y-5">
            <DrawerHeader className="px-0">
              <DrawerTitle className="text-xl font-bold flex items-center gap-2">
                <Link2 className="size-5 text-primary" />
                {t("resolve.title")}
              </DrawerTitle>
              <DrawerDescription>{t("resolve.description")}</DrawerDescription>
            </DrawerHeader>

            {resolvingCapture && (
              <div className="space-y-4">
                <div className="rounded-lg border border-border p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Label>{t("resolve.terminal")}</Label>
                    <span className="text-sm font-semibold text-foreground text-right">
                      {resolvingCapture.locationName ?? "—"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <Label>{t("resolve.resolvedLocation")}</Label>
                    <span className="text-sm font-semibold text-foreground text-right">
                      {resolvedLabel
                        ? formatLocationLabel({
                            cityName: resolvedLabel.cityName,
                            municipalityName: resolvedLabel.municipalityName,
                            quarterName: resolvedLabel.quarterName,
                            isUrban: false,
                          })
                        : t("resolve.notYetResolved")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <Label>{t("resolve.suggestedAddress")}</Label>
                    <span className="text-sm font-semibold text-foreground text-right">
                      {resolvingCapture.reverseGeocodedAddress ??
                        t("resolve.noSuggestedAddress")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <Label>{t("resolve.coordinates")}</Label>
                    <span className="text-sm font-mono text-foreground text-right">
                      {resolvingCapture.latitude != null &&
                      resolvingCapture.longitude != null
                        ? `${resolvingCapture.latitude.toFixed(5)}, ${resolvingCapture.longitude.toFixed(5)}`
                        : "—"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <Label>{t("resolve.accuracyLabel")}</Label>
                    <span className="text-sm font-semibold text-foreground text-right">
                      {t("resolve.accuracyMeters", {
                        accuracy: resolvingCapture.accuracyMeters ?? "—",
                      })}
                    </span>
                  </div>

                  {resolvingCapture.capturedAt && (
                    <div className="flex items-center justify-between gap-2">
                      <Label>{t("resolve.submittedLabel")}</Label>
                      <span className="text-sm text-muted-foreground text-right">
                        {new Date(resolvingCapture.capturedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-border p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Label>{t("resolve.submittedBy")}</Label>
                    <span className="text-sm text-foreground text-right">
                      {resolvingCapture.submitterName
                        ? `${resolvingCapture.submitterName}${resolvingCapture.submitterPhone ? ` · ${resolvingCapture.submitterPhone}` : ""}`
                        : t("resolve.noSubmitter")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <Label>{t("resolve.device")}</Label>
                    <span className="text-sm text-muted-foreground text-right">
                      {resolvingCapture.device ?? "—"}
                    </span>
                  </div>

                  {resolvingCapture.notes && (
                    <div className="space-y-1">
                      <Label>{t("resolve.notesLabel")}</Label>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {resolvingCapture.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <DrawerFooter className="px-0 pt-4 flex-row justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setResolvingCapture(null)}
                disabled={resolvingSubmitting}
              >
                {tc("cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectCapture}
                disabled={resolvingSubmitting}
              >
                {resolvingSubmitting && <Spinner className="mr-2 size-4" />}
                {t("resolve.reject")}
              </Button>
              <Button
                onClick={handleApproveCapture}
                disabled={resolvingSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {resolvingSubmitting && <Spinner className="mr-2 size-4" />}
                {t("resolve.approve")}
              </Button>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
