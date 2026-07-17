"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { useQueryState } from "nuqs";
import { BlogKpiStrip } from "./blog-kpi-strip";
import { BlogViewsChart } from "./blog-views-chart";
import { BlogReadDepthChart } from "./blog-read-depth-chart";
import { BlogTopPostsTable } from "./blog-top-posts-table";

export function BlogAnalyticsContent() {
  const trpc = useTRPC();
  const [period] = useQueryState("period", { defaultValue: "30d" });

  const { data } = useSuspenseQuery(
    trpc.admin.getBlogAnalytics.queryOptions({
      period: period as "7d" | "30d" | "90d" | "all",
    })
  );

  return (
    <div className="flex flex-col gap-4">
      <BlogKpiStrip kpis={data.kpis} />
      
      <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <BlogViewsChart data={data.dailyViews} />
        </div>
        <div className="xl:col-span-5">
          <BlogReadDepthChart data={data.readDepth} />
        </div>
      </div>
      
      <BlogTopPostsTable posts={data.topPosts} />
    </div>
  );
}
