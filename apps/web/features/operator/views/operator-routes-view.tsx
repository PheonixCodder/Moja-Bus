"use client";

import { Button } from "@moja/ui/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@moja/ui/components/ui/empty";
import { Input } from "@moja/ui/components/ui/input";
import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock,
  Download,
  Map as MapIcon,
  Plus,
  Route as RouteIcon,
  Search,
  Upload,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useQueryStates } from "nuqs";
import { toast } from "sonner";
import {
  CsvImportModal,
  downloadCsvFile,
  ROUTES_CSV_TEMPLATE,
} from "@/components/csv-importer";
import { DeleteRouteDialog } from "@/features/operator/components/routes/delete-route-dialog";
import { RouteCard } from "@/features/operator/components/routes/route-card";
import { RouteFormDrawer } from "@/features/operator/components/routes/route-form-drawer";
import { RouteSuccessPanel } from "@/features/operator/components/routes/route-success-panel";
import { PageHeaderAction } from "@/features/operator/components/header";
import { KpiCard, KpiGrid } from "@/features/operator/components/kpi";
import { useStaffPermissions } from "@/features/operator/hooks/use-staff-permissions";
import { useDebounce } from "@/features/operator/hooks/useDebounce";
import {
  ROUTE_STATUS_OPTIONS,
  routeSearchParams,
} from "@/features/operator/lib/routes/route-search-params";
import type { RouterOutputs } from "@/trpc/client";
import { useTRPC } from "@/trpc/client";

type RouteType = RouterOutputs["routes"]["list"][number];

export function OperatorRoutesView() {
  const t = useTranslations("operatorDashboard.routes");
  const trpc = useTRPC();
  const { can } = useStaffPermissions();
  const queryClient = useQueryClient();

  const [{ q, status }, setParams] = useQueryStates(routeSearchParams);
  const [searchVal, setSearchVal] = useState(q);
  const debouncedSearch = useDebounce(searchVal, 300);

  useEffect(() => {
    if (debouncedSearch !== q) {
      void setParams({ q: debouncedSearch || null });
    }
  }, [debouncedSearch, q, setParams]);

  useEffect(() => {
    setSearchVal(q);
  }, [q]);

  const canManageRoute = can("routes:create") || can("routes:update");

  const { data: routes } = useSuspenseQuery(
    trpc.routes.list.queryOptions({
      showArchived: status === "ARCHIVED" || status === "ALL",
    }),
  );
  // S2: only fetch terminals when the user can actually open the route form
  // (server requires terminals:read). Keeps a routes:read-only user from
  // erroring out on a control they can't use.
  const { data: terminals } = useQuery({
    ...trpc.terminals.list.queryOptions({ bookableOnly: true }),
    enabled: canManageRoute,
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
  const [deletingRoute, setDeletingRoute] = useState<RouteType | null>(null);
  const [successRoute, setSuccessRoute] = useState<RouteType | null>(null);

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const batchImportMutation = useMutation(
    trpc.routes.batchImport.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.routes.list.pathFilter());
      },
    }),
  );

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const data = await queryClient.fetchQuery(
        trpc.routes.exportCsv.queryOptions(),
      );
      downloadCsvFile(data.filename, data.csv);
      toast.success(`Exported ${data.count} routes to ${data.filename}`);
    } catch {
      toast.error("Failed to export routes");
    } finally {
      setIsExporting(false);
    }
  };

  const filteredRoutes = useMemo(() => {
    if (!routes) return [];
    return routes.filter((r) => {
      const searchStr = q.toLowerCase().trim();
      const matchesSearch =
        !searchStr ||
        r.name.toLowerCase().includes(searchStr) ||
        (r.originTerminal?.name &&
          r.originTerminal.name.toLowerCase().includes(searchStr)) ||
        (r.originTerminal?.cityRelation?.name &&
          r.originTerminal.cityRelation.name.toLowerCase().includes(searchStr)) ||
        (r.destTerminal?.name &&
          r.destTerminal.name.toLowerCase().includes(searchStr)) ||
        (r.destTerminal?.cityRelation?.name &&
          r.destTerminal.cityRelation.name.toLowerCase().includes(searchStr));

      const matchesStatus = status === "ALL" || r.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [routes, q, status]);

  const stats = useMemo(() => {
    const list = routes ?? [];
    return {
      total: list.length,
      active: list.filter((r) => r.status === "ACTIVE").length,
      drafts: list.filter((r) => r.status === "DRAFT").length,
      suspended: list.filter((r) => r.status === "SUSPENDED").length,
    };
  }, [routes]);

  const handleEdit = (route: RouteType) => {
    setEditingRouteId(route.id);
    setDrawerOpen(true);
  };

  const handleAddNew = () => {
    setEditingRouteId(null);
    setDrawerOpen(true);
  };

  const handleCreated = (route: RouteType) => {
    setSuccessRoute(route);
    setDrawerOpen(false);
    setEditingRouteId(null);
  };

  const handleUpdated = (route: RouteType) => {
    setDrawerOpen(false);
    setEditingRouteId(null);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <PageHeaderAction
        title={t("pageTitle")}
        description={t("pageDescription")}
        actions={
          <>
            <Button
              variant="outline"
              onClick={handleExportCsv}
              disabled={isExporting}
              className="gap-1.5"
            >
              <Download className="size-4" />
              {isExporting ? "Exporting..." : "Export CSV"}
            </Button>

            {can("routes:create") ? (
              <Button
                variant="outline"
                onClick={() => setImportModalOpen(true)}
                className="gap-1.5"
              >
                <Upload className="size-4" />
                Import CSV
              </Button>
            ) : null}

            {can("routes:create") ? (
              <Button onClick={handleAddNew} className="shrink-0 gap-1.5">
                <Plus className="size-4" />
                {t("createRoute")}
              </Button>
            ) : null}
          </>
        }
      />

      {/* Stat Cards */}
      <KpiGrid cols={4}>
        <KpiCard
          label={t("kpi.totalRoutes")}
          value={stats.total}
          icon={RouteIcon}
        />
        <KpiCard
          label={t("kpi.activeRoutes")}
          value={stats.active}
          icon={CheckCircle2}
        />
        <KpiCard
          label={t("kpi.draftRoutes")}
          value={stats.drafts}
          icon={MapIcon}
        />
        <KpiCard
          label={t("kpi.suspended")}
          value={stats.suspended}
          icon={Clock}
        />
      </KpiGrid>

      {/* Success Callout Panel */}
      <RouteSuccessPanel
        route={successRoute}
        onDismiss={() => setSuccessRoute(null)}
      />

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {ROUTE_STATUS_OPTIONS.map((s) => (
            <Button
              key={s}
              variant={status === s ? "default" : "outline"}
              size="sm"
              onClick={() => setParams({ status: s })}
              className="text-xs uppercase tracking-wider font-semibold"
            >
              {s === "ALL" ? t("status.ALL") : t(`status.${s}`)}
            </Button>
          ))}
        </div>
      </div>

      {/* Routes Grid / Empty State */}
      {filteredRoutes.length === 0 ? (
        (routes ?? []).length === 0 ? (
          <Empty className="py-16">
            <EmptyMedia>
              <RouteIcon className="size-10 text-muted-foreground/30" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>{t("noRoutesTitle")}</EmptyTitle>
              <EmptyDescription>{t("noRoutesDesc")}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              {can("routes:create") ? (
                <Button size="sm" onClick={handleAddNew}>
                  <Plus className="size-3.5 mr-1.5" />
                  {t("createRoute")}
                </Button>
              ) : null}
            </EmptyContent>
          </Empty>
        ) : (
          <Empty className="py-16">
            <EmptyMedia>
              <MapIcon className="size-10 text-muted-foreground/30" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>{t("noMatchTitle")}</EmptyTitle>
              <EmptyDescription>{t("noMatchDesc")}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRoutes.map((route) => (
            <RouteCard
              key={route.id}
              route={route}
              onEdit={can("routes:update") ? handleEdit : undefined}
              onDelete={can("routes:delete") ? setDeletingRoute : undefined}
            />
          ))}
        </div>
      )}

      {/* Route Form Drawer */}
      <RouteFormDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingRouteId(null);
        }}
        terminals={terminals ?? []}
        editingRouteId={editingRouteId}
        onCreated={handleCreated}
        onUpdated={handleUpdated}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteRouteDialog
        route={deletingRoute}
        open={!!deletingRoute}
        onClose={() => setDeletingRoute(null)}
      />

      <CsvImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        config={ROUTES_CSV_TEMPLATE}
        onImport={async ({ records, upsert }) => {
          return await batchImportMutation.mutateAsync({
            upsert,
            records: records as Array<{
              name: string;
              originTerminal: string;
              destTerminal: string;
              distanceKm?: number | null;
              turnaroundBufferMinutes?: number | null;
            }>,
          });
        }}
        onSuccess={() => {
          queryClient.invalidateQueries(trpc.routes.list.pathFilter());
        }}
      />
    </div>
  );
}
