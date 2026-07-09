import { Card, CardContent, CardHeader, CardTitle } from "@moja/ui/components/ui/card";
import { TrendingUp, Coins, Percent, Wallet, RotateCcw } from "lucide-react";
import { type RouterOutputs } from "@/trpc/client";
import {formatXOF} from "@/features/operator/lib/currency";

type KPIs = RouterOutputs["operator"]["getRevenueAnalytics"]["kpis"];

export function RevenueKpiCards({ kpis }: { kpis: KPIs }) {
  const cards = [
    {
      title: "Net Earned",
      value: formatXOF(kpis.netRevenueXOF),
      subtitle: "After platform commission",
      icon: TrendingUp,
      iconClass: "text-emerald-500",
      bgClass: "bg-emerald-500/10",
    },
    {
      title: "Gross Volume",
      value: formatXOF(kpis.grossRevenueXOF),
      subtitle: "Total passenger payments",
      icon: Coins,
      iconClass: "text-indigo-500",
      bgClass: "bg-indigo-500/10",
    },
    {
      title: "Commission",
      value: formatXOF(kpis.commissionXOF),
      subtitle: "Platform fee deducted",
      icon: Percent,
      iconClass: "text-amber-500",
      bgClass: "bg-amber-500/10",
    },
    {
      title: "Ledger Balance",
      value: formatXOF(kpis.ledgerBalanceXOF),
      subtitle: "Available for settlement",
      icon: Wallet,
      iconClass: "text-blue-500",
      bgClass: "bg-blue-500/10",
    },
    {
      title: "Refunds",
      value: formatXOF(kpis.refundsIssuedXOF),
      subtitle: "Cancelled bookings",
      icon: RotateCcw,
      iconClass: "text-rose-500",
      bgClass: "bg-rose-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-md ${card.bgClass}`}>
              <card.icon className={`h-4 w-4 ${card.iconClass}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-display">{card.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
