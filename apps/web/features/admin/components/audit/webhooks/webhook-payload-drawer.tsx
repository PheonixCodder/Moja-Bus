"use client";

import { Badge } from "@moja/ui/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@moja/ui/components/ui/sheet";
import { format } from "date-fns";
import { useTranslations } from "next-intl";

interface WebhookPayloadDrawerProps {
  event: any | null;
  onClose: () => void;
}

export function WebhookPayloadDrawer({
  event,
  onClose,
}: WebhookPayloadDrawerProps) {
  const t = useTranslations("adminDashboard.webhookPayloadDrawer");
  if (!event) return null;

  const isProcessed = event.processedAt !== null;
  const isFailed = event.error !== null;

  let statusBadge = (
    <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500">
      {t("pending")}
    </Badge>
  );

  if (isProcessed) {
    statusBadge = (
      <Badge variant="secondary" className="bg-green-500/10 text-green-500">
        {t("processed")}
      </Badge>
    );
  } else if (isFailed) {
    statusBadge = (
      <Badge variant="secondary" className="bg-red-500/10 text-red-500">
        {t("failed")}
      </Badge>
    );
  }

  return (
    <Sheet open={!!event} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center gap-3">
            <SheetTitle>{t("title")}</SheetTitle>
            {statusBadge}
          </div>
          <SheetDescription>
            {t("receivedOn", {
              date: format(
                new Date(event.createdAt),
                "MMM d, yyyy 'at' h:mm a",
              ),
            })}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground block mb-1">
                {t("provider")}
              </span>
              <span className="font-medium capitalize">{event.provider}</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1">
                {t("eventType")}
              </span>
              <span className="font-medium font-mono bg-muted px-1 rounded">
                {event.eventType}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground block mb-1">
                {t("idempotencyKey")}
              </span>
              <span className="font-mono text-xs text-muted-foreground break-all bg-muted/50 p-1.5 rounded block">
                {event.idempotencyKey}
              </span>
            </div>
            {event.reference && (
              <div className="col-span-2">
                <span className="text-muted-foreground block mb-1">
                  {t("reference")}
                </span>
                <span className="font-medium">{event.reference}</span>
              </div>
            )}
            {event.processedAt && (
              <div className="col-span-2">
                <span className="text-muted-foreground block mb-1">
                  {t("processedAt")}
                </span>
                <span className="font-medium">
                  {format(new Date(event.processedAt), "MMM d, yyyy h:mm:ss a")}
                </span>
              </div>
            )}
          </div>

          {event.error && (
            <div>
              <h4 className="text-sm font-semibold mb-2 text-red-500">
                {t("processingError")}
              </h4>
              <pre className="bg-red-500/10 border border-red-500/20 text-red-600 rounded-md p-4 overflow-x-auto text-xs whitespace-pre-wrap font-mono">
                {event.error}
              </pre>
            </div>
          )}

          <div>
            <h4 className="text-sm font-semibold mb-2">{t("jsonPayload")}</h4>
            <pre className="bg-zinc-950 dark:bg-zinc-900 border border-border text-zinc-300 rounded-md p-4 overflow-x-auto text-xs font-mono">
              {JSON.stringify(event.payload, null, 2)}
            </pre>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
