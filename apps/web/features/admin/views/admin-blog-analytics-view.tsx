"use client";

import { Spinner } from "@moja/ui/components/ui/spinner";
import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { BlogAnalyticsContent } from "../components/blog/blog-analytics-content";
import { BlogAnalyticsToolbar } from "../components/blog/blog-analytics-toolbar";

export function AdminBlogAnalyticsView() {
  const t = useTranslations("adminDashboard.adminBlogAnalyticsView");
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
