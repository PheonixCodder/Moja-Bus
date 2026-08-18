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
import { format } from "date-fns";
import { Bell, Pause, Play, Settings2 } from "lucide-react";

export type CampaignStatus = "DRAFT" | "SCHEDULED" | "ACTIVE" | "PAUSED" | "EXHAUSTED" | "EXPIRED" | "ARCHIVED";

export interface CampaignListItem {
  id: string;
  name: string;
  status: CampaignStatus;
  benefitType: string;
  percentBps?: number | null;
  amountXOF?: number | null;
  budgetXOF?: number | null;
  budgetConsumedXOF: number;
  budgetReservedXOF: number;
  isAutoApply: boolean;
  firstBookingOnly: boolean;
  createdAt: string | Date;
  _count: {
    coupons: number;
    redemptions: number;
  };
}

interface AdminCampaignsTableProps {
  items: CampaignListItem[];
  isLoading: boolean;
  selectedCampaignId: string | null;
  onSelectCampaign: (id: string) => void;
  onStatusChange: (id: string, status: "ACTIVE" | "PAUSED", pauseReason?: string) => void;
  onNotifyPassengers: (id: string) => void;
  statusPending: boolean;
  notifyPending: boolean;
}

function statusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  if (status === "ACTIVE") return "default";
  if (status === "PAUSED") return "secondary";
  if (status === "EXHAUSTED" || status === "EXPIRED") return "destructive";
  return "outline";
}

function benefitLabel(item: { benefitType: string; percentBps?: number | null; amountXOF?: number | null }) {
  if (item.benefitType === "PERCENT_OFF") return `${(item.percentBps ?? 0) / 100}% off`;
  if (item.benefitType === "FIXED_AMOUNT_OFF") return `${item.amountXOF?.toLocaleString()} XOF off`;
  if (item.benefitType === "WALLET_CREDIT_GRANT") return `+${item.amountXOF?.toLocaleString()} XOF credit`;
  return item.benefitType;
}

export function AdminCampaignsTable({
  items,
  isLoading,
  selectedCampaignId,
  onSelectCampaign,
  onStatusChange,
  onNotifyPassengers,
  statusPending,
  notifyPending,
}: AdminCampaignsTableProps) {
  return (
    <Card className="overflow-hidden border-slate-200/80 shadow-xs bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
            <TableHead className="font-semibold text-slate-700">Campaign</TableHead>
            <TableHead className="font-semibold text-slate-700">Benefit</TableHead>
            <TableHead className="font-semibold text-slate-700">Status</TableHead>
            <TableHead className="font-semibold text-slate-700">Budget used</TableHead>
            <TableHead className="font-semibold text-slate-700">Redemptions</TableHead>
            <TableHead className="font-semibold text-slate-700">Created</TableHead>
            <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="py-12 text-center text-sm text-slate-500">
                Loading campaigns...
              </TableCell>
            </TableRow>
          ) : items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-12 text-center text-sm text-slate-500">
                No marketing campaigns found. Create your first campaign to get started.
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => {
              const spent = item.budgetConsumedXOF + item.budgetReservedXOF;
              const hasBudget = item.budgetXOF != null && item.budgetXOF > 0;
              const pct = hasBudget ? Math.min(100, Math.round((spent / item.budgetXOF!) * 100)) : 0;
              const isSelected = selectedCampaignId === item.id;

              return (
                <TableRow
                  key={item.id}
                  className={`transition-colors ${
                    isSelected ? "bg-amber-50/40 hover:bg-amber-50/60" : "hover:bg-slate-50/60"
                  }`}
                >
                  <TableCell>
                    <div className="font-medium text-slate-900">{item.name}</div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                      {item.isAutoApply && (
                        <span className="inline-flex items-center rounded-sm bg-pink-50 px-1.5 py-0.5 text-[10px] font-medium text-[#ee237c] ring-1 ring-inset ring-pink-700/10">
                          Auto-apply
                        </span>
                      )}
                      {item.firstBookingOnly && (
                        <span className="inline-flex items-center rounded-sm bg-pink-50 px-1.5 py-0.5 text-[10px] font-medium text-[#ee237c] ring-1 ring-pink-700/10">
                          1st booking
                        </span>
                      )}
                      <span className="font-mono text-[11px] text-slate-400">{item.id.slice(-6)}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-800">
                      {benefitLabel(item)}
                    </span>
                  </TableCell>

                  <TableCell>
                    <Badge variant={statusVariant(item.status)} className="capitalize">
                      {item.status.toLowerCase()}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-sm">
                    {hasBudget ? (
                      <div className="space-y-1 min-w-[120px]">
                        <div className="flex justify-between text-xs text-slate-600">
                          <span className="font-medium">{spent.toLocaleString()} XOF</span>
                          <span className="text-slate-400">{pct}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              pct >= 90 ? "bg-rose-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Unlimited</span>
                    )}
                  </TableCell>

                  <TableCell className="text-sm text-slate-600">
                    <span className="font-semibold text-slate-900 tabular-nums">
                      {item._count.redemptions}
                    </span>
                    <span className="text-slate-400"> uses · </span>
                    <span className="tabular-nums font-semibold text-slate-900">{item._count.coupons}</span>
                    <span className="text-slate-400"> codes</span>
                  </TableCell>

                  <TableCell className="whitespace-nowrap text-sm text-slate-500">
                    {format(new Date(item.createdAt), "dd MMM yyyy")}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant={isSelected ? "default" : "outline"}
                        onClick={() => onSelectCampaign(item.id)}
                        className="gap-1.5 font-medium"
                      >
                        <Settings2 className="size-3.5" />
                        Manage
                      </Button>

                      {item.status === "ACTIVE" ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={notifyPending}
                            onClick={() => onNotifyPassengers(item.id)}
                            title="Notify opted-in passengers"
                            className="size-8 p-0 text-slate-500 hover:text-slate-900"
                          >
                            <Bell className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={statusPending}
                            onClick={() => onStatusChange(item.id, "PAUSED", "Paused from admin dashboard")}
                            title="Pause campaign"
                            className="size-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          >
                            <Pause className="size-3.5" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={statusPending}
                          onClick={() => onStatusChange(item.id, "ACTIVE")}
                          title="Activate campaign"
                          className="size-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        >
                          <Play className="size-3.5" />
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
  );
}
