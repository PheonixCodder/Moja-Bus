
import { getTranslations } from "next-intl/server";
import { OperatorRoutesView } from "@/features/operator/views/operator-routes-view";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "operatorDashboard.routes" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function RoutesPage() {
  await Promise.all([
    prefetch(trpc.routes.list.queryOptions()),
  ]);

  return (
    <HydrateClient>
      <OperatorRoutesView />
    </HydrateClient>
  );
}
