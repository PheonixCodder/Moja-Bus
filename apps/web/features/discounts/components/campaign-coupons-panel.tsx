"use client";

import { Badge } from "@moja/ui/components/ui/badge";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@moja/ui/components/ui/table";
import { format } from "date-fns";
import { Copy, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export type CouponRow = {
  id: string;
  code: string;
  isActive: boolean;
  redemptionCount: number;
  maxRedemptions: number | null;
  expiresAt: Date | string | null;
  createdAt: Date | string;
};

type Props = {
  coupons: CouponRow[];
  isLoading?: boolean;
  createPending?: boolean;
  bulkPending?: boolean;
  deactivatePending?: boolean;
  selectedCouponId?: string | null;
  onSelectCoupon?: (id: string | null) => void;
  onCreate: (code: string) => void;
  onBulkCreate?: (input: { prefix: string; count: number }) => void;
  onDeactivate: (id: string) => void;
  onClose: () => void;
};

export function CampaignCouponsPanel({
  coupons,
  isLoading,
  createPending,
  bulkPending,
  deactivatePending,
  selectedCouponId,
  onSelectCoupon,
  onCreate,
  onBulkCreate,
  onDeactivate,
  onClose,
}: Props) {
  const t = useTranslations("discounts.campaignCoupons");
  const [couponCode, setCouponCode] = useState("");
  const [bulkPrefix, setBulkPrefix] = useState("PROMO");
  const [bulkCount, setBulkCount] = useState("20");

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`Copied ${code}`);
    } catch {
      toast.error("Could not copy");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{t("title")}</h2>
          <p className="text-xs text-slate-500">{t("description")}</p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          {t("close")}
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          className="uppercase"
          placeholder={t("placeholder")}
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
        />
        <Button
          type="button"
          disabled={!couponCode.trim() || createPending}
          onClick={() => {
            onCreate(couponCode.trim());
            setCouponCode("");
          }}
        >
          {t("createCode")}
        </Button>
      </div>

      {onBulkCreate ? (
        <div className="flex flex-col gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50/80 p-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1">
            <p className="text-xs font-medium text-slate-600">
              {t("bulkGenerate")}
            </p>
            <Input
              className="uppercase"
              placeholder={t("prefixPlaceholder")}
              value={bulkPrefix}
              onChange={(e) => setBulkPrefix(e.target.value.toUpperCase())}
            />
          </div>
          <div className="w-full space-y-1 sm:w-28">
            <p className="text-xs font-medium text-slate-600">{t("count")}</p>
            <Input
              inputMode="numeric"
              value={bulkCount}
              onChange={(e) => setBulkCount(e.target.value)}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={
              bulkPending ||
              bulkPrefix.trim().length < 2 ||
              !Number.isFinite(Number(bulkCount)) ||
              Number(bulkCount) < 1
            }
            onClick={() => {
              onBulkCreate({
                prefix: bulkPrefix.trim(),
                count: Math.min(
                  500,
                  Math.max(1, Math.floor(Number(bulkCount))),
                ),
              });
            }}
          >
            {t("generate")}
          </Button>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-slate-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("tableCode")}</TableHead>
              <TableHead>{t("tableStatus")}</TableHead>
              <TableHead>{t("tableUses")}</TableHead>
              <TableHead>{t("tableExpires")}</TableHead>
              <TableHead className="text-right">{t("tableActions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-sm text-slate-500"
                >
                  {t("loading")}
                </TableCell>
              </TableRow>
            ) : coupons.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-sm text-slate-500"
                >
                  {t("noCodes")}
                </TableCell>
              </TableRow>
            ) : (
              coupons.map((c) => (
                <TableRow
                  key={c.id}
                  className={
                    selectedCouponId === c.id ? "bg-pink-50/60" : undefined
                  }
                >
                  <TableCell className="font-mono text-sm font-semibold">
                    {c.code}
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.isActive ? "secondary" : "outline"}>
                      {c.isActive ? "Active" : "Off"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {c.redemptionCount}
                    {c.maxRedemptions != null ? ` / ${c.maxRedemptions}` : ""}
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {c.expiresAt
                      ? format(new Date(c.expiresAt), "dd MMM yyyy")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {onSelectCoupon ? (
                        <Button
                          type="button"
                          size="sm"
                          variant={
                            selectedCouponId === c.id ? "default" : "outline"
                          }
                          onClick={() =>
                            onSelectCoupon(
                              selectedCouponId === c.id ? null : c.id,
                            )
                          }
                        >
                          <Users className="size-3.5" />
                          {t("users")}
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => void copyCode(c.code)}
                      >
                        <Copy className="size-3.5" />
                      </Button>
                      {c.isActive ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={deactivatePending}
                          onClick={() => onDeactivate(c.id)}
                        >
                          {t("deactivate")}
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
