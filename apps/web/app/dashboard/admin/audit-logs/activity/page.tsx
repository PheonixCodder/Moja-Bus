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
        title="Activity Logs"
        description="All notification events fired across the platform via Novu."
        breadcrumbs={[
          { label: "Audit & Security" },
          { label: "Activity Logs" },
        ]}
      >
        <AdminActivityLogsView />
      </AdminPageShell>
    </HydrateClient>
  );
}
