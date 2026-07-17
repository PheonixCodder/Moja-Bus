"use client";

import { Suspense } from "react";
import { BlogAnalyticsToolbar } from "../components/blog/blog-analytics-toolbar";
import { BlogAnalyticsContent } from "../components/blog/blog-analytics-content";
import { Spinner } from "@moja/ui/components/ui/spinner";

export function AdminBlogAnalyticsView() {
  return (
    <div className="flex flex-col gap-4">
      <BlogAnalyticsToolbar />
      <Suspense
        fallback={
          <div className="flex h-96 items-center justify-center">
            <Spinner className="size-8 text-slate-400" />
          </div>
        }
      >
        <BlogAnalyticsContent />
      </Suspense>
    </div>
  );
}
