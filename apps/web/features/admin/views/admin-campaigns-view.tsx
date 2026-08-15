"use client";

import { Badge } from "@moja/ui/components/ui/badge";
import { Button } from "@moja/ui/components/ui/button";
import { Card } from "@moja/ui/components/ui/card";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";
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
import { Megaphone, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CampaignCouponsPanel } from "@/features/discounts/components/campaign-coupons-panel";
import { CampaignRedemptionsTable } from "@/features/discounts/components/campaign-redemptions-table";
import { CampaignSettingsEditor } from "@/features/discounts/components/campaign-settings-editor";
import { ReferralFunnelBars } from "@/features/discounts/components/referral-funnel-bars";
import { useTRPC } from "@/trpc/client";

type BenefitType = "PERCENT_OFF" | "FIXED_AMOUNT_OFF" | "WALLET_CREDIT_GRANT";

export function AdminCampaignsView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [benefitType, setBenefitType] = useState<BenefitType>("PERCENT_OFF");
  const [percentOff, setPercentOff] = useState("10");
  const [amountXOF, setAmountXOF] = useState("1000");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    null,
  );
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null);
  const [scopeRouteIds, setScopeRouteIds] = useState<string[]>([]);
  const [scopeScheduleIds, setScopeScheduleIds] = useState<string[]>([]);

  const listQuery = useQuery(
    trpc.discountsAdmin.listCampaigns.queryOptions({
      search: search || undefined,
      limit: 50,
      offset: 0,
    }),
  );

  const createMutation = useMutation(
    trpc.discountsAdmin.createCampaign.mutationOptions({
      onSuccess: async (campaign) => {
        toast.success("Campaign created — add codes, then Activate");
        setShowCreate(false);
        setName("");
        setSelectedCampaignId(campaign.id);
        await queryClient.invalidateQueries(
          trpc.discountsAdmin.listCampaigns.pathFilter(),
        );
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const statusMutation = useMutation(
    trpc.discountsAdmin.setCampaignStatus.mutationOptions({
      onSuccess: async () => {
        toast.success("Status updated");
        await queryClient.invalidateQueries(
          trpc.discountsAdmin.listCampaigns.pathFilter(),
        );
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const campaignDetailQuery = useQuery({
    ...trpc.discountsAdmin.getCampaign.queryOptions({
      id: selectedCampaignId ?? "",
    }),
    enabled: Boolean(selectedCampaignId),
  });

  useEffect(() => {
    const detail = campaignDetailQuery.data;
    if (!detail) return;
    setScopeRouteIds(detail.routeScopes.map((s) => s.routeId));
    setScopeScheduleIds(detail.scheduleScopes.map((s) => s.scheduleId));
  }, [campaignDetailQuery.data]);

  const couponMutation = useMutation(
    trpc.discountsAdmin.createCoupon.mutationOptions({
      onSuccess: async () => {
        toast.success("Coupon created");
        await Promise.all([
          queryClient.invalidateQueries(trpc.discountsAdmin.listCampaigns.pathFilter()),
          selectedCampaignId
            ? queryClient.invalidateQueries(
                trpc.discountsAdmin.getCampaign.queryFilter({
                  id: selectedCampaignId,
                }),
              )
            : Promise.resolve(),
        ]);
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const deactivateCouponMutation = useMutation(
    trpc.discountsAdmin.deactivateCoupon.mutationOptions({
      onSuccess: async () => {
        toast.success("Coupon deactivated");
        await Promise.all([
          queryClient.invalidateQueries(trpc.discountsAdmin.listCampaigns.pathFilter()),
          selectedCampaignId
            ? queryClient.invalidateQueries(
                trpc.discountsAdmin.getCampaign.queryFilter({
                  id: selectedCampaignId,
                }),
              )
            : Promise.resolve(),
        ]);
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const bulkCouponMutation = useMutation(
    trpc.discountsAdmin.bulkCreateCoupons.mutationOptions({
      onSuccess: async (result) => {
        toast.success(`Created ${result.codes.length} codes`);
        await Promise.all([
          queryClient.invalidateQueries(trpc.discountsAdmin.listCampaigns.pathFilter()),
          selectedCampaignId
            ? queryClient.invalidateQueries(
                trpc.discountsAdmin.getCampaign.queryFilter({
                  id: selectedCampaignId,
                }),
              )
            : Promise.resolve(),
        ]);
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const updateCampaignMutation = useMutation(
    trpc.discountsAdmin.updateCampaign.mutationOptions({
      onSuccess: async () => {
        toast.success("Campaign settings saved");
        await Promise.all([
          queryClient.invalidateQueries(trpc.discountsAdmin.listCampaigns.pathFilter()),
          selectedCampaignId
            ? queryClient.invalidateQueries(
                trpc.discountsAdmin.getCampaign.queryFilter({
                  id: selectedCampaignId,
                }),
              )
            : Promise.resolve(),
        ]);
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const routesQuery = useQuery(
    trpc.admin.listRoutes.queryOptions({
      page: 1,
      pageSize: 100,
    }),
  );

  const schedulesQuery = useQuery({
    ...trpc.discountsAdmin.listScopeSchedules.queryOptions({
      routeIds: scopeRouteIds,
      limit: 100,
    }),
    enabled: Boolean(selectedCampaignId),
  });

  const tripsQuery = useQuery({
    ...trpc.discountsAdmin.listScopeTrips.queryOptions({
      scheduleIds: scopeScheduleIds,
      routeIds: scopeRouteIds,
      daysAhead: 60,
      limit: 100,
    }),
    enabled: Boolean(selectedCampaignId) && (scopeScheduleIds.length > 0 || scopeRouteIds.length > 0),
  });

  const exportMutation = useMutation({
    mutationFn: async (input: { campaignId?: string }) => {
      return queryClient.fetchQuery(
        trpc.discountsAdmin.exportRedemptionsCsv.queryOptions({
          campaignId: input.campaignId,
          limit: 1000,
        }),
      );
    },
    onSuccess: (data) => {
      const blob = new Blob([data.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${data.rowCount} redemptions`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const notifyMutation = useMutation(
    trpc.discountsAdmin.notifyOptedInCampaign.mutationOptions({
      onSuccess: (result) => {
        if (result.skippedNoNovu) {
          toast.message("Novu not configured — no messages sent");
          return;
        }
        toast.success(`Notified ${result.attempted} opted-in passengers`);
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const items = listQuery.data?.items ?? [];
  const summaryQuery = useQuery(trpc.discountsAdmin.marketingSummary.queryOptions());
  const summary = summaryQuery.data;
  const funnel = summary?.referralFunnel ?? {};

  const performanceQuery = useQuery({
    ...trpc.discountsAdmin.campaignPerformance.queryOptions({
      campaignId: selectedCampaignId ?? "",
    }),
    enabled: Boolean(selectedCampaignId),
  });
  const performance = performanceQuery.data;

  const redemptionsQuery = useQuery({
    ...trpc.discountsAdmin.listRedemptions.queryOptions({
      campaignId: selectedCampaignId ?? undefined,
      couponCodeId: selectedCouponId ?? undefined,
      limit: 50,
      offset: 0,
    }),
    enabled: Boolean(selectedCampaignId),
  });

  return (
    <div className="space-y-6">
      {summary ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <p className="text-xs font-medium text-slate-500">Active campaigns</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {summary.activeCampaigns}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-slate-500">Confirmed redemptions</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {summary.confirmedRedemptions}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-slate-500">Platform promo expense</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {summary.platformExpenseXOF.toLocaleString()} XOF
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-slate-500">Open voucher liability</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {summary.voucherLiabilityXOF.toLocaleString()} XOF
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Abuse events (7d): {summary.abuseEventsLast7d} · Credits outstanding:{" "}
              {summary.creditOutstandingXOF.toLocaleString()} XOF
            </p>
          </Card>
        </div>
      ) : null}

      {summary?.voucherAging ? (
        <Card className="p-4">
          <p className="text-xs font-medium text-slate-500">
            Voucher liability aging (by issue date)
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            {(
              [
                ["0–30d", summary.voucherAging.d0to30],
                ["30–90d", summary.voucherAging.d30to90],
                ["90–365d", summary.voucherAging.d90to365],
                ["365d+", summary.voucherAging.d365plus],
              ] as const
            ).map(([label, bucket]) => (
              <div key={label}>
                <p className="text-[11px] uppercase tracking-wide text-slate-400">
                  {label}
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {bucket.remainingXOF.toLocaleString()} XOF
                </p>
                <p className="text-[11px] text-slate-500">{bucket.count} vouchers</p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {summary ? (
        <Card className="p-4">
          <p className="text-xs font-medium text-slate-500">Referral funnel</p>
          <p className="mt-1 text-[11px] text-slate-400">
            Platform-wide attributed → qualified → rewarded edges
          </p>
          <ReferralFunnelBars
            className="mt-4 max-w-md space-y-3"
            steps={[
              {
                key: "ATTRIBUTED",
                label: "Attributed",
                count: Number(funnel["ATTRIBUTED"] ?? 0),
              },
              {
                key: "QUALIFIED",
                label: "Qualified",
                count: Number(funnel["QUALIFIED"] ?? 0),
              },
              {
                key: "REWARDED",
                label: "Rewarded",
                count: Number(funnel["REWARDED"] ?? 0),
              },
            ]}
          />
        </Card>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Search campaigns…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={exportMutation.isPending}
            onClick={() => exportMutation.mutate({})}
          >
            Export CSV
          </Button>
          <Button type="button" onClick={() => setShowCreate((v) => !v)}>
            <Plus className="size-4" />
            New campaign
          </Button>
        </div>
      </div>

      {showCreate ? (
        <Card className="space-y-4 p-4">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-slate-900">
              Create platform campaign
            </h2>
            <p className="text-xs text-slate-500">
              Starts as Draft. Add coupon codes, then click Activate so
              passengers can redeem at checkout.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="campaign-name">Name</Label>
              <Input
                id="campaign-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Summer launch 10%"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Benefit</Label>
              <Select
                value={benefitType}
                onValueChange={(v) => setBenefitType(v as BenefitType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENT_OFF">Percent off</SelectItem>
                  <SelectItem value="FIXED_AMOUNT_OFF">Fixed amount</SelectItem>
                  <SelectItem value="WALLET_CREDIT_GRANT">
                    Promo credit grant
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {benefitType === "PERCENT_OFF" ? (
              <div className="space-y-1.5">
                <Label htmlFor="percent-off">Percent off ticket (%)</Label>
                <Input
                  id="percent-off"
                  type="number"
                  min={1}
                  max={100}
                  value={percentOff}
                  onChange={(e) => setPercentOff(e.target.value)}
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="amount-xof">
                  {benefitType === "WALLET_CREDIT_GRANT"
                    ? "Credit amount (XOF)"
                    : "Amount (XOF)"}
                </Label>
                <Input
                  id="amount-xof"
                  type="number"
                  value={amountXOF}
                  onChange={(e) => setAmountXOF(e.target.value)}
                />
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              disabled={!name.trim() || createMutation.isPending}
              onClick={() =>
                createMutation.mutate({
                  name: name.trim(),
                  fundingType: "PLATFORM",
                  benefitType,
                  percentBps:
                    benefitType === "PERCENT_OFF"
                      ? Math.round(Number(percentOff) * 100)
                      : undefined,
                  amountXOF:
                    benefitType === "FIXED_AMOUNT_OFF" ||
                    benefitType === "WALLET_CREDIT_GRANT"
                      ? Number(amountXOF)
                      : undefined,
                  platformShareBps: 10_000,
                  operatorShareBps: 0,
                  status: "DRAFT",
                  isAutoApply: benefitType !== "WALLET_CREDIT_GRANT",
                })
              }
            >
              Create draft
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreate(false)}
            >
              Cancel
            </Button>
          </div>
        </Card>
      ) : null}

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead>Benefit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-2 text-slate-500">
                    <Megaphone className="size-8 opacity-40" />
                    <p className="text-sm font-medium text-slate-700">
                      No campaigns yet
                    </p>
                    <p className="text-xs">
                      Create a platform-funded promo to start issuing coupons.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium text-slate-900">{item.name}</div>
                    <div className="text-xs text-slate-500">{item.fundingType}</div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {item.benefitType === "PERCENT_OFF"
                      ? `${(item.percentBps ?? 0) / 100}%`
                      : item.benefitType === "FIXED_AMOUNT_OFF"
                        ? `${item.amountXOF?.toLocaleString()} XOF`
                        : item.benefitType}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{item.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {item._count.redemptions} redemptions · {item._count.coupons}{" "}
                    codes
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {format(new Date(item.createdAt), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedCampaignId(item.id)}
                      >
                        Codes
                      </Button>
                      {item.status === "ACTIVE" ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={notifyMutation.isPending}
                            onClick={() =>
                              notifyMutation.mutate({ campaignId: item.id })
                            }
                          >
                            Notify opted-in
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={statusMutation.isPending}
                            onClick={() =>
                              statusMutation.mutate({
                                id: item.id,
                                status: "PAUSED",
                                pauseReason: "Paused from admin UI",
                              })
                            }
                          >
                            Pause
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          disabled={statusMutation.isPending}
                          onClick={() =>
                            statusMutation.mutate({
                              id: item.id,
                              status: "ACTIVE",
                            })
                          }
                        >
                          Activate
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

      {selectedCampaignId ? (
        <Card className="space-y-4 p-4">
          {performance ? (
            <div className="grid gap-3 sm:grid-cols-4">
              <div>
                <p className="text-xs text-slate-500">Campaign</p>
                <p className="text-sm font-semibold text-slate-900">
                  {performance.campaign.name}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Confirmed redemptions</p>
                <p className="text-sm font-semibold text-slate-900">
                  {performance.confirmedRedemptions}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Ticket discount</p>
                <p className="text-sm font-semibold text-slate-900">
                  {performance.ticketDiscountXOF.toLocaleString()} XOF
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Platform / operator funded</p>
                <p className="text-sm font-semibold text-slate-900">
                  {performance.platformFundedXOF.toLocaleString()} /{" "}
                  {performance.operatorFundedXOF.toLocaleString()} XOF
                </p>
              </div>
            </div>
          ) : null}
          <div className="space-y-3 border-t border-slate-100 pt-3">
            {campaignDetailQuery.data ? (
              <CampaignSettingsEditor
                campaign={campaignDetailQuery.data}
                routeOptions={(routesQuery.data?.items ?? []).map((r) => ({
                  id: r.id,
                  name: `${r.name}${r.company?.name ? ` · ${r.company.name}` : ""}`,
                }))}
                scheduleOptions={(schedulesQuery.data ?? []).map((s) => ({
                  id: s.id,
                  name: s.name,
                  routeId: s.routeId,
                }))}
                tripOptions={(tripsQuery.data ?? []).map((t) => ({
                  id: t.id,
                  name: t.name,
                }))}
                showHybrid
                showRequireOptIn
                pending={updateCampaignMutation.isPending}
                onRouteIdsChange={(ids) => {
                  setScopeRouteIds(ids);
                  setScopeScheduleIds([]);
                }}
                onScheduleIdsChange={setScopeScheduleIds}
                onSave={(input) =>
                  updateCampaignMutation.mutate({
                    id: selectedCampaignId,
                    ...input,
                  })
                }
              />
            ) : null}
            <CampaignCouponsPanel
              coupons={campaignDetailQuery.data?.coupons ?? []}
              isLoading={campaignDetailQuery.isLoading}
              createPending={couponMutation.isPending}
              bulkPending={bulkCouponMutation.isPending}
              deactivatePending={deactivateCouponMutation.isPending}
              selectedCouponId={selectedCouponId}
              onSelectCoupon={setSelectedCouponId}
              onCreate={(code) =>
                couponMutation.mutate({
                  campaignId: selectedCampaignId,
                  code,
                })
              }
              onBulkCreate={({ prefix, count }) =>
                bulkCouponMutation.mutate({
                  campaignId: selectedCampaignId,
                  prefix,
                  count,
                })
              }
              onDeactivate={(id) => deactivateCouponMutation.mutate({ id })}
              onClose={() => {
                setSelectedCampaignId(null);
                setSelectedCouponId(null);
              }}
            />
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900">
                  {selectedCouponId
                    ? "Users who used this code"
                    : "Recent redemptions (campaign)"}
                </h3>
                <p className="text-xs text-slate-500">
                  {redemptionsQuery.data?.total ?? 0} total
                </p>
              </div>
              <CampaignRedemptionsTable
                items={redemptionsQuery.data?.items ?? []}
                isLoading={redemptionsQuery.isLoading}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={exportMutation.isPending}
              onClick={() =>
                exportMutation.mutate({ campaignId: selectedCampaignId })
              }
            >
              Export redemptions CSV
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
