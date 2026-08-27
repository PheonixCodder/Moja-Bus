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
  SELF_REFERRAL: { color: "bg-pink-100 text-[#ee237c]" },
  SAME_PHONE_REFERRAL: { color: "bg-yellow-100 text-yellow-700" },
  SAME_DEVICE_REFERRAL: { color: "bg-rose-100 text-rose-700" },
  VELOCITY_CAP: { color: "bg-red-100 text-red-700" },
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
        <button
          type="button"
          onClick={() => setEventType(undefined)}
          className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
            !eventType
              ? "bg-slate-900 text-white"
              : "border border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900"
          }`}
        >
          {t("allEvents")}
          {total > 0 && (
            <span
              className={`ml-2 inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                !eventType
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {total}
            </span>
          )}
        </button>
        {EVENT_TYPES.map((type) => (
          <div key={type} className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={() =>
                setEventType(eventType === type ? undefined : type)
              }
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
                eventType === type
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900"
              }`}
            >
              {t(`events.${type}.label`)}
            </button>
            <InfoTooltip content={t(`events.${type}.desc`)} />
          </div>
        ))}
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/60">
              <TableHead className="font-semibold text-slate-600">
                {t("when")}
              </TableHead>
              <TableHead className="font-semibold text-slate-600">
                {t("type")}
              </TableHead>
              <TableHead className="font-semibold text-slate-600">
                {t("user")}
              </TableHead>
              <TableHead className="font-semibold text-slate-600">
                {t("details")}
              </TableHead>
              <TableHead className="text-right font-semibold text-slate-600">
                {t("actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listQuery.isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-12 text-center text-sm text-slate-400"
                >
                  {t("loading")}
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-16 text-center">
                  <div className="mx-auto flex max-w-xs flex-col items-center gap-3">
                    <div className="flex size-12 items-center justify-center rounded-full bg-emerald-50">
                      <ShieldAlert className="size-6 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        {t("emptyTitle")}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
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
                    <TableCell className="whitespace-nowrap text-sm text-slate-500">
                      {format(new Date(item.createdAt), "dd MMM yyyy")}
                      <br />
                      <span className="text-[11px] text-slate-400">
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
                            className="font-medium text-slate-900 underline-offset-2 hover:underline"
                          >
                            {item.user.fullName}
                          </Link>
                          <p className="text-xs text-slate-500">
                            {item.user.email}
                          </p>
                        </div>
                      ) : item.userId ? (
                        <Link
                          href={travelerHref(item.userId)}
                          className="font-mono text-xs text-slate-600 underline-offset-2 hover:underline"
                        >
                          {item.userId}
                        </Link>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs text-sm text-slate-600">
                      <p>{item.summary}</p>
                      {item.campaign && (
                        <p className="mt-1 text-xs text-slate-500">
                          {t("campaign")}{" "}
                          <span className="font-medium text-slate-700">
                            {item.campaign.name}
                          </span>{" "}
                          <span
                            className={`text-[10px] font-semibold uppercase ${
                              item.campaign.status === "ACTIVE"
                                ? "text-emerald-600"
                                : "text-slate-400"
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
                              className="border-slate-200 text-slate-700 hover:bg-slate-50"
                            >
                              <ShieldOff className="size-3.5" />
                              {t("pauseCampaign")}
                            </Button>
                          )}
                        {item.reviewed ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-emerald-700">
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
        <p className="text-xs text-slate-400">{t("totalEvents", { total })}</p>
      )}
    </div>
  );
}
