import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@moja/ui/components/ui/card";
import { type RouterOutputs } from "@/trpc/client";
import { Badge } from "@moja/ui/components/ui/badge";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@moja/ui/components/ui/table";
import { Button, buttonVariants } from "@moja/ui/components/ui/button";
import { cn } from "@moja/ui/lib/utils";
import Link from "next/link";
import { fr } from "date-fns/locale";
import {formatXOF} from "@/features/operator/lib/currency";

type LedgerEntry = RouterOutputs["operator"]["getRevenueAnalytics"]["recentLedger"][number];

export function RevenueLedgerTable({ recentLedger }: { recentLedger: LedgerEntry[] }) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg font-bold font-display tracking-tight text-slate-900">Recent Transactions</CardTitle>
        <CardDescription>Live feed of your ledger</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {recentLedger.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
            No recent transactions
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentLedger.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    {entry.entryType === "CREDIT" ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 shadow-none border-transparent">
                        CREDIT
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        DEBIT
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {entry.sourceType}
                  </TableCell>
                  <TableCell className="font-medium whitespace-nowrap">
                    {entry.entryType === "CREDIT" ? "+" : "−"}{formatXOF(entry.amountXOF)}
                  </TableCell>
                  <TableCell className="text-right text-xs whitespace-nowrap text-muted-foreground">
                    {format(new Date(entry.createdAt), "dd MMM, HH:mm", { locale: fr })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <div className="mt-auto pt-4 flex justify-end">
          {/* Note: In the future this should point to a dedicated operator ledger page. Currently using placeholder overview. */}
          <Link href="/dashboard/operator" className={cn(buttonVariants({ variant: "link" }), "px-0")}>
            View full ledger →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
