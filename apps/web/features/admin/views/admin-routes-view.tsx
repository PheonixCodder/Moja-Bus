"use client";

import { Suspense, useState } from "react";
import { AdminRoutesHeader } from "@/features/admin/components/routes/admin-routes-header";
import { AdminRoutesTable } from "@/features/admin/components/routes/admin-routes-table";
import { AdminRouteDrawer } from "@/features/admin/components/routes/admin-route-drawer";

export function AdminRoutesView() {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <AdminRoutesHeader />
      <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading routes...</div>}>
        <AdminRoutesTable onViewRoute={setSelectedRouteId} />
      </Suspense>
      <AdminRouteDrawer
        routeId={selectedRouteId}
        open={!!selectedRouteId}
        onClose={() => setSelectedRouteId(null)}
      />
    </div>
  );
}
