"use client";

import { useMemo, useState } from "react";
import {
  useSuspenseQueries,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Plus, Search, Map as MapIcon, CheckCircle2, Clock, Route as RouteIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@moja/ui/components/ui/empty";
import { useTRPC } from "@/trpc/client";
import { StatCard } from "@/features/operator/components/stat-card";
import { RouteCard } from "@/features/operator/components/routes/route-card";
import { RouteFormDrawer } from "@/features/operator/components/routes/route-form-drawer";
import { DeleteRouteDialog } from "@/features/operator/components/routes/delete-route-dialog";
import { RouteSuccessPanel } from "@/features/operator/components/routes/route-success-panel";
import type { RouterOutputs } from "@/trpc/client";

type RouteType = RouterOutputs["routes"]["list"][number];

export function OperatorRoutesView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const [{ data: routes }, { data: terminals }] = useSuspenseQueries({
    queries: [
      trpc.routes.list.queryOptions({
        showArchived: statusFilter === "ARCHIVED" || statusFilter === "ALL",
      }),
      trpc.terminals.list.queryOptions({ bookableOnly: true }),
    ],
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
  const [deletingRoute, setDeletingRoute] = useState<RouteType | null>(null);
  const [successRoute, setSuccessRoute] = useState<RouteType | null>(null);

  const filteredRoutes = useMemo(() => {
    if (!routes) return [];
    return routes.filter((r) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        (r.originTerminal?.name && r.originTerminal.name.toLowerCase().includes(q)) ||
        (r.originTerminal?.cityRelation?.name && r.originTerminal.cityRelation.name.toLowerCase().includes(q)) ||
        (r.destTerminal?.name && r.destTerminal.name.toLowerCase().includes(q)) ||
        (r.destTerminal?.cityRelation?.name && r.destTerminal.cityRelation.name.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === "ALL" || r.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [routes, search, statusFilter]);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Routes & Waypoints
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure transit routes, origin/destination hubs, intermediate waypoints, and distance metrics.
          </p>
        </div>
        <Button onClick={handleAddNew} className="shrink-0">
          <Plus className="mr-2 size-4" />
          Create Route
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Routes" value={stats.total} icon={RouteIcon} />
        <StatCard label="Active Routes" value={stats.active} icon={CheckCircle2} />
        <StatCard label="Draft Routes" value={stats.drafts} icon={MapIcon} />
        <StatCard label="Suspended" value={stats.suspended} icon={Clock} />
      </div>

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
            placeholder="Search route name or terminal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "ACTIVE", "DRAFT", "SUSPENDED", "ARCHIVED"].map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(s)}
              className="text-xs uppercase tracking-wider font-semibold"
            >
              {s === "ALL" ? "All Routes" : s}
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
              <EmptyTitle>No routes yet</EmptyTitle>
              <EmptyDescription>
                Create your first intercity route to start building schedules.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button size="sm" onClick={handleAddNew}>
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
                Try a different route name, origin, destination, or status filter.
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
              onEdit={handleEdit}
              onDelete={setDeletingRoute}
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
    </div>
  );
}
