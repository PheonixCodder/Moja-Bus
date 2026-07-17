"use client";

import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@moja/ui/components/ui/dialog";
import { Badge } from "@moja/ui/components/ui/badge";
import { ScrollArea } from "@moja/ui/components/ui/scroll-area";
import { Separator } from "@moja/ui/components/ui/separator";

interface ActivityLogDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  log: any;
}

export function ActivityLogDetailDialog({ open, onOpenChange, log }: ActivityLogDetailDialogProps) {
  const jobs = log.jobs ?? [];
  const createdAt = log.createdAt ? new Date(log.createdAt) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm">
            {log.template?.name ?? log.template?.identifier ?? "Unknown Workflow"}
          </DialogTitle>
          <DialogDescription>
            {createdAt ? format(createdAt, "PPpp") : "Unknown time"} ·{" "}
            <span className="font-mono text-xs">
              {log._id ?? log.id ?? "—"}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Subscriber */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              Subscriber
            </p>
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
              <p className="font-medium">{log.subscriber?.firstName ?? "—"} {log.subscriber?.lastName ?? ""}</p>
              <p className="font-mono text-xs text-muted-foreground">{log.subscriber?.subscriberId ?? "—"}</p>
              {log.subscriber?.email && (
                <p className="text-xs text-muted-foreground">{log.subscriber.email}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Jobs (Steps) */}
          {jobs.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Steps ({jobs.length})
              </p>
              <div className="space-y-2">
                {jobs.map((job: any, i: number) => (
                  <div key={i} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">#{i + 1}</span>
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {job.type ?? "—"}
                      </Badge>
                    </div>
                    {job.status && (
                      <Badge
                        variant="outline"
                        className={
                          job.status === "completed"
                            ? "border-green-200 bg-green-50 text-green-700 text-[10px]"
                            : job.status === "failed"
                            ? "border-red-200 bg-red-50 text-red-700 text-[10px]"
                            : "border-yellow-200 bg-yellow-50 text-yellow-700 text-[10px]"
                        }
                      >
                        {job.status}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Raw Payload */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              Payload
            </p>
            <ScrollArea className="h-[160px] rounded-md border bg-muted/30">
              <pre className="p-3 text-[11px] font-mono leading-relaxed text-foreground whitespace-pre-wrap break-all">
                {JSON.stringify(log.payload ?? {}, null, 2)}
              </pre>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
