"use client";

import { Badge } from "@moja/ui/components/ui/badge";
import { Button } from "@moja/ui/components/ui/button";
import { Card } from "@moja/ui/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@moja/ui/components/ui/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CheckCheck, ShieldAlert, ShieldOff } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { InfoTooltip } from "@/features/discounts/components/info-tooltip";
import { useTRPC } from "@/trpc/client";

import { useTranslations } from "next-intl";

type EventTypeFilter =
  | "SELF_REFERRAL"
  | "SAME_PHONE_REFERRAL"
  | "SAME_DEVICE_REFERRAL"
  | "VELOCITY_CAP";

const EVENT_CONFIG: Record<EventTypeFilter, { color: string }> = {
  SELF_REFERRAL: { color: "bg-primary/15 text-primary" },
  SAME_PHONE_REFERRAL: { color: "bg-warning/15 text-warning" },
  SAME_DEVICE_REFERRAL: { color: "bg-destructive/15 text-destructive" },
  VELOCITY_CAP: { color: "bg-destructive/15 text-destructive" },
};

const EVENT_TYPES: EventTypeFilter[] = [
  "SELF_REFERRAL",
  "SAME_PHONE_REFERRAL",
  "SAME_DEVICE_REFERRAL",
  "VELOCITY_CAP",
];

function travelerHref(userId: string) {
  return `/dashboard/admin/users/travelers/${userId}`;
}

export function AdminPromoAbuseView() {
  const t = useTranslations("adminDashboard.promoAbuse");
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [eventType, setEventType] = useState<string | undefined>(undefined);

  const listQuery = useQuery(
    trpc.discountsAdmin.listAbuseEvents.queryOptions({
      eventType,
      limit: 50,
      offset: 0,
    }),
  );

  const resolveMutation = useMutation(
    trpc.discountsAdmin.resolveAbuseEvent.mutationOptions({
      onSuccess: async () => {
        toast.success(t("toastReviewed"));
        await queryClient.invalidateQueries(
          trpc.discountsAdmin.listAbuseEvents.pathFilter(),
        );
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const pauseMutation = useMutation(
    trpc.discountsAdmin.setCampaignStatus.mutationOptions({
      onSuccess: async () => {
        toast.success(t("toastCampaignPaused"));
        await queryClient.invalidateQueries(
          trpc.discountsAdmin.listAbuseEvents.pathFilter(),
        );
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const items = listQuery.data?.items ?? [];
  const total = listQuery.data?.total ?? 0;

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={!eventType ? "default" : "outline"}
          onClick={() => setEventType(undefined)}
        >
          {t("allEvents")}
          {total > 0 && (
            <span
              className={`ml-2 inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-bold ${
                !eventType
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {total}
            </span>
          )}
        </Button>
        {EVENT_TYPES.map((type) => (
          <div key={type} className="inline-flex items-center gap-1">
            <Button
              type="button"
              size="sm"
              variant={eventType === type ? "default" : "outline"}
              onClick={() =>
                setEventType(eventType === type ? undefined : type)
              }
            >
              {t(`events.${type}.label`)}
            </Button>
            <InfoTooltip content={t(`events.${type}.desc`)} />
          </div>
        ))}
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold text-muted-foreground">
                {t("when")}
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground">
                {t("type")}
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground">
                {t("user")}
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground">
                {t("details")}
              </TableHead>
              <TableHead className="text-right font-semibold text-muted-foreground">
                {t("actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listQuery.isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  {t("loading")}
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-16 text-center">
                  <div className="mx-auto flex max-w-xs flex-col items-center gap-3">
                    <div className="flex size-12 items-center justify-center rounded-full bg-success/15">
                      <ShieldAlert className="size-6 text-success" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {t("emptyTitle")}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {t("emptyDesc")}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => {
                const isKnownType = item.eventType in EVENT_CONFIG;
                const config = isKnownType
                  ? EVENT_CONFIG[item.eventType as EventTypeFilter]
                  : null;
                return (
                  <TableRow
                    key={item.id}
                    className={item.reviewed ? "opacity-60" : ""}
                  >
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {format(new Date(item.createdAt), "dd MMM yyyy")}
                      <br />
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(item.createdAt), "HH:mm")}
                      </span>
                    </TableCell>
                    <TableCell>
                      {config ? (
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${config.color}`}
                        >
                          {t(
                            `events.${item.eventType as EventTypeFilter}.label`,
                          )}
                        </span>
                      ) : (
                        <Badge variant="secondary">{item.eventType}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.user ? (
                        <div className="space-y-0.5">
                          <Link
                            href={travelerHref(item.user.id)}
                            className="font-medium text-foreground underline-offset-2 hover:underline"
                          >
                            {item.user.fullName}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {item.user.email}
                          </p>
                        </div>
                      ) : item.userId ? (
                        <Link
                          href={travelerHref(item.userId)}
                          className="font-mono text-xs text-muted-foreground underline-offset-2 hover:underline"
                        >
                          {item.userId}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs text-sm text-muted-foreground">
                      <p>{item.summary}</p>
                      {item.campaign && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t("campaign")}{" "}
                          <span className="font-medium text-foreground">
                            {item.campaign.name}
                          </span>{" "}
                          <span
                            className={`text-xs font-semibold uppercase ${
                              item.campaign.status === "ACTIVE"
                                ? "text-success"
                                : "text-muted-foreground"
                            }`}
                          >
                            {item.campaign.status}
                          </span>
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {item.campaignId &&
                          item.campaign?.status === "ACTIVE" && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={pauseMutation.isPending}
                              onClick={() =>
                                pauseMutation.mutate({
                                   id: item.campaignId!,
                                   status: "PAUSED",
                                   pauseReason: `Paused from abuse queue (${item.eventType})`,
                                })
                              }
                            >
                              <ShieldOff className="size-3.5" />
                              {t("pauseCampaign")}
                            </Button>
                          )}
                        {item.reviewed ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-success">
                            <CheckCheck className="size-3.5" />
                            {t("reviewed")}
                          </span>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={resolveMutation.isPending}
                            onClick={() =>
                              resolveMutation.mutate({
                                id: item.id,
                                note: "Reviewed from admin abuse queue",
                              })
                            }
                          >
                            <CheckCheck className="size-3.5" />
                            {t("markReviewed")}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {total > 0 && (
        <p className="text-xs text-muted-foreground">{t("totalEvents", { total })}</p>
      )}
    </div>
  );
}
