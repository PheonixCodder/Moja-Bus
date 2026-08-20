import { getTranslations } from "next-intl/server";
import { HydrateClient, trpc, prefetch } from "@/trpc/server";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { AdminWebhookLogsView } from "@/features/admin/views/admin-webhook-logs-view";
import { webhookLogsSearchParamsCache } from "@/features/admin/lib/search-params";
import type { SearchParams } from "nuqs/server";
import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Webhook Audit | Admin",
  description: "Monitor and debug system webhooks and events.",
};

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export default async function WebhookLogsPage({ searchParams }: PageProps) {
  const t = await getTranslations("adminDashboard.pages.webhooks");
  const params = await searchParams.then((p) => webhookLogsSearchParamsCache.parse(p));

  await prefetch(
    trpc.admin.listWebhookEvents.queryOptions({
      page: params.page - 1,
      limit: params.pageSize,
      search: params.search || undefined,
      status: params.status,
      provider: params.provider,
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
        <AdminWebhookLogsView />
      </AdminPageShell>
    </HydrateClient>
  );
}
