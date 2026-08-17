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

type EventTypeFilter =
  | "SELF_REFERRAL"
  | "SAME_PHONE_REFERRAL"
  | "SAME_DEVICE_REFERRAL"
  | "VELOCITY_CAP";

const EVENT_LABELS: Record<
  EventTypeFilter,
  { label: string; color: string; desc: string }
> = {
  SELF_REFERRAL: {
    label: "Self-referral",
    color: "bg-orange-100 text-orange-700",
    desc: "A traveler attempted to use their own referral link or code to claim a reward.",
  },
  SAME_PHONE_REFERRAL: {
    label: "Same phone",
    color: "bg-yellow-100 text-yellow-700",
    desc: "Referred account shares the same phone number as the referrer.",
  },
  SAME_DEVICE_REFERRAL: {
    label: "Same device",
    color: "bg-purple-100 text-purple-700",
    desc: "Browser fingerprint collision detected on the same hardware/device.",
  },
  VELOCITY_CAP: {
    label: "Velocity cap",
    color: "bg-red-100 text-red-700",
    desc: "Rapid repetitive redemption rate threshold triggered across short intervals.",
  },
};

function travelerHref(userId: string) {
  return `/dashboard/admin/users/travelers/${userId}`;
}

export function AdminPromoAbuseView() {
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
        toast.success("Marked as reviewed");
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
        toast.success("Campaign paused");
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
          All events
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
        {(
          Object.entries(EVENT_LABELS) as [
            EventTypeFilter,
            { label: string; color: string; desc: string },
          ][]
        ).map(([type, meta]) => (
          <div key={type} className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={() => setEventType(eventType === type ? undefined : type)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
                eventType === type
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900"
              }`}
            >
              {meta.label}
            </button>
            <InfoTooltip content={meta.desc} />
          </div>
        ))}
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/60">
              <TableHead className="font-semibold text-slate-600">When</TableHead>
              <TableHead className="font-semibold text-slate-600">Type</TableHead>
              <TableHead className="font-semibold text-slate-600">User</TableHead>
              <TableHead className="font-semibold text-slate-600">Details</TableHead>
              <TableHead className="text-right font-semibold text-slate-600">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listQuery.isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-sm text-slate-400">
                  Loading events…
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
                      <p className="text-sm font-semibold text-slate-700">No abuse events</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        Blocked self-referrals, phone collisions, and velocity hits appear here.
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => {
                const meta = EVENT_LABELS[item.eventType as EventTypeFilter];
                return (
                  <TableRow key={item.id} className={item.reviewed ? "opacity-60" : ""}>
                    <TableCell className="whitespace-nowrap text-sm text-slate-500">
                      {format(new Date(item.createdAt), "dd MMM yyyy")}
                      <br />
                      <span className="text-[11px] text-slate-400">
                        {format(new Date(item.createdAt), "HH:mm")}
                      </span>
                    </TableCell>
                    <TableCell>
                      {meta ? (
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${meta.color}`}
                        >
                          {meta.label}
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
                          <p className="text-xs text-slate-500">{item.user.email}</p>
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
                          Campaign:{" "}
                          <span className="font-medium text-slate-700">{item.campaign.name}</span>{" "}
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
                        {item.campaignId && item.campaign?.status === "ACTIVE" && (
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
                            className="border-orange-200 text-orange-700 hover:bg-orange-50"
                          >
                            <ShieldOff className="size-3.5" />
                            Pause campaign
                          </Button>
                        )}
                        {item.reviewed ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-emerald-700">
                            <CheckCheck className="size-3.5" />
                            Reviewed
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
                            Mark reviewed
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
        <p className="text-xs text-slate-400">{total} total matching events</p>
      )}
    </div>
  );
}
