"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useQueryState, parseAsString, parseAsInteger } from "nuqs";
import { formatDistanceToNow } from "date-fns";
import { useTRPC } from "@/trpc/client";
import { Badge } from "@moja/ui/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@moja/ui/components/ui/table";
import { ActivityLogsPagination } from "./activity-logs-pagination";
import { ActivityLogDetailDialog } from "./activity-log-detail-dialog";
import { useState } from "react";
import { Eye } from "lucide-react";
import { Button } from "@moja/ui/components/ui/button";

const CHANNEL_COLORS: Record<string, string> = {
  email: "bg-blue-100 text-blue-700 border-blue-200",
  sms: "bg-green-100 text-green-700 border-green-200",
  in_app: "bg-purple-100 text-purple-700 border-purple-200",
  push: "bg-orange-100 text-orange-700 border-orange-200",
  chat: "bg-yellow-100 text-yellow-700 border-yellow-200",
};

export function ActivityLogsTable() {
  const trpc = useTRPC();
  const [search] = useQueryState("search", parseAsString.withDefault(""));
  const [channel] = useQueryState("channel", parseAsString.withDefault(""));
  const [template] = useQueryState("template", parseAsString.withDefault(""));
  const [page] = useQueryState("page", parseAsInteger.withDefault(0));
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const { data } = useSuspenseQuery(
    trpc.admin.listActivityLogs.queryOptions(
      {
        page,
        limit: 20,
        search: search || undefined,
        channels: channel ? [channel] : undefined,
        templates: template ? [template] : undefined,
      },
      {
        placeholderData: (prev: any) => prev,
      }
    )
  );

  const items = data?.items ?? [];
  const hasMore = data?.hasMore ?? false;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="rounded-full bg-muted p-4">
          <Eye className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">No events found</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Try adjusting your filters or search term.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b bg-muted/30">
              <TableHead className="w-[160px] whitespace-nowrap pl-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Time
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Subscriber
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Workflow
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Channels
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="pr-4 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Details
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((log: any) => {
              const jobs = log.jobs ?? [];
              const channels = [...new Set(jobs.map((j: any) => j.type as string).filter(Boolean))];
              const createdAt = log.createdAt ? new Date(log.createdAt) : null;

              return (
                <TableRow key={String(log._id ?? log.id)} className="hover:bg-muted/20">
                  <TableCell className="pl-4 text-xs text-muted-foreground whitespace-nowrap">
                    {createdAt
                      ? formatDistanceToNow(createdAt, { addSuffix: true })
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground truncate max-w-[160px]">
                        {log.subscriber?.firstName ?? log.subscriber?.subscriberId ?? "—"}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono truncate max-w-[160px]">
                        {log.subscriber?.subscriberId ?? ""}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-mono bg-muted rounded px-1.5 py-0.5 text-foreground">
                      {log.template?.name ?? log.template?.identifier ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {channels.length > 0
                        ? channels.map((ch) => (
                            <Badge
                              key={String(ch)}
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 font-medium ${
                                CHANNEL_COLORS[String(ch)] ?? "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {String(ch)}
                            </Badge>
                          ))
                        : <span className="text-xs text-muted-foreground">—</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {log.status ? (
                      <Badge
                        variant="outline"
                        className={
                          log.status === "sent" || log.status === "completed"
                            ? "border-green-200 bg-green-50 text-green-700 text-[10px]"
                            : log.status === "failed" || log.status === "error"
                            ? "border-red-200 bg-red-50 text-red-700 text-[10px]"
                            : "border-yellow-200 bg-yellow-50 text-yellow-700 text-[10px]"
                        }
                      >
                        {log.status}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setSelectedLog(log)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ActivityLogsPagination hasMore={hasMore} />

      {selectedLog && (
        <ActivityLogDetailDialog
          log={selectedLog}
          open={!!selectedLog}
          onOpenChange={(open) => { if (!open) setSelectedLog(null); }}
        />
      )}
    </>
  );
}
