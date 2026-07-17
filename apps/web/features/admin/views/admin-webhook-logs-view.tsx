"use client";

import { Suspense } from "react";
import { Card } from "@moja/ui/components/ui/card";
import { WebhookLogsFilters } from "../components/audit/webhooks/webhook-logs-filters";
import { WebhookLogsTable } from "../components/audit/webhooks/webhook-logs-table";
import { Spinner } from "@moja/ui/components/ui/spinner";

function TableFallback() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-muted-foreground border rounded-md">
      <Spinner className="size-8 mb-4" />
      <p>Loading webhook events...</p>
    </div>
  );
}

export function AdminWebhookLogsView() {
  return (
    <div className="space-y-6">
      <Card className="p-4 bg-muted/30 border-dashed">
        <WebhookLogsFilters />
      </Card>

      <Card className="p-4">
        <Suspense fallback={<TableFallback />}>
          <WebhookLogsTable />
        </Suspense>
      </Card>
    </div>
  );
}
