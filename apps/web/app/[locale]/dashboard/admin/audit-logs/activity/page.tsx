import { getTranslations } from "next-intl/server";
import { prefetch, HydrateClient, trpc } from "@/trpc/server";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { AdminActivityLogsView } from "@/features/admin/views/admin-activity-logs-view";
import { adminActivityLogsParamsCache } from "@/features/admin/lib/search-params";
import type { SearchParams } from "nuqs/server";

export const metadata = {
  title: "Activity Logs | Admin",
  description: "Audit all platform notification events across operators, travelers and admins.",
};

export default async function ActivityLogsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const t = await getTranslations("adminDashboard.pages.activityLogs");
  const { search, channel, template, page } = adminActivityLogsParamsCache.parse(
    await searchParams
  );

  await prefetch(
    trpc.admin.listActivityLogs.queryOptions({
      page,
      limit: 20,
      search: search || undefined,
      channels: channel ? [channel] : undefined,
      templates: template ? [template] : undefined,
    })
  );

  return (
    <HydrateClient>
      <AdminPageShell
        title={t("title")}
        description={t("description")}
        breadcrumbs={[
          { label: t("breadcrumbSection") },
          { label: t("breadcrumbPage") },
        ]}
      >
        <AdminActivityLogsView />
      </AdminPageShell>
    </HydrateClient>
  );
}
