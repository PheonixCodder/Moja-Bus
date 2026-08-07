"use client";

import { Badge } from "@moja/ui/components/ui/badge";
import { cn } from "@moja/ui/lib/utils";
import { useTranslations } from "next-intl";
import type { TravelerRow } from "./travelers-columns";
import { statusMeta } from "./travelers-columns";

export function TravelerStatusBadge({
  status,
}: {
  status: TravelerRow["status"];
}) {
  const t = useTranslations("adminDashboard.travelersStatusBadge");
  const meta = statusMeta[status];

  return (
    <Badge
      className={cn("gap-1.5 border px-2 py-1 font-medium", meta.badgeClass)}
      variant="outline"
    >
      <span className={cn("size-1.5 rounded-full", meta.dotClass)} />
      {t(status.toLowerCase() as string)}
    </Badge>
  );
}
