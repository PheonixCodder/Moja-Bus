"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { useQueryStates } from "nuqs";
import { useTranslations } from "next-intl";
import { webhookLogsSearchParams } from "../../../lib/search-params";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@moja/ui/components/ui/table";
import { Badge } from "@moja/ui/components/ui/badge";
import { Button } from "@moja/ui/components/ui/button";
import { Eye, Inbox } from "lucide-react";
import { useState } from "react";
import { WebhookPayloadDrawer } from "./webhook-payload-drawer";

export function WebhookLogsTable() {
  const t = useTranslations("adminDashboard.webhookLogsTable");
  const [params, setParams] = useQueryStates(webhookLogsSearchParams);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const trpc = useTRPC();

  const { data } = useSuspenseQuery(
    trpc.admin.listWebhookEvents.queryOptions({
      page: params.page - 1,
      limit: params.pageSize,
      search: params.search || undefined,
      status: params.status,
      provider: params.provider,
    })
  );

  const totalPages = Math.ceil(data.total / params.pageSize);

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>{t("status")}</TableHead>
              <TableHead>{t("provider")}</TableHead>
              <TableHead>{t("eventType")}</TableHead>
              <TableHead>{t("reference")}</TableHead>
              <TableHead>{t("received")}</TableHead>
              <TableHead className="text-right">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Inbox className="h-6 w-6 text-muted-foreground/50" />
                    <p>{t("noEvents")}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((event) => {
                const isProcessed = event.processedAt !== null;
                const isFailed = event.error !== null;

                let statusBadge = (
                     <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">
                       {t("pending")}
                     </Badge>
                   );

                 if (isProcessed) {
                   statusBadge = (
                     <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                       {t("processed")}
                     </Badge>
                   );
                 } else if (isFailed) {
                   statusBadge = (
                     <Badge variant="secondary" className="bg-red-500/10 text-red-500 hover:bg-red-500/20">
                       {t("failed")}
                     </Badge>
                   );
                 }

                return (
                  <TableRow key={event.id} className="group">
                    <TableCell>{statusBadge}</TableCell>
                    <TableCell className="capitalize font-medium">{event.provider}</TableCell>
                    <TableCell>
                      <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                        {event.eventType}
                      </code>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground truncate max-w-[150px]">
                      {event.reference || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(event.createdAt), "MMM d, yyyy h:mm a")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedEvent(event)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Payload
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {data.total > 0 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-muted-foreground">
            Showing {params.page * params.pageSize - params.pageSize + 1} to{" "}
            {Math.min(params.page * params.pageSize, data.total)} of {data.total} results
          </p>
          <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={params.page <= 1}
                onClick={() => setParams({ page: params.page - 1 })}
              >
                {t("previous")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={params.page >= totalPages}
                onClick={() => setParams({ page: params.page + 1 })}
              >
                {t("next")}
              </Button>
          </div>
        </div>
      )}

      <WebhookPayloadDrawer event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </>
  );
}
