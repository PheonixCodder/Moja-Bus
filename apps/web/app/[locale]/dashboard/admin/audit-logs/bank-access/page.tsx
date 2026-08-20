import { getTranslations } from "next-intl/server";
import { prefetch, HydrateClient, trpc } from "@/trpc/server";
import { AdminBankAccessLogsView } from "../../../../../../features/admin/views/admin-bank-access-logs-view";
import { bankAccessLogSearchParams } from "../../../../../../features/admin/lib/search-params";
import { bankAccessLogSearchParamsCache } from "@/features/admin/lib/search-params";
import type { SearchParams } from "nuqs/server";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";

export const metadata = {
  title: "Bank Access Logs | Admin Dashboard",
};

export default async function BankAccessLogsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const t = await getTranslations("adminDashboard.pages.bankAccess");
  const params = bankAccessLogSearchParamsCache.parse(await searchParams);

  await prefetch(
    trpc.admin.listBankAccessLogs.queryOptions({
      page: params.page,
      limit: 20,
      action: params.action || undefined,
      companyId: params.companyId || undefined,
      userId: params.userId || undefined,
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
        <AdminBankAccessLogsView />
      </AdminPageShell>
    </HydrateClient>
  );
}
