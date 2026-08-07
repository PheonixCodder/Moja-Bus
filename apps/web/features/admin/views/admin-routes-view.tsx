"use client";

import { useTranslations } from "next-intl";
import { Suspense, useState } from "react";
import { AdminRouteDrawer } from "@/features/admin/components/routes/admin-route-drawer";
import { AdminRoutesHeader } from "@/features/admin/components/routes/admin-routes-header";
import { AdminRoutesTable } from "@/features/admin/components/routes/admin-routes-table";

export function AdminRoutesView() {
  const t = useTranslations("adminDashboard.adminRoutesView");
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <AdminRoutesHeader />
      <Suspense
        fallback={
          <div className="p-8 text-center text-sm text-muted-foreground">
            {t("loadingRoutes")}
          </div>
        }
      >
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
