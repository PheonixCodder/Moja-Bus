"use client";

import { Badge } from "@moja/ui/components/ui/badge";
import { Button } from "@moja/ui/components/ui/button";
import { Card } from "@moja/ui/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@moja/ui/components/ui/dialog";
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
import {
  Bell,
  Download,
  Megaphone,
  Pause,
  Play,
  Plus,
  Search,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CampaignCouponsPanel } from "@/features/discounts/components/campaign-coupons-panel";
import { CampaignRedemptionsTable } from "@/features/discounts/components/campaign-redemptions-table";
import { CampaignSettingsEditor } from "@/features/discounts/components/campaign-settings-editor";
import { InfoTooltip } from "@/features/discounts/components/info-tooltip";
import { ReferralFunnelBars } from "@/features/discounts/components/referral-funnel-bars";
import { useTRPC } from "@/trpc/client";

type BenefitType = "PERCENT_OFF" | "FIXED_AMOUNT_OFF" | "WALLET_CREDIT_GRANT";

function statusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  if (status === "ACTIVE") return "default";
  if (status === "PAUSED") return "secondary";
  return "outline";
}

function benefitLabel(item: { benefitType: string; percentBps?: number | null; amountXOF?: number | null }) {
  if (item.benefitType === "PERCENT_OFF") return `${(item.percentBps ?? 0) / 100}% off`;
  if (item.benefitType === "FIXED_AMOUNT_OFF") return `${item.amountXOF?.toLocaleString()} XOF off`;
  if (item.benefitType === "WALLET_CREDIT_GRANT") return `+${item.amountXOF?.toLocaleString()} XOF credit`;
  return item.benefitType;
}

export function AdminCampaignsView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // List & search
  const [search, setSearch] = useState("");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null);
  const [scopeRouteIds, setScopeRouteIds] = useState<string[]>([]);
  const [scopeScheduleIds, setScopeScheduleIds] = useState<string[]>([]);

  // Create wizard
  const [createOpen, setCreateOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [benefitType, setBenefitType] = useState<BenefitType>("PERCENT_OFF");
  const [percentOff, setPercentOff] = useState("10");
  const [amountXOF, setAmountXOF] = useState("1000");

  function openCreate() {
    setName("");
    setBenefitType("PERCENT_OFF");
    setPercentOff("10");
    setAmountXOF("1000");
    setWizardStep(1);
    setCreateOpen(true);
  }

  // Queries
  const listQuery = useQuery(
    trpc.discountsAdmin.listCampaigns.queryOptions({
      search: search || undefined,
      limit: 50,
      offset: 0,
    }),
  );
  const summaryQuery = useQuery(trpc.discountsAdmin.marketingSummary.queryOptions());
  const summary = summaryQuery.data;
  const funnel = summary?.referralFunnel ?? {};

  const campaignDetailQuery = useQuery({
    ...trpc.discountsAdmin.getCampaign.queryOptions({ id: selectedCampaignId ?? "" }),
    enabled: Boolean(selectedCampaignId),
  });

  useEffect(() => {
    const detail = campaignDetailQuery.data;
    if (!detail) return;
    setScopeRouteIds(detail.routeScopes.map((s) => s.routeId));
    setScopeScheduleIds(detail.scheduleScopes.map((s) => s.scheduleId));
  }, [campaignDetailQuery.data]);

  const performanceQuery = useQuery({
    ...trpc.discountsAdmin.campaignPerformance.queryOptions({ campaignId: selectedCampaignId ?? "" }),
    enabled: Boolean(selectedCampaignId),
  });

  // Redemptions: when a specific coupon is selected, pass ONLY couponCodeId (not campaignId)
  // to get all users who used that specific code, regardless of campaign.
  const redemptionsQuery = useQuery({
    ...trpc.discountsAdmin.listRedemptions.queryOptions({
      ...(selectedCouponId
        ? { couponCodeId: selectedCouponId }
        : { campaignId: selectedCampaignId ?? undefined }),
      limit: 50,
      offset: 0,
    }),
    enabled: Boolean(selectedCampaignId),
  });

  const routesQuery = useQuery(trpc.admin.listRoutes.queryOptions({ page: 1, pageSize: 100 }));
  const schedulesQuery = useQuery({
    ...trpc.discountsAdmin.listScopeSchedules.queryOptions({ routeIds: scopeRouteIds, limit: 100 }),
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

  // Mutations
  const createMutation = useMutation(
    trpc.discountsAdmin.createCampaign.mutationOptions({
      onSuccess: async (campaign) => {
        toast.success("Campaign created — add codes, then Activate");
        setCreateOpen(false);
        setSelectedCampaignId(campaign.id);
        await queryClient.invalidateQueries(trpc.discountsAdmin.listCampaigns.pathFilter());
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const statusMutation = useMutation(
    trpc.discountsAdmin.setCampaignStatus.mutationOptions({
      onSuccess: async () => {
        toast.success("Status updated");
        await queryClient.invalidateQueries(trpc.discountsAdmin.listCampaigns.pathFilter());
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const couponMutation = useMutation(
    trpc.discountsAdmin.createCoupon.mutationOptions({
      onSuccess: async () => {
        toast.success("Coupon created");
        await Promise.all([
          queryClient.invalidateQueries(trpc.discountsAdmin.listCampaigns.pathFilter()),
          selectedCampaignId
            ? queryClient.invalidateQueries(trpc.discountsAdmin.getCampaign.queryFilter({ id: selectedCampaignId }))
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
            ? queryClient.invalidateQueries(trpc.discountsAdmin.getCampaign.queryFilter({ id: selectedCampaignId }))
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
            ? queryClient.invalidateQueries(trpc.discountsAdmin.getCampaign.queryFilter({ id: selectedCampaignId }))
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
            ? queryClient.invalidateQueries(trpc.discountsAdmin.getCampaign.queryFilter({ id: selectedCampaignId }))
            : Promise.resolve(),
        ]);
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const exportMutation = useMutation({
    mutationFn: async (input: { campaignId?: string }) => {
      return queryClient.fetchQuery(
        trpc.discountsAdmin.exportRedemptionsCsv.queryOptions({ campaignId: input.campaignId, limit: 1000 }),
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
  const performance = performanceQuery.data;

  return (
    <div className="space-y-6">
      {/* KPI Summary */}
      {summary && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Active campaigns</p>
              <InfoTooltip content="Number of campaigns currently live and redeemable by passengers at checkout." />
            </div>
            <p className="mt-1.5 text-2xl font-bold tabular-nums text-slate-900">{summary.activeCampaigns}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Confirmed redemptions</p>
              <InfoTooltip content="Total successful completed bookings where a discount code or promo credit was redeemed." />
            </div>
            <p className="mt-1.5 text-2xl font-bold tabular-nums text-slate-900">{summary.confirmedRedemptions.toLocaleString()}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Platform promo expense</p>
              <InfoTooltip content="Cumulative financial discount absorbed and funded directly by the platform in XOF." />
            </div>
            <p className="mt-1.5 text-2xl font-bold tabular-nums text-slate-900">{summary.platformExpenseXOF.toLocaleString()} <span className="text-sm font-medium text-slate-400">XOF</span></p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Open voucher liability</p>
              <InfoTooltip content="Total outstanding monetary value of unused cancellation vouchers issued to passengers." />
            </div>
            <p className="mt-1.5 text-2xl font-bold tabular-nums text-slate-900">{summary.voucherLiabilityXOF.toLocaleString()} <span className="text-sm font-medium text-slate-400">XOF</span></p>
            <p className="mt-1 text-[11px] text-slate-400">
              {summary.abuseEventsLast7d} abuse events (7d) · {summary.creditOutstandingXOF.toLocaleString()} XOF credits outstanding
            </p>
          </Card>
        </div>
      )}

      {/* Voucher aging & referral funnel */}
      {summary?.voucherAging && (
        <div className="grid gap-3 lg:grid-cols-2">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Voucher liability aging</p>
              <InfoTooltip content="Breakdown of unredeemed cancellation voucher liabilities segmented by issue age." />
            </div>
            <div className="mt-3 grid grid-cols-4 gap-3">
              {(
                [
                  ["0–30d", summary.voucherAging.d0to30],
                  ["30–90d", summary.voucherAging.d30to90],
                  ["90–365d", summary.voucherAging.d90to365],
                  ["365d+", summary.voucherAging.d365plus],
                ] as const
              ).map(([label, bucket]) => (
                <div key={label}>
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums text-slate-900">
                    {bucket.remainingXOF.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-slate-400">{bucket.count} vouchers</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Referral funnel</p>
                <p className="mt-0.5 text-[11px] text-slate-400">Platform-wide attributed → qualified → rewarded</p>
              </div>
              <InfoTooltip content="Tracks conversion from referred user signup (Attributed), to first paid trip (Qualified), to credit payout (Rewarded)." />
            </div>
            <ReferralFunnelBars
              className="mt-4 space-y-3"
              steps={[
                { key: "ATTRIBUTED", label: "Attributed", count: Number(funnel["ATTRIBUTED"] ?? 0) },
                { key: "QUALIFIED", label: "Qualified", count: Number(funnel["QUALIFIED"] ?? 0) },
                { key: "REWARDED", label: "Rewarded", count: Number(funnel["REWARDED"] ?? 0) },
              ]}
            />
          </Card>
        </div>
      )}

      {/* Search & actions bar */}
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
        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="outline" disabled={exportMutation.isPending} onClick={() => exportMutation.mutate({})}>
            <Download className="size-4" />
            Export CSV
          </Button>
          <Button type="button" onClick={openCreate}>
            <Plus className="size-4" />
            New campaign
          </Button>
        </div>
      </div>

      {/* Create Campaign Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="size-4 text-orange-500" />
              {wizardStep === 1 ? "Create campaign" : "Configure benefit"}
            </DialogTitle>
            <DialogDescription>
              {wizardStep === 1
                ? "Name your campaign and choose the discount type."
                : "Set the discount value. You can add coupon codes and advanced limits after creation."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            {wizardStep === 1 ? (
              <>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="campaign-name">Campaign name</Label>
                    <InfoTooltip content="A public-facing or promotional title for this discount initiative." />
                  </div>
                  <Input
                    id="campaign-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Summer launch — 10% off"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Label>Benefit type</Label>
                    <InfoTooltip content="Choose how the discount is calculated: percentage off, fixed monetary reduction, or direct wallet credit grant." />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { value: "PERCENT_OFF", label: "% Off", desc: "Percentage off ticket" },
                        { value: "FIXED_AMOUNT_OFF", label: "Fixed", desc: "Fixed XOF off ticket" },
                        { value: "WALLET_CREDIT_GRANT", label: "Credit", desc: "Grant promo credits" },
                      ] as { value: BenefitType; label: string; desc: string }[]
                    ).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setBenefitType(opt.value)}
                        className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                          benefitType === opt.value
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                        }`}
                      >
                        <p className="font-semibold">{opt.label}</p>
                        <p className={`text-[11px] ${benefitType === opt.value ? "text-slate-300" : "text-slate-400"}`}>
                          {opt.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                  <Button type="button" disabled={!name.trim()} onClick={() => setWizardStep(2)}>
                    Next →
                  </Button>
                </div>
              </>
            ) : (
              <>
                {benefitType === "PERCENT_OFF" ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="percent-off">Discount percentage</Label>
                      <InfoTooltip content="The percentage deducted from the ticket price at checkout (e.g. 15 for 15% off)." />
                    </div>
                    <div className="relative">
                      <Input
                        id="percent-off"
                        type="number"
                        min={1}
                        max={100}
                        value={percentOff}
                        onChange={(e) => setPercentOff(e.target.value)}
                        className="pr-8"
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="amount-xof">
                        {benefitType === "WALLET_CREDIT_GRANT" ? "Credit amount" : "Discount amount"}
                      </Label>
                      <InfoTooltip content="The fixed monetary value in XOF deducted per booking or credited to the traveler's promo balance." />
                    </div>
                    <div className="relative">
                      <Input
                        id="amount-xof"
                        type="number"
                        value={amountXOF}
                        onChange={(e) => setAmountXOF(e.target.value)}
                        className="pr-12"
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">XOF</span>
                    </div>
                  </div>
                )}
                <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
                  Campaign starts as <strong>Draft</strong>. After creation you can add coupon codes, set date ranges, and configure budget limits before activating.
                </p>
                <div className="flex justify-between gap-2 pt-1">
                  <Button type="button" variant="ghost" onClick={() => setWizardStep(1)}>← Back</Button>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                    <Button
                      type="button"
                      disabled={!name.trim() || createMutation.isPending}
                      onClick={() =>
                        createMutation.mutate({
                          name: name.trim(),
                          fundingType: "PLATFORM",
                          benefitType,
                          percentBps: benefitType === "PERCENT_OFF" ? Math.round(Number(percentOff) * 100) : undefined,
                          amountXOF:
                            benefitType === "FIXED_AMOUNT_OFF" || benefitType === "WALLET_CREDIT_GRANT"
                              ? Number(amountXOF)
                              : undefined,
                          platformShareBps: 10_000,
                          operatorShareBps: 0,
                          status: "DRAFT",
                          isAutoApply: benefitType !== "WALLET_CREDIT_GRANT",
                        })
                      }
                    >
                      {createMutation.isPending ? "Creating…" : "Create draft"}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Campaigns table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/60">
              <TableHead className="font-semibold text-slate-600">Campaign</TableHead>
              <TableHead className="font-semibold text-slate-600">Benefit</TableHead>
              <TableHead className="font-semibold text-slate-600">Status</TableHead>
              <TableHead className="font-semibold text-slate-600">Usage</TableHead>
              <TableHead className="font-semibold text-slate-600">Created</TableHead>
              <TableHead className="text-right font-semibold text-slate-600">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-16 text-center">
                  <div className="mx-auto flex max-w-xs flex-col items-center gap-3">
                    <div className="flex size-12 items-center justify-center rounded-full bg-slate-100">
                      <Megaphone className="size-6 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">No campaigns yet</p>
                      <p className="mt-0.5 text-xs text-slate-400">Create a platform-funded promo to start issuing coupons.</p>
                    </div>
                    <Button type="button" size="sm" onClick={openCreate}>
                      <Plus className="size-3.5" />
                      New campaign
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow
                  key={item.id}
                  className={selectedCampaignId === item.id ? "bg-slate-50" : "hover:bg-slate-50/50"}
                >
                  <TableCell>
                    <div className="font-medium text-slate-900">{item.name}</div>
                    <div className="mt-0.5 text-[11px] text-slate-400">{item.fundingType}</div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      {benefitLabel(item)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(item.status)} className="capitalize">
                      {item.status.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    <span className="font-semibold tabular-nums">{item._count.redemptions}</span>
                    <span className="text-slate-400"> uses · </span>
                    <span className="tabular-nums">{item._count.coupons}</span>
                    <span className="text-slate-400"> codes</span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-slate-500">
                    {format(new Date(item.createdAt), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant={selectedCampaignId === item.id ? "default" : "outline"}
                        onClick={() => {
                          setSelectedCampaignId(item.id);
                          setSelectedCouponId(null);
                        }}
                      >
                        Manage
                      </Button>
                      {item.status === "ACTIVE" ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={notifyMutation.isPending}
                            onClick={() => notifyMutation.mutate({ campaignId: item.id })}
                            title="Notify opted-in passengers"
                          >
                            <Bell className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={statusMutation.isPending}
                            onClick={() =>
                              statusMutation.mutate({ id: item.id, status: "PAUSED", pauseReason: "Paused from admin UI" })
                            }
                            title="Pause"
                          >
                            <Pause className="size-3.5" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={statusMutation.isPending}
                          onClick={() => statusMutation.mutate({ id: item.id, status: "ACTIVE" })}
                          title="Activate"
                        >
                          <Play className="size-3.5" />
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

      {/* Selected campaign detail */}
      {selectedCampaignId && (
        <Card className="space-y-5 p-5">
          {/* Performance stats */}
          {performance && (
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Performance — {performance.campaign.name}
                </p>
                <InfoTooltip content="Real-time financial performance, ticket discounts, and funding splits for this specific campaign." />
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-slate-500">Confirmed redemptions</p>
                  <p className="mt-0.5 text-lg font-bold tabular-nums text-slate-900">{performance.confirmedRedemptions}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Ticket discount</p>
                  <p className="mt-0.5 text-lg font-bold tabular-nums text-slate-900">
                    {performance.ticketDiscountXOF.toLocaleString()} <span className="text-sm font-medium text-slate-400">XOF</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Platform funded</p>
                  <p className="mt-0.5 text-lg font-bold tabular-nums text-slate-900">
                    {performance.platformFundedXOF.toLocaleString()} <span className="text-sm font-medium text-slate-400">XOF</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Operator funded</p>
                  <p className="mt-0.5 text-lg font-bold tabular-nums text-slate-900">
                    {performance.operatorFundedXOF.toLocaleString()} <span className="text-sm font-medium text-slate-400">XOF</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="h-px bg-slate-100" />

          {/* Settings editor */}
          {campaignDetailQuery.data && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Campaign settings</p>
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
                tripOptions={(tripsQuery.data ?? []).map((t) => ({ id: t.id, name: t.name }))}
                showHybrid
                showRequireOptIn
                pending={updateCampaignMutation.isPending}
                onRouteIdsChange={(ids) => {
                  setScopeRouteIds(ids);
                  setScopeScheduleIds([]);
                }}
                onScheduleIdsChange={setScopeScheduleIds}
                onSave={(input) => updateCampaignMutation.mutate({ id: selectedCampaignId, ...input })}
              />
            </div>
          )}

          <div className="h-px bg-slate-100" />

          {/* Coupons panel */}
          <CampaignCouponsPanel
            coupons={campaignDetailQuery.data?.coupons ?? []}
            isLoading={campaignDetailQuery.isLoading}
            createPending={couponMutation.isPending}
            bulkPending={bulkCouponMutation.isPending}
            deactivatePending={deactivateCouponMutation.isPending}
            selectedCouponId={selectedCouponId}
            onSelectCoupon={setSelectedCouponId}
            onCreate={(code) => couponMutation.mutate({ campaignId: selectedCampaignId, code })}
            onBulkCreate={({ prefix, count }) =>
              bulkCouponMutation.mutate({ campaignId: selectedCampaignId, prefix, count })
            }
            onDeactivate={(id) => deactivateCouponMutation.mutate({ id })}
            onClose={() => {
              setSelectedCampaignId(null);
              setSelectedCouponId(null);
            }}
          />

          <div className="h-px bg-slate-100" />

          {/* Redemptions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {selectedCouponId ? "Users who used this code" : "Recent redemptions"}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {redemptionsQuery.data?.total ?? 0} total
                  {selectedCouponId && (
                    <button
                      type="button"
                      onClick={() => setSelectedCouponId(null)}
                      className="ml-2 text-blue-600 underline-offset-2 hover:underline"
                    >
                      Clear filter
                    </button>
                  )}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={exportMutation.isPending}
                onClick={() => exportMutation.mutate({ campaignId: selectedCampaignId })}
              >
                <Download className="size-3.5" />
                Export CSV
              </Button>
            </div>
            <CampaignRedemptionsTable
              items={redemptionsQuery.data?.items ?? []}
              isLoading={redemptionsQuery.isLoading}
            />
          </div>
        </Card>
      )}
    </div>
  );
}
