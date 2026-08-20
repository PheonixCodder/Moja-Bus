"use client";

import { Badge } from "@moja/ui/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@moja/ui/components/ui/table";
import { format } from "date-fns";
import { useTranslations } from "next-intl";

export type RedemptionRow = {
  id: string;
  status: string;
  instrumentType: string;
  ticketDiscountXOF: number;
  createdAt: Date | string;
  couponCode: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
  } | null;
};

type Props = {
  items: RedemptionRow[];
  isLoading?: boolean;
  emptyHint?: string;
};

export function CampaignRedemptionsTable({
  items,
  isLoading,
  emptyHint = "No redemptions yet for this filter.",
}: Props) {
  const t = useTranslations("discounts.campaignRedemptions");

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("tableWhen")}</TableHead>
            <TableHead>{t("tableUser")}</TableHead>
            <TableHead>{t("tableCode")}</TableHead>
            <TableHead>{t("tableDiscount")}</TableHead>
            <TableHead>{t("tableStatus")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-sm text-slate-500">
                {t("loading")}
              </TableCell>
            </TableRow>
          ) : items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-sm text-slate-500">
                {emptyHint}
              </TableCell>
            </TableRow>
          ) : (
            items.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="whitespace-nowrap text-sm text-slate-500">
                  {format(new Date(r.createdAt), "dd MMM yyyy HH:mm")}
                </TableCell>
                <TableCell>
                  {r.user ? (
                    <div>
                      <div className="text-sm font-medium text-slate-900">
                        {r.user.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {r.user.email}
                        {r.user.phone !== "—" ? ` · ${r.user.phone}` : ""}
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400">{t("guestUnknown")}</span>
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {r.couponCode ?? "—"}
                </TableCell>
                <TableCell className="text-sm tabular-nums">
                  {r.ticketDiscountXOF.toLocaleString()} XOF
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{r.status}</Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
