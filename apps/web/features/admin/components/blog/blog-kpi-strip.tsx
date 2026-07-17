"use client";

import { Card } from "@moja/ui/components/ui/card";
import { Badge } from "@moja/ui/components/ui/badge";
import { ArrowUpRight } from "lucide-react";

interface BlogKpiStripProps {
  kpis: {
    totalViews: number;
    publishedCount: number;
    draftCount: number;
    shareCount: number;
    ctaCount: number;
  };
}

export function BlogKpiStrip({ kpis }: BlogKpiStripProps) {
  return (
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <div className="grid grid-cols-2 divide-x divide-y xl:grid-cols-5 xl:divide-y-0">
        
        {/* Total Views */}
        <Card className="flex flex-col gap-1 border-0 rounded-none bg-transparent p-4 shadow-none">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Total Views</p>
            <Badge variant="secondary" className="flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-xs font-normal text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20">
              <ArrowUpRight className="h-3 w-3" />
            </Badge>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold tracking-tight tabular-nums">
              {kpis.totalViews.toLocaleString()}
            </h3>
          </div>
        </Card>

        {/* Published Posts */}
        <Card className="flex flex-col gap-1 border-0 rounded-none bg-transparent p-4 shadow-none">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Published Posts</p>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold tracking-tight tabular-nums">
              {kpis.publishedCount.toLocaleString()}
            </h3>
          </div>
        </Card>

        {/* Draft Posts */}
        <Card className="flex flex-col gap-1 border-0 rounded-none bg-transparent p-4 shadow-none">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Draft Posts</p>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold tracking-tight tabular-nums">
              {kpis.draftCount.toLocaleString()}
            </h3>
          </div>
        </Card>

        {/* Total Shares */}
        <Card className="flex flex-col gap-1 border-0 rounded-none bg-transparent p-4 shadow-none">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Total Shares</p>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold tracking-tight tabular-nums">
              {kpis.shareCount.toLocaleString()}
            </h3>
          </div>
        </Card>

        {/* CTA Clicks */}
        <Card className="flex flex-col gap-1 border-0 rounded-none bg-transparent p-4 shadow-none">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">CTA Clicks</p>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold tracking-tight tabular-nums">
              {kpis.ctaCount.toLocaleString()}
            </h3>
          </div>
        </Card>

      </div>
    </div>
  );
}
