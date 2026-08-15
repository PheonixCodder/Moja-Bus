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
import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";

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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={!eventType ? "default" : "outline"}
          onClick={() => setEventType(undefined)}
        >
          All
        </Button>
        {[
          "SELF_REFERRAL",
          "SAME_PHONE_REFERRAL",
          "SAME_DEVICE_REFERRAL",
          "VELOCITY_CAP",
        ].map((type) => (
          <Button
            key={type}
            type="button"
            size="sm"
            variant={eventType === type ? "default" : "outline"}
            onClick={() => setEventType(type)}
          >
            {type}
          </Button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Summary</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-2 text-slate-500">
                    <ShieldAlert className="size-8 opacity-40" />
                    <p className="text-sm font-medium text-slate-700">
                      No abuse events
                    </p>
                    <p className="text-xs">
                      Blocked self-referrals, phone collisions, and velocity
                      hits appear here.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="whitespace-nowrap text-sm text-slate-500">
                    {format(new Date(item.createdAt), "dd MMM yyyy HH:mm")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{item.eventType}</Badge>
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
                        className="font-mono text-xs underline-offset-2 hover:underline"
                      >
                        {item.userId}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs text-sm text-slate-600">
                    <p>{item.summary}</p>
                    {item.campaign ? (
                      <p className="mt-0.5 text-xs text-slate-500">
                        Campaign: {item.campaign.name} ({item.campaign.status})
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap justify-end gap-1">
                      {item.campaignId &&
                      item.campaign &&
                      item.campaign.status === "ACTIVE" ? (
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
                          Pause campaign
                        </Button>
                      ) : null}
                      {item.reviewed ? (
                        <span className="px-2 text-xs text-emerald-700">
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
                          Mark reviewed
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
      <p className="text-xs text-slate-500">
        Total matching: {listQuery.data?.total ?? 0}
      </p>
    </div>
  );
}
