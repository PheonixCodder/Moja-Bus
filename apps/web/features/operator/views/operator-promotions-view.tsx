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
import { Plus, Tag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";

type BenefitType = "PERCENT_OFF" | "FIXED_AMOUNT_OFF";

export function OperatorPromotionsView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [benefitType, setBenefitType] = useState<BenefitType>("PERCENT_OFF");
  const [percentBps, setPercentBps] = useState("1000");
  const [amountXOF, setAmountXOF] = useState("1000");
  const [couponCode, setCouponCode] = useState("");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    null,
  );

  const listQuery = useQuery(
    trpc.discountsOperator.listCampaigns.queryOptions({
      limit: 50,
      offset: 0,
    }),
  );

  const createMutation = useMutation(
    trpc.discountsOperator.createCampaign.mutationOptions({
      onSuccess: async (campaign) => {
        toast.success("Promotion created");
        setShowCreate(false);
        setName("");
        setSelectedCampaignId(campaign.id);
        await queryClient.invalidateQueries(
          trpc.discountsOperator.listCampaigns.pathFilter(),
        );
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const statusMutation = useMutation(
    trpc.discountsOperator.setCampaignStatus.mutationOptions({
      onSuccess: async () => {
        toast.success("Status updated");
        await queryClient.invalidateQueries(
          trpc.discountsOperator.listCampaigns.pathFilter(),
        );
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const couponMutation = useMutation(
    trpc.discountsOperator.createCoupon.mutationOptions({
      onSuccess: async () => {
        toast.success("Coupon created");
        setCouponCode("");
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const items = listQuery.data?.items ?? [];
  const summaryQuery = useQuery(
    trpc.discountsOperator.promotionsSummary.queryOptions(),
  );
  const summary = summaryQuery.data;

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Promotions
          </h1>
          <p className="max-w-xl text-sm text-slate-500">
            Create operator-funded discount codes for your routes. No admin
            approval required; platform can still force-pause.
          </p>
        </div>
        <Button type="button" onClick={() => setShowCreate((v) => !v)}>
          <Plus className="size-4" />
          New promo
        </Button>
      </div>

      {summary ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="p-4">
            <p className="text-xs text-slate-500">Active promos</p>
            <p className="text-xl font-bold">{summary.activeCampaigns}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-slate-500">Redemptions</p>
            <p className="text-xl font-bold">{summary.confirmedRedemptions}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-slate-500">Operator-funded discounts</p>
            <p className="text-xl font-bold">
              {summary.operatorFundedXOF.toLocaleString()} XOF
            </p>
          </Card>
        </div>
      ) : null}

      {showCreate ? (
        <Card className="space-y-4 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="op-promo-name">Name</Label>
              <Input
                id="op-promo-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Weekend flash sale"
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
                </SelectContent>
              </Select>
            </div>
            {benefitType === "PERCENT_OFF" ? (
              <div className="space-y-1.5">
                <Label htmlFor="op-percent">Percent (bps, 1000 = 10%)</Label>
                <Input
                  id="op-percent"
                  type="number"
                  value={percentBps}
                  onChange={(e) => setPercentBps(e.target.value)}
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="op-amount">Amount (XOF)</Label>
                <Input
                  id="op-amount"
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
                  fundingType: "OPERATOR",
                  benefitType,
                  percentBps:
                    benefitType === "PERCENT_OFF"
                      ? Number(percentBps)
                      : undefined,
                  amountXOF:
                    benefitType === "FIXED_AMOUNT_OFF"
                      ? Number(amountXOF)
                      : undefined,
                  platformShareBps: 0,
                  operatorShareBps: 10_000,
                  status: "DRAFT",
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
              <TableHead>Promo</TableHead>
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
                    <Tag className="size-8 opacity-40" />
                    <p className="text-sm font-medium text-slate-700">
                      No promotions yet
                    </p>
                    <p className="text-xs">
                      Launch an operator-funded code to grow bookings on your
                      network.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium text-slate-900">{item.name}</div>
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
                    {item._count.redemptions} · {item._count.coupons} codes
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
                        Coupon
                      </Button>
                      {item.status === "ACTIVE" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={statusMutation.isPending}
                          onClick={() =>
                            statusMutation.mutate({
                              id: item.id,
                              status: "PAUSED",
                            })
                          }
                        >
                          Pause
                        </Button>
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
        <Card className="space-y-3 p-4">
          <h2 className="text-sm font-semibold text-slate-900">Add coupon</h2>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              className="uppercase"
              placeholder="WEEKEND10"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            />
            <Button
              type="button"
              disabled={!couponCode.trim() || couponMutation.isPending}
              onClick={() =>
                couponMutation.mutate({
                  campaignId: selectedCampaignId,
                  code: couponCode.trim(),
                })
              }
            >
              Create code
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setSelectedCampaignId(null)}
            >
              Close
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
