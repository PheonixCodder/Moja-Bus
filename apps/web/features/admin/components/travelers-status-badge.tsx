"use client";

import { cn } from "@moja/ui/lib/utils";
import { Badge } from "@moja/ui/components/ui/badge";
import type { TravelerRow } from "./travelers-columns";
import { statusMeta } from "./travelers-columns";

export function TravelerStatusBadge({ status }: { status: TravelerRow["status"] }) {
  const meta = statusMeta[status];

  return (
    <Badge className={cn("gap-1.5 border px-2 py-1 font-medium", meta.badgeClass)} variant="outline">
      <span className={cn("size-1.5 rounded-full", meta.dotClass)} />
      {status}
    </Badge>
  );
}
