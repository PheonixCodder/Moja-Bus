import { Card, CardContent, CardHeader, CardTitle } from "@moja/ui/components/ui/card";
import { formatXOF } from "../../lib/currency";
import { type RouterOutputs } from "@/trpc/client";

type TopRoute = RouterOutputs["operator"]["getRevenueAnalytics"]["topRoutes"][number];

export function TopRoutesTable({ topRoutes }: { topRoutes: TopRoute[] }) {
  if (topRoutes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold font-display tracking-tight text-slate-900">Top Performing Routes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[250px] items-center justify-center text-muted-foreground text-sm">
            No completed trips in this period
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxNet = Math.max(...topRoutes.map(r => r.totalNetXOF));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold font-display tracking-tight text-slate-900">Top Performing Routes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {topRoutes.map((route, i) => {
            const percentage = maxNet > 0 ? (route.totalNetXOF / maxNet) * 100 : 0;
            return (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="font-medium truncate mr-4">{route.routeLabel}</div>
                  <div className="font-bold">{formatXOF(route.totalNetXOF)}</div>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  {route.bookingsCount} booking{route.bookingsCount !== 1 ? 's' : ''}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
